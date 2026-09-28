"""Deterministic ReAct policy for the offline (no-credentials) provider.

`ExtractiveLLM` composes an *answer* from `[EVIDENCE n]` blocks, which is the
right behaviour for synthesis but the wrong shape for `AgentExecutor`, whose
protocol is `Thought / Action / Action Input / Observation`. So the offline path
needs a small policy that speaks ReAct.

This policy is not a lookup table. It inspects the real scratchpad and the real
evidence state on every step and makes an actual decision:

    no searches yet          -> search with an expanded query
    search returned nothing  -> refine the query (bounded by the refinement cap)
    thin evidence (<2)       -> read the best passage in full
    sufficient evidence      -> finalize with verbatim sentences
    refinements exhausted    -> ask the human, or declare insufficient evidence

Every branch is a decision the brief asks to be visible, and each is recorded in
the activity log by the same callback handler the hosted-LLM path uses, so the
offline run is a genuine demonstration of the agentic loop rather than a
canned script.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from services.llm.offline import ExtractiveLLM, split_sentences
from services.retrieval import STOPWORDS, tokenize

_ACTION_RE = re.compile(r"Action:\s*(\w+)\s*\n\s*Action Input:\s*(.*?)(?=\n\s*Observation:|\Z)", re.S)
_OBS_RE = re.compile(r"Observation:\s*(.*?)(?=\n\s*Thought:|\n\s*Action:|\Z)", re.S)

# Concepts that expand a terse user question into a searchable query. Kept
# small and explicit so behaviour is predictable and testable.
_CONCEPT_EXPANSIONS: Dict[str, Tuple[str, ...]] = {
    "patch": ("patching", "sub-series", "tokenization", "look-back window"),
    "attention": ("self-attention", "attention mechanism", "complexity"),
    "sparse": ("sparse", "prob sparse", "sampling", "complexity reduction"),
    "invert": ("inverted", "variate tokens", "attention over variates"),
    "decomposition": ("decomposition", "trend", "seasonal", "auto-correlation"),
    "benchmark": ("benchmark", "datasets", "long-term forecasting", "MSE", "MAE"),
    "limitation": ("limitation", "challenge", "failure", "drawback"),
    "linear": ("linear model", "simple baseline", "transformer necessity"),
    "multivariate": ("multivariate", "channel independence", "cross-variate"),
    "efficiency": ("efficiency", "inference cost", "training cost", "computational"),
    "accuracy": ("accuracy", "state of the art", "outperform", "performance"),
    "interpretability": ("interpretability", "explainability", "attention map"),
    "seasonal": ("seasonal", "periodicity", "trend"),
}


def expand_query(question: str, max_terms: int = 10) -> str:
    """Turn a natural-language question into keyword terms for BM25.

    BM25 has no notion of a question, and full questions contain filler words
    that dilute the IDF weighting. This keeps the distinctive terms and adds
    closely related vocabulary so recall does not depend on the user happening
    to use the paper's own wording.
    """
    q = question or ""
    toks = [t for t in tokenize(q) if t not in STOPWORDS and len(t) > 2]
    seen, terms = set(), []
    for t in toks:
        if t not in seen:
            seen.add(t)
            terms.append(t)
    joined = " ".join(terms)
    for key, extras in _CONCEPT_EXPANSIONS.items():
        if key in joined:
            for e in extras:
                if e not in seen:
                    seen.add(e)
                    terms.append(e)
    return " ".join(terms[:max_terms]) or q.strip()


def _parse_scratchpad(prompt: str) -> List[Dict[str, str]]:
    """Extract (action, input, observation) triples from the ReAct scratchpad."""
    if "scratchpad" not in prompt.lower() and "Action:" not in prompt:
        return []
    tail = prompt
    idx = prompt.rfind("Assistant:")
    if idx != -1:
        tail = prompt[idx:]
    actions = _ACTION_RE.findall(tail)
    obs = _OBS_RE.findall(tail)
    steps: List[Dict[str, str]] = []
    for i, (a, inp) in enumerate(actions):
        steps.append(
            {
                "action": a.strip(),
                "input": inp.strip(),
                "observation": obs[i].strip() if i < len(obs) else "",
            }
        )
    return steps


def _question_from_prompt(prompt: str) -> str:
    m = re.search(r"(?:Question|Research question)\s*:\s*(.+?)(?:\n\n|\nTools:|\nThought:|\Z)", prompt, re.S)
    if m:
        return m.group(1).strip()
    for line in reversed(prompt.strip().split("\n")):
        s = line.strip()
        if s.endswith("?") and 10 < len(s) < 400:
            return s
    return prompt.strip()[:200]


class OfflineReactPolicy:
    """A LangChain-compatible chat model that emits deterministic ReAct text."""

    name = "offline-react"
    offline = True

    def __init__(self, ctx, recorder):
        from langchain_core.language_models.chat_models import BaseChatModel

        outer = self

        class _Policy(BaseChatModel):
            @property
            def _llm_type(self) -> str:
                return "rlens-offline-react"

            def _generate(self, messages, stop=None, run_manager=None, **kwargs):
                from langchain_core.messages import AIMessage
                from langchain_core.outputs import ChatGeneration, ChatResult

                parts: List[str] = []
                for m in messages:
                    content = m.content if hasattr(m, "content") else str(m)
                    if not isinstance(content, str):
                        content = str(content)
                    if getattr(m, "type", None) == "system":
                        parts.insert(0, content)
                    else:
                        parts.append(content)
                prompt = "\n\n".join(p for p in parts if p)
                text = outer.next_action(prompt)
                if run_manager is not None:
                    try:
                        run_manager.on_llm_new_token(text)
                    except Exception:
                        pass
                msg = AIMessage(content=text)
                pt, ct = outer.rec.estimate_usage(prompt, text)
                msg.usage_metadata = {
                    "input_tokens": pt,
                    "output_tokens": ct,
                    "total_tokens": pt + ct,
                }
                return ChatResult(
                    generations=[ChatGeneration(message=msg)],
                    llm_output={
                        "model_name": "extractive-v1",
                        "token_usage": {
                            "prompt_tokens": pt,
                            "completion_tokens": ct,
                            "total_tokens": pt + ct,
                        },
                    },
                )

        self.ctx = ctx
        self.rec = recorder
        self.model = _Policy()

    @property
    def llm_type(self) -> str:
        return self.name

    def next_action(self, prompt: str) -> str:
        ctx = self.ctx
        rec = self.rec
        steps = _parse_scratchpad(prompt)
        question = _question_from_prompt(prompt)
        searches = [s for s in steps if s["action"] == "search_papers"]
        reads = [s for s in steps if s["action"] == "read_passage"]

        if rec.tool_call_count >= rec.max_tool_calls:
            return self._emit_final(ctx.answer or "Insufficient evidence: tool budget exhausted.")

        if not searches:
            return self._think_then(
                "I have not searched the approved collection yet, so I have no evidence.",
                "search_papers",
                expand_query(question),
            )

        # `finalize` records the answer. Once it has run, the only correct ReAct
        # move is to emit a Final Answer -- calling the tool again (which is what
        # an unguarded policy does) spins the loop until the iteration cap.
        if any(s["action"] == "finalize" for s in steps):
            return self._emit_final(
                ctx.answer or "Insufficient evidence: the run ended without a citable claim."
            )

        last = searches[-1]
        obs = last.get("observation", "")
        got_zero = "Retrieved 0 passage" in obs or "No passages" in obs
        no_coverage = "Insufficient evidence" in obs and "does not cover" in obs
        thin = len(ctx.retrieved) < 2

        if got_zero or no_coverage:
            if len(searches) >= rec.max_refinements:
                return self._think_then(
                    f"I refined the query {len(searches)} time(s) and still retrieved "
                    "nothing, so the approved collection does not cover this.",
                    "request_user_clarification",
                    "The approved papers do not appear to cover this question. "
                    "Should I broaden the topic, or should you add more papers?",
                )
            refined = self._refine(question, len(searches))
            return self._think_then(
                f"The query '{last.get('input')}' returned no passages, so I will "
                "broaden the vocabulary and search again.",
                "search_papers",
                refined,
            )

        if thin and reads:
            return self._think_then(
                "I already read the best passage and evidence is still thin; "
                "I should not guess, so I will report insufficient coverage.",
                "finalize",
                self._insufficient_answer(question, ctx),
            )

        if thin:
            top = ctx.retrieved[0] if ctx.retrieved else None
            marker = top.get("marker", "S1") if top else "S1"
            return self._think_then(
                f"I have {len(ctx.retrieved)} passage(s); that is thin for a cited "
                f"answer, so I will read {marker} in full before making a claim.",
                "read_passage",
                marker,
            )

        if not reads:
            top = ctx.retrieved[0]
            return self._think_then(
                "Before citing, I will read the top passage in full so the quote I "
                "use is exact.",
                "read_passage",
                top.get("marker", "S1"),
            )

        return self._think_then(
            f"I have {len(ctx.retrieved)} passage(s) across "
            f"{len(ctx.papers_seen)} paper(s) and have read the strongest one, "
            "so I can answer with verbatim citations.",
            "finalize",
            self._finalise_answer(question, ctx),
        )

    # ---------------------------------------------------------------- utils
    def _think_then(self, thought: str, action: str, action_input: str) -> str:
        if len(action_input) > 1200:
            action_input = action_input[:1200] + " ..."
        return (
            f"Thought: {thought}\n"
            f"Action: {action}\n"
            f"Action Input: {action_input}"
        )

    def _emit_final(self, answer: str) -> str:
        return f"Thought: I have recorded my answer and will stop here.\nFinal Answer: {answer}"

    def _refine(self, question: str, attempt: int) -> str:
        """Broaden on each successive attempt while staying on the question's topic.

        Earlier this appended a rotating list of unrelated vocabulary
        ("self-attention", "benchmark", ...) purely to make each attempt differ.
        That changes the *topic*: the QCD question was expanded with
        "self-attention" and the next search returned Transformer passages,
        which the extractive composer then quoted -- retrievable text, wrong
        subject. Broadening must add terms that belong to this question, so it
        relaxes the token-length filter instead of inventing vocabulary.
        """
        base = expand_query(question, max_terms=6 + attempt * 4)
        raw = [t for t in re.findall(r"[a-z0-9]{2,}", (question or "").lower())
               if t not in STOPWORDS]
        extra = list(dict.fromkeys(t for t in raw if t not in base.split()))[:4]
        joined = " ".join((base + " " + " ".join(extra)).split())
        return joined or (question or "").strip()

    def _evidence_prompt(self, question: str, ctx) -> str:
        blocks = []
        for c in ctx.top_chunks:
            title = c.get("doc_title") or c.get("doc_filename")
            # Evidence id == citation marker, so the extractive composer emits
            # `[S1 p.3]` and the verifier resolves it.
            blocks.append(
                f"[EVIDENCE {c.get('marker', 'Sx')}] Source: {title} | "
                f"Page {c.get('page')} | Section: {c.get('section')}\n{c.get('text', '')}"
            )
        return (
            "=== RETRIEVED EVIDENCE ===\n\n"
            + "\n\n---\n\n".join(blocks)
            + f"\n\n=== USER QUESTION ===\n{question}\n\n=== ANSWER ==="
        )

    def _finalise_answer(self, question: str, ctx) -> str:
        return ExtractiveLLM().generate(self._evidence_prompt(question, ctx)).text

    def _insufficient_answer(self, question: str, ctx) -> str:
        return (
            "Insufficient evidence to answer this responsibly. The approved papers "
            "were searched but do not contain passages that address the question, "
            "and I will not infer findings that are not in the sources."
        )


        return self._think_then(
            forced or "Time to answer from the evidence I have.",
            "finalize",
            self._finalise_answer(question, ctx),
        )
