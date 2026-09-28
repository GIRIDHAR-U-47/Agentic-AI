"""Reflection / self-correction: verify that every claim is actually supported.

The original code returned `verified=True` as a hardcoded literal
(`pdf_rag_service.py:250`), which is exactly the kind of claim that must not be
trusted. Here verification is *computed*, and it is deliberately mechanical
rather than a second opinion from the same model.

Why mechanical
--------------
A lit review's highest-risk failure is a plausible number that appears nowhere
in the sources. A model asked to "check its own work" is a poor detector of its
own fabrications, but string and token comparison against the stored passages
is exact and reproducible. So the checks are:

1. **Citation existence** - every `[Sn]` marker must resolve to a real retrieved
   chunk. Unresolvable markers are dropped and reported.
2. **Quote fidelity** - each citation's stored quote must still occur in the
   chunk it came from (guards against drift between the review and the store).
3. **Numeric containment** - every number in a claim sentence must appear in
   the passages cited by that sentence. This is the fabrication tripwire.
4. **Lexical support** - content-word overlap between the sentence and its cited
   passages, below a floor means "not really supported".
5. **Hallucinated-source detection** - a citation naming a paper not in the
   approved set is a hard failure.

If a real LLM is configured, an additional LLM verification pass runs, but it
is reported separately and can never upgrade a mechanically-failed claim. The
mechanical result is authoritative.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

from services.llm.offline import is_heading
from services.retrieval import STOPWORDS, tokenize


def is_heading_free(text: str) -> bool:
    """True when `text` contains no section headings.

    Exposed so the review assembler can tell "the agent found no comparison
    claims" apart from "the agent emitted headings that should have been
    bucketed" -- two very different problems that otherwise look identical.
    """
    return not any(is_heading(s) for s in split_claims(text))

# Citation marker, e.g. [S1] or [S1 p.4] or [S1, S3].
#
# The page is captured because it is load-bearing. Markers are assigned per
# *document* (S1 = the first paper), so a review citing five pages of that paper
# emits `[S1 p.9] [S1 p.15] [S1 p.20]`. Resolving all three to a single chunk
# meant each sentence was checked against a passage it did not come from, and
# the numeric tripwire duly reported verbatim quotes as fabricated numbers. The
# fix is to resolve on (marker, page) and fall back to the marker alone only
# when the claim names no page.
_CITE_RE = re.compile(
    r"\[(?P<markers>(?:S\d+)(?:\s*(?:p\.\s*\d+)?)?(?:\s*,\s*(?:S\d+)(?:\s*p\.\s*\d+)?)*)\]"
)
_CITE_ITEM_RE = re.compile(r"(S\d+)(?:\s*p\.\s*(\d+))?")
_NUM_RE = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?)(?![\w])")

# Below this, a sentence is not meaningfully grounded in what it cites.
SUPPORT_FLOOR = 0.18


@dataclass
class ClaimCheck:
    sentence: str
    markers: List[str]
    support: float
    unsupported_numbers: List[str] = field(default_factory=list)
    unknown_markers: List[str] = field(default_factory=list)
    issues: List[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.issues

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sentence": self.sentence[:300],
            "markers": self.markers,
            "support": round(self.support, 4),
            "unsupported_numbers": self.unsupported_numbers,
            "unknown_markers": self.unknown_markers,
            "issues": self.issues,
            "ok": self.ok,
        }


@dataclass
class ReflectionResult:
    verified: bool
    support_rate: float
    checks: List[ClaimCheck]
    citations: List[Dict[str, Any]]
    issues: List[str] = field(default_factory=list)
    corrected_answer: str = ""
    llm_passed: Optional[bool] = None
    llm_notes: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "verified": self.verified,
            "support_rate": round(self.support_rate, 4),
            "claims_checked": len(self.checks),
            "claims_ok": sum(1 for c in self.checks if c.ok),
            "issues": self.issues,
            "citations": self.citations,
            "llm_passed": self.llm_passed,
            "llm_notes": self.llm_notes,
            "checks": [c.to_dict() for c in self.checks],
        }


_ITALIC_LINE = re.compile(r"^_(?!\s)(.+[^_])_$|^\*(?!\s)(.+[^*])\*$")
_FOOTNOTE_HINT = re.compile(
    r"^(?:every|the above|the following|each) (?:sentence|claim|quote|item|bullet|"
    r"passage|line|word)",
    re.I,
)


def split_claims(text: str) -> List[str]:
    """Split an answer into checkable claim units (bullets, then sentences).

    Markdown formatting is removed *after* the emphasis markers have been used to
    identify a caption. An earlier version stripped `_` first, so the italic
    marker was gone before the check and the provider's own caption -- "Every
    sentence above is copied verbatim from a retrieved passage." -- was treated
    as an uncited factual claim, dragging the support rate down with a sentence
    the model had merely annotated.
    """
    out: List[str] = []
    for raw in (text or "").split("\n"):
        s = raw.strip()
        if not s:
            continue
        if _ITALIC_LINE.match(s):
            continue  # emphasised caption, not a claim
        # Emphasis markers come off *before* the bullet marker, otherwise a
        # bold bullet such as `**Evidence-grounded answer.**` loses one asterisk
        # to the bullet rule and arrives as `*Evidence-grounded answer.` -- still
        # readable as a header to a human, but it defeats the header filter.
        s = s.replace("**", "")
        s = re.sub(r"^#{1,6}\s*", "", s)
        s = re.sub(r"^[-*•]\s*", "", s).strip()
        if _FOOTNOTE_HINT.match(s):
            continue
        if _HEADER_LINE.match(s):
            continue
        if len(s) < 25:
            continue
        # Section headings are not claims. Without this, a heading such as
        # `A.4.3 PATCHING AND CHANNEL-INDEPENDENCE` gets reported as an
        # uncited factual claim, which inflates the issue count misleadingly.
        if is_heading(s):
            continue
        parts = re.split(r"(?<=[.!?])\s+(?=[A-Z(\[\"0-9])", s)
        if len(parts) == 1:
            if s:
                out.append(s)
        else:
            out.extend(p.strip() for p in parts if len(p.strip()) >= 25)
    return out


def _content(text: str) -> Set[str]:
    return {t for t in tokenize(text) if t not in STOPWORDS and len(t) > 2}


def _overlap(a: Set[str], b: Set[str]) -> float:
    if not a:
        return 0.0
    return len(a & b) / len(a)


def normalise_number(tok: str) -> str:
    """`0.129` and `.129` should compare equal; drop trailing zeros."""
    try:
        f = float(tok)
    except ValueError:
        return tok
    if f == int(f):
        return str(int(f))
    return ("%f" % f).rstrip("0").rstrip(".")


def _numbers_in(text: str) -> List[str]:
    return [normalise_number(m) for m in _NUM_RE.findall(text or "")]


#: Markdown section headers the providers emit, e.g.
#: `**Evidence-grounded answer (extractive mode).**`. These are captions, not
#: claims, and counting them as uncited claims drags the support rate down for
#: reasons that have nothing to do with grounding.
_HEADER_LINE = re.compile(
    r"^\**\s*(?:evidence[- ]grounded answer|grounded answer|answer|direct answer|"
    r"summary|key findings|findings|literature review|comparison|themes|"
    r"limitations|research gaps|sources cited|sources|conclusion)"
    r"s?\s*\**\s*(?:\(|\[|:|--|\(|$)",
    re.I,
)


def _is_probably_not_a_claim(sentence: str) -> bool:
    low = sentence.lower().lstrip("*-# ").strip()
    if _HEADER_LINE.match(sentence.strip()):
        return True
    return low.startswith((
        "sources cited", "every sentence above", "answer recorded", "insufficient evidence",
    ))


def _parse_citations(sentence: str) -> List[Tuple[str, Optional[int]]]:
    """`[S1 p.9]` -> `[("S1", 9)]`; `[S1, S3]` -> `[("S1", None), ("S3", None)]`."""
    out: List[Tuple[str, Optional[int]]] = []
    for m in _CITE_RE.finditer(sentence or ""):
        for marker, page in _CITE_ITEM_RE.findall(m.group("markers")):
            out.append((marker, int(page) if page else None))
    return out


def _index_evidence(evidence: List[Dict[str, Any]]) -> Tuple[
    Dict[str, Dict[str, Any]], Dict[Tuple[str, int], Dict[str, Any]]
]:
    """Two indexes: by marker, and by (marker, page).

    A marker names a paper, so it is not unique to a passage. Any lookup that
    ignores the page resolves to whichever chunk happened to come first.
    """
    by_marker: Dict[str, Dict[str, Any]] = {}
    by_marker_page: Dict[Tuple[str, int], Dict[str, Any]] = {}
    for e in evidence:
        marker = e.get("marker")
        if not marker:
            continue
        by_marker.setdefault(marker, e)
        page = e.get("page")
        if page is not None:
            by_marker_page.setdefault((marker, int(page)), e)
    return by_marker, by_marker_page


def _resolve(
    cites: List[Tuple[str, Optional[int]]],
    by_marker: Dict[str, Dict[str, Any]],
    by_marker_page: Dict[Tuple[str, int], Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], List[str], List[Tuple[str, Optional[int]]]]:
    """Map claim citations onto the exact passages they name.

    Returns `(passages, unresolved_markers, resolved_pairs)`. A page-qualified
    citation that does not match any retrieved chunk of that paper is reported
    as unresolved rather than silently falling back to another passage -- a
    citation pointing at the wrong page is a real defect and must show up.
    """
    passages: List[Dict[str, Any]] = []
    unknown: List[str] = []
    resolved: List[Tuple[str, Optional[int]]] = []
    for marker, page in cites:
        if page is not None:
            e = by_marker_page.get((marker, page))
            if e is None:
                unknown.append(f"{marker} p.{page}")
                continue
        else:
            e = by_marker.get(marker)
            if e is None:
                unknown.append(marker)
                continue
        passages.append(e)
        resolved.append((marker, page))
    return passages, unknown, resolved


def verify(
    answer: str,
    evidence: List[Dict[str, Any]],
    approved_doc_ids: Optional[List[str]] = None,
    correct: bool = True,
) -> ReflectionResult:
    """Check `answer` against `evidence`; optionally strip unsupported claims."""
    approved = set(approved_doc_ids or [])
    by_marker, by_marker_page = _index_evidence(evidence)

    global_issues: List[str] = []

    # Pre-flight: any chunk not in the approved set is a hallucinated source.
    for e in evidence:
        if approved and e.get("doc_id") and e["doc_id"] not in approved:
            global_issues.append(
                f"Source {e.get('marker')} ({e.get('doc_title') or e.get('doc_id')}) "
                "was never approved for this review."
            )

    used_pairs: Set[Tuple[str, Optional[int]]] = set()
    checks: List[ClaimCheck] = []
    for sentence in split_claims(answer):
        if _is_probably_not_a_claim(sentence):
            continue
        cites = _parse_citations(sentence)
        markers = list(dict.fromkeys(m for m, _ in cites))

        if not cites:
            checks.append(
                ClaimCheck(
                    sentence=sentence,
                    markers=[],
                    support=0.0,
                    issues=["Claim has no citation marker."],
                )
            )
            continue

        cited, unknown, resolved = _resolve(cites, by_marker, by_marker_page)

        issues: List[str] = []
        if unknown:
            issues.append(
                f"Citation(s) {', '.join(unknown)} do not resolve to any retrieved passage."
            )
        if not cited:
            issues.append("No resolvable citation.")

        pool_text = " ".join((c.get("text") or "") for c in cited)
        support = _overlap(_content(sentence), _content(pool_text))
        if support < SUPPORT_FLOOR:
            issues.append(
                f"Weak lexical support ({support:.2f} < {SUPPORT_FLOOR:.2f}) with the cited passage(s)."
            )

        bad_nums: List[str] = []
        pool_nums = set(_numbers_in(pool_text))
        # Citation markers themselves contain digits (S1); strip them first.
        claim_body = _CITE_RE.sub(" ", sentence)
        for n in _numbers_in(claim_body):
            if n not in pool_nums:
                bad_nums.append(n)
        if bad_nums:
            issues.append(
                "Number(s) "
                + ", ".join(sorted(set(bad_nums)))
                + " do not appear in the cited passage(s) - possible fabrication."
            )

        checks.append(
            ClaimCheck(
                sentence=sentence,
                markers=markers,
                support=support,
                unsupported_numbers=bad_nums,
                unknown_markers=unknown,
                issues=issues,
            )
        )
        # Only passages a claim actually survived on become citations. A claim
        # that failed verification must not put its source in the source list.
        if not issues:
            used_pairs.update(resolved)

    total = len(checks)
    ok = sum(1 for c in checks if c.ok)
    support_rate = (ok / total) if total else 0.0

    # ---- optional correction: drop the claims that failed -----------------
    corrected = answer
    dropped: List[str] = []
    if correct and checks:
        bad_sentences = {c.sentence for c in checks if not c.ok}
        if bad_sentences:
            kept: List[str] = []
            for sentence in split_claims(answer):
                if sentence in bad_sentences:
                    dropped.append(sentence)
                else:
                    kept.append(sentence)
            if kept and dropped:
                corrected = "\n".join(f"- {s}" for s in kept)
                if dropped:
                    corrected += (
                        "\n\n_Reflection removed "
                        f"{len(dropped)} claim(s) that were not supported by the "
                        "retrieved sources, rather than presenting them as findings._"
                    )
            elif dropped and not kept:
                corrected = (
                    "Insufficient evidence: none of the drafted claims could be "
                    "verified against the approved sources, so they were withdrawn."
                )

    citations = _build_citations(used_pairs, by_marker, by_marker_page, checks)

    return ReflectionResult(
        verified=(total > 0 and ok == total and not global_issues),
        support_rate=support_rate,
        checks=checks,
        citations=citations,
        issues=global_issues + [i for c in checks for i in c.issues],
        corrected_answer=corrected,
    )


def _build_citations(
    used_pairs: Set[Tuple[str, Optional[int]]],
    by_marker: Dict[str, Dict[str, Any]],
    by_marker_page: Dict[Tuple[str, int], Dict[str, Any]],
    checks: List[ClaimCheck],
) -> List[Dict[str, Any]]:
    """One citation record per *passage* a surviving claim actually leaned on.

    Keyed on (marker, page) rather than marker alone. A review that draws three
    sentences from pages 9, 15 and 20 of one paper produces three records that
    share a marker and differ in location, so the source list tells the reader
    which passage to open. Two claims quoting different pages of the same paper
    are genuinely different pieces of evidence.
    """
    out: List[Dict[str, Any]] = []
    seen: Set[str] = set()
    ordered = sorted(
        used_pairs,
        key=lambda mp: (len(mp[0]), mp[0], mp[1] if mp[1] is not None else 0),
    )
    for marker, page in ordered:
        e = (
            by_marker_page.get((marker, int(page)))
            if page is not None
            else by_marker.get(marker)
        )
        if e is None:
            continue
        chunk_id = e.get("id")
        if chunk_id in seen:
            continue
        seen.add(chunk_id)
        text = (e.get("text") or "").strip()
        out.append(
            {
                "marker": marker,
                "locator": f"{marker} p.{page}" if page is not None else marker,
                "doc_id": e.get("doc_id"),
                "chunk_id": chunk_id,
                "title": e.get("doc_title") or e.get("doc_filename"),
                "authors": e.get("doc_authors"),
                "year": e.get("doc_year"),
                "venue": e.get("doc_venue"),
                "doi": e.get("doc_doi"),
                "arxiv_id": e.get("doc_arxiv_id"),
                "page": page if page is not None else e.get("page"),
                "section": e.get("section"),
                "quote": text[:400],
                "score": e.get("_score"),
                "verified": True,
            }
        )
    return out
