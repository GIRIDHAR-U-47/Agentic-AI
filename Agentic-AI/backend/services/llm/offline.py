"""Deterministic extractive provider -- works with zero API credentials.

This is NOT a stub. It is a real, fully-specified extractive summariser that
answers a question using only sentences that physically occur in the retrieved
passages, each one carrying its own citation marker. Because it cannot invent
wording, the citations it emits are verifiable by construction, which makes it
the reference implementation of the project's core promise.

It exists for three concrete reasons:

1. The demo, the automated tests and the evaluation harness must run with no
   secrets in Git. Without this, "no API key" would mean "no results at all".
2. It is the honest fallback when a hosted provider errors, so the system
   degrades to grounded extraction rather than to fabrication.
3. It gives the evaluator a fixed reference point. Any difference between this
   provider and a hosted LLM is then attributable to the LLM, not to noise.

The UI labels its output "Extractive (no LLM)" so it is never mistaken for a
generative answer.
"""
from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Sequence, Tuple

from services.llm.base import BaseLLM, LLMResult, _Timer
from services.retrieval import STOPWORDS, tokenize

_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-Z(\[\"0-9])")
_EVIDENCE_BLOCK = re.compile(
    r"^\[EVIDENCE\s+(\w+)\]\s*(.*?)$", re.M
)
_KNOWN_IDS = re.compile(
    r"(?<![\w-])((?:arxiv_[0-9_]+)|(?:[A-Za-z0-9_\-]{3,60}_[0-9a-f]{8}))(?![\w-])"
)
# An evidence block ends at the next block, a `---` separator, or the next
# `=== SECTION ===` header. Terminating on the header matters: otherwise the
# final block runs to end-of-prompt and the model will happily quote the
# question back as if it were a source sentence.
_EVIDENCE_INLINE = re.compile(
    r"\[EVIDENCE\s+(\w+)\](.*?)(?=\[EVIDENCE\s+\w+\]|\n\s*-{3,}\s*\n|\n\s*={3,}.*?={3,}|\Z)",
    re.S,
)


def split_sentences(text: str) -> List[str]:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return []
    parts = _SENT_SPLIT.split(text)
    return [p.strip() for p in parts if len(p.strip()) >= 25]


# `A.4.3 PATCHING AND CHANNEL-INDEPENDENCE Implementation Details.` lands in the
# sentence stream and repeats the query terms, so term-overlap scoring ranks it
# above the actual definition. Headings are structurally distinguishable, but
# the distinction has to be made carefully: an over-eager rule silently *drops*
# real claims from verification, which turns the safety check into a no-op.
_FINITE_VERB_HINT = re.compile(
    r"\b(is|are|was|were|be|been|being|has|have|had|do|does|did|can|could|will|would|"
    r"may|might|must|shall|should|show|shows|shown|propose|proposes|proposed|"
    r"introduce|introduces|introduced|use|uses|used|find|finds|found|"
    r"present|presents|presented|achieve|achieves|achieved|reduce|reduces|"
    r"improve|improves|improved|outperform|outperforms|enable|enables|enabled|"
    r"allow|allows|require|requires|compare|compares|compared|consist|consists|"
    r"grow|grows|grew|increase|increases|increase|decrease|decreases|decrease|"
    r"remain|remains|remain|cost|costs|scale|scales|rise|rises|fall|falls|"
    r"depend|depends|rely|relies|exceed|exceeds|train|trains|apply|applies|"
    r"extend|extends|adopt|adopts|design|designs|build|builds|obtain|obtains)\b",
    re.I,
)
_NUMBERED_HEADING = re.compile(r"^(?:[A-Z]|\d)+(?:\.\d+)*\.?\s+[A-Z]")
_TABLE_ROW = re.compile(r"^[\w\.\-\s]{0,20}[\d\.\,]{3,}[\w\.\-\s%]*$")
_SENTENCE_END = re.compile(r"[.!?][\"')\]]?$")


def is_heading(sentence: str) -> bool:
    """True when a `sentence` is really a section/subsection heading.

    The rule that matters: a string ending in terminal sentence punctuation is
    treated as a *claim* unless it also matches a strong structural heading
    pattern. Without that asymmetry, `"Attention cost grows quadratically with
    sequence length."` (8 words, no listed verb) was classified as a heading and
    dropped -- so the verifier silently passed a sentence it never examined.
    """
    s = (sentence or "").strip()
    if not s:
        return True
    words = s.split()
    if _TABLE_ROW.match(s):
        return True
    if _NUMBERED_HEADING.match(s) and len(words) < 14:
        return True
    # All-caps runs (excluding the first word) read as a heading.
    if len(words) >= 3 and sum(1 for w in words[1:] if w.isupper() and len(w) > 1) / len(words[1:]) > 0.6:
        return True
    if _SENTENCE_END.search(s):
        # Ends like a sentence: only a title-cased run of a few words is a heading.
        if len(words) < 7 and sum(1 for w in words if w[:1].isupper()) / len(words) > 0.8:
            return True
        return False
    # No terminal punctuation: short + no finite verb is a heading.
    if len(words) < 9 and not _FINITE_VERB_HINT.search(s):
        return True
    return False


# An extracted sentence is quoted without its neighbours, so a sentence that
# opens with a bare deictic is unreadable and, worse, unverifiable:
# "The problem can be alleviated by expanding the receptive field." names no
# problem. Requiring a named subject is what makes extraction honest.
_DEICTIC_OPENER = re.compile(
    r"^(this|that|these|those|it|they|he|she|him|her|its|their|such|which|who|"
    r"the former|the latter|the above|the following|the former)\b",
    re.I,
)
# Abstract-noun subjects are also dangling references, just a step removed:
# "The problem can be alleviated by expanding the receptive field." reads as a
# finding on its own and is traceable to no particular paper's claim. Nouns
# naming a *method* ("the model", "the approach") are deliberately excluded --
# those are recoverable from the citation marker, so quoting them stays honest.
_ABSTRACT_SUBJECT = re.compile(
    r"^the\s+(problem|problems|reason|reasons|issue|issues|challenge|"
    r"challenges|aim|aims|goal|goals|objective|objectives|result|results|"
    r"finding|findings|observation|observations|insight|insights|"
    r"drawback|drawbacks|limitation|limitations|shortcoming|shortcomings|"
    r"advantage|advantages|benefit|benefits|conclusion|conclusions|"
    r"importance|significance|key)\b",
    re.I,
)


def is_self_contained(sentence: str) -> bool:
    """True when a sentence reads unambiguously with no surrounding context.

    Rejecting dangling references is a precision choice, not a correctness one:
    the sentence is genuinely in the source, so nothing here is unsound. But an
    extractive citation is quoted *without its neighbours*, and
    "The problem can be alleviated by expanding the receptive field" tells the
    reader nothing about whose problem or which problem. A readable, named
    subject is what makes an extracted claim worth citing.
    """
    s = (sentence or "").strip()
    if not s:
        return False
    if _DEICTIC_OPENER.match(s) or _ABSTRACT_SUBJECT.match(s):
        return False
    # Leading discourse marker with no noun before the verb ("In this way, ...").
    if re.match(r"^(however|therefore|thus|moreover|furthermore|meanwhile|"
                r"consequently|nevertheless|nonetheless)\b", s, re.I):
        return False
    return bool(tokenize(s))


def candidate_sentences(text: str) -> List[str]:
    """Sentences that could plausibly be cited as a claim."""
    return [
        s for s in split_sentences(text) if not is_heading(s) and is_self_contained(s)
    ]


def parse_evidence(prompt: str) -> List[Dict[str, Any]]:
    """Pull `[EVIDENCE n] Source: ... | Page N | ...` blocks out of a prompt."""
    blocks: List[Dict[str, Any]] = []
    for m in _EVIDENCE_INLINE.finditer(prompt):
        header = m.group(1)
        body = m.group(2)
        src = ""
        page: Optional[int] = None
        hm = re.search(r"Source:\s*([^|\n]+)", body[:300])
        if hm:
            src = hm.group(1).strip()
        pm = re.search(r"Page\s+(\d+)", body[:300])
        if pm:
            page = int(pm.group(1))
        # Everything after the first blank line is the passage itself.
        passage = body
        split = re.split(r"\n\s*\n", body, maxsplit=1)
        if len(split) == 2:
            passage = split[1]
        blocks.append(
            {
                "id": header,
                "source": src,
                "page": page,
                "text": passage.strip(),
            }
        )
    return blocks


def _content_tokens(text: str) -> List[str]:
    return [t for t in tokenize(text) if t not in STOPWORDS and len(t) > 2]


def _mmr(
    candidates: List[Tuple[float, str, str]],
    query_terms: set,
    lambda_: float = 0.7,
    max_items: int = 8,
) -> List[Tuple[float, str, str]]:
    """Maximal Marginal Relevance selection to avoid repeating one idea."""
    if not candidates:
        return []
    tokenised = {c[1]: set(_content_tokens(c[1])) for c in candidates}
    selected: List[Tuple[float, str, str]] = []
    pool = list(candidates)
    while pool and len(selected) < max_items:
        best_i, best_val = 0, -1e9
        for i, (score, sent, eid) in enumerate(pool):
            toks = tokenised[sent]
            if not toks:
                continue
            relevance = score
            max_sim = 0.0
            for _, s_sent, _ in selected:
                other = tokenised[s_sent]
                if not other:
                    continue
                inter = len(toks & other)
                if inter:
                    max_sim = max(max_sim, inter / len(toks | other))
            value = lambda_ * relevance - (1 - lambda_) * max_sim
            if value > best_val:
                best_val, best_i = value, i
        selected.append(pool.pop(best_i))
    return selected


class ExtractiveLLM(BaseLLM):
    """Composes an answer from verbatim source sentences only."""

    name = "offline"
    offline = True

    def __init__(self, model: str = "extractive-v1", max_sentences: int = 7):
        self.model = model
        self.max_sentences = max_sentences

    def _question(self, prompt: str) -> str:
        for pat in (
            r"###\s*Question\s*:?\s*(.+?)(?:\n|$)",
            r"(?:USER QUESTION|Question)\s*:\s*(.+?)(?:\n\n|\n===|\Z)",
            r"Research question\s*:\s*(.+?)(?:\n|$)",
        ):
            m = re.search(pat, prompt, re.I)
            if m:
                return m.group(1).strip()
        # Fall back to the longest line that reads like a question.
        for line in reversed(prompt.strip().split("\n")):
            s = line.strip()
            if s.endswith("?") and 15 < len(s) < 400:
                return s
        return prompt.strip()[-300:]

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: int = 1200,
        temperature: float = 0.0,
        stop: Optional[list] = None,
    ) -> LLMResult:
        with _Timer() as t:
            evidence = parse_evidence(prompt)
            question = self._question(prompt)
            text = self._compose(question, evidence)
            ptok = len(prompt.split())
            ctok = len(text.split())
        return LLMResult(
            text=text,
            provider=self.name,
            model=self.model,
            prompt_tokens=ptok,
            completion_tokens=ctok,
            total_tokens=ptok + ctok,
            latency_s=t.elapsed,
            raw={"evidence_count": len(evidence), "mode": "extractive"},
        )

    def _compose(self, question: str, evidence: List[Dict[str, Any]]) -> str:
        if not evidence:
            return (
                "Insufficient evidence. No supporting passage was retrieved for this "
                "question, so I will not answer it rather than risk inventing a finding."
            )

        q_terms = set(_content_tokens(question))
        # Local IDF across the retrieved passages: a term shared by every
        # passage carries no discriminative signal for this question.
        passage_tokens = [set(_content_tokens(e["text"])) for e in evidence]
        n = len(passage_tokens) or 1
        df = Counter()
        for toks in passage_tokens:
            df.update(toks)
        idf = {t: math.log(1.0 + (n - c + 0.5) / (c + 0.5)) for t, c in df.items()}

        candidates: List[Tuple[float, str, str]] = []
        for e, ptoks in zip(evidence, passage_tokens):
            for sent in candidate_sentences(e["text"]):
                stoks = set(_content_tokens(sent))
                if not stoks:
                    continue
                overlap = q_terms & stoks
                if not overlap:
                    continue
                score = sum(idf.get(t, 0.0) for t in overlap)
                score /= math.sqrt(len(stoks) + 1)  # mild length normalisation
                label = f"[{e['id']}]"
                if e.get("page"):
                    label = f"[{e['id']} p.{e['page']}]"
                candidates.append((score, f"{label} {sent}", e["id"]))

        if not candidates:
            # Nothing matched lexically. Say so instead of padding with
            # unrelated text -- this is the "insufficient evidence" path.
            top = evidence[0]
            return (
                "Insufficient evidence. I retrieved "
                f"{len(evidence)} passage(s) (including {top.get('source') or 'a source'}"
                f"{', p.' + str(top['page']) if top.get('page') else ''}) but none of them "
                "directly address the question. Rather than infer an answer, I am "
                "reporting that the corpus does not cover this."
            )

        picked = _mmr(candidates, q_terms, max_items=min(self.max_sentences, 6))
        lines = [s for _, s, _ in picked]

        header = (
            "**Evidence-grounded answer (extractive mode - verbatim source "
            "sentences, no LLM generation).**\n\n"
        )
        body = "\n\n".join(f"- {ln}" for ln in lines)
        footer = (
            f"\n\n_Sources cited: "
            f"{', '.join(sorted({e for _, _, e in picked}, key=lambda x: (len(x), x)))}. "
            "Every sentence above is copied verbatim from a retrieved passage; "
            "no content was generated or inferred._"
        )
        return header + body + footer
