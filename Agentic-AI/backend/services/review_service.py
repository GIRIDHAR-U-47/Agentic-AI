"""Assemble a structured, source-backed literature review.

This is the stage the mini-project brief actually asks for: a direct answer, a
comparison table across the approved papers, themes, limitations, research gaps,
and a source list where every row is traceable back to a chunk in the store.

Traceability is enforced, not hoped for. Each claim carries the marker of the
passage it came from, and `reflection.verify` has already withdrawn anything that
did not check out, so the sections below are assembled from *surviving* claims
only. Where a section has no supporting evidence it is rendered as an explicit
"not established by the approved sources" rather than padded with generic
academic prose -- an empty section is a truthful result, an invented one is not.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Sequence, Tuple

import db
from services.agent.reflection import SUPPORT_FLOOR, split_claims
from services.retrieval import STOPWORDS, tokenize

# Sentence-level cues used to bucket a surviving claim into a review section.
# Deliberately lexical and inspectable: the bucketing must be explainable in the
# UI ("this claim was filed under Themes because it contains 'commonly'").
SECTION_CUES: Dict[str, Tuple[str, ...]] = {
    "limitations": (
        "limitation", "limitations", "however", "fails", "failure", "struggle",
        "challenging", "difficult", "drawback", "shortcoming", "cannot", "does not",
        "do not", "remains", "degrade", "unstable", "bottleneck", "threat",
        "suffer", "poor", "worse", "inferior", "underperform", "gap",
    ),
    "gaps": (
        "future work", "remains open", "unclear", "underexplored", "little is known",
        "not been", "yet to be", "warrants", "promising direction", "open question",
        "we leave", "beyond the scope", "anomaly detection", "transfer learning",
        "channel mixing", "scalability",
    ),
    "themes": (
        "commonly", "consistently", "shared", "similar", "similarity", "recurring",
        "overall", "in general", "tend to", "typically", "family of", "pattern",
        "principle", "unify", "unifies", "paradigm", "trend",
    ),
    "comparison": (
        "outperform", "outperforms", "compared", "comparison", "versus", "better than",
        "achieves", "achieve", "accuracy", "error", "mse", "mae", "state of the art",
        "sota", "improve", "improvement", "%", "fold", "faster", "speedup",
    ),
}

NOT_ESTABLISHED = (
    "_Not established by the approved sources: no retrieved passage contained "
    "evidence for this section._"
)

NO_EVIDENCE_ANSWER = (
    "Insufficient evidence: the agent searched the approved collection and no "
    "passage could be verified as supporting this question, so no review is "
    "produced. Rather than present unverified content as a literature review, "
    "R-Lens reports that the collection does not cover this."
)


def _bucket(sentence: str) -> str:
    low = sentence.lower()
    scores = {
        name: sum(1 for cue in cues if cue in low) for name, cues in SECTION_CUES.items()
    }
    best = max(scores.items(), key=lambda kv: (kv[1], kv[0] == "comparison"))
    return best[0] if best[1] > 0 else "findings"


def _clean(text: str) -> str:
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", text or "")
    s = re.sub(r"^#{1,6}\s*", "", s)
    s = re.sub(r"^[-*•]\s*", "", s)
    return s.strip(" *_")


def _sentences_with_markers(text: str) -> List[str]:
    """Surviving claims, each keeping its inline `[Sn]` markers."""
    out = []
    for s in split_claims(text):
        s = _clean(s)
        if not s or re.search(r"\[S\d+", s) is None:
            continue
        out.append(s)
    return out


def _keywords(sentences: Sequence[str], top: int = 6) -> List[str]:
    """Content words common to several claims -- candidate theme labels."""
    stop = STOPWORDS | {
        "model", "models", "data", "time", "series", "task", "tasks",
        "based", "using", "used", "propose", "proposed", "paper", "results",
        "performance", "accuracy", "forecasting", "forecast", "long", "term",
    }
    counts: Dict[str, int] = {}
    for s in sentences:
        for t in set(tokenize(s)):
            if t in stop or len(t) <= 3:
                continue
            counts[t] = counts.get(t, 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [t for t, c in ranked[:top] if c >= 2] or [t for t, _ in ranked[:top]]


def build_comparison_table(
    papers: Sequence[Dict[str, Any]], citations: Sequence[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """One row per paper: what it claims, where the claim came from.

    The "key idea" cell is filled from the paper's own abstract/title when one is
    available, never invented. A paper with no abstract simply shows its title.
    """
    cited_markers = {c["marker"] for c in citations}
    rows: List[Dict[str, Any]] = []
    for p in papers:
        marker = p.get("marker")
        cits = [c for c in citations if c.get("marker") == marker]
        rows.append(
            {
                "marker": marker or "-",
                "title": p.get("title") or "Untitled",
                "authors": _blank(p.get("authors")),
                "year": _blank(p.get("year")),
                "venue": _blank(p.get("venue")),
                "arxiv_id": _blank(p.get("arxiv_id")),
                "doi": _blank(p.get("doi")),
                "cited": bool(marker in cited_markers) if marker else False,
                "pages_cited": sorted({c.get("page") for c in cits if c.get("page")}),
                "supporting_quote": (cits[0].get("quote", "")[:300] if cits else ""),
            }
        )
    return rows


def assemble_review(
    answer: str,
    citations: Sequence[Dict[str, Any]],
    papers: Sequence[Dict[str, Any]],
    question: str,
    verified: bool = False,
    support_rate: float = 0.0,
    reflection_notes: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Build the structured review from verified, cited claims only.

    `key_findings` holds *every* surviving claim, and the thematic sections are
    filtered views over the same claims. An earlier version forced each claim
    into exactly one cue-matched bucket with "findings" as the fallback, and in
    practice nothing ever reached it: a sentence like "reduces the forecasting
    error" trips the comparison cues, so the review could ship with a full
    comparison section and an empty findings section. A verified, cited claim is
    a finding regardless of which adjectives it happens to contain, so it is
    listed as one; the other sections are lenses, not a partition.
    """
    claims = _sentences_with_markers(answer)
    by_section: Dict[str, List[str]] = {
        "findings": list(claims),
        "comparison": [], "themes": [], "limitations": [], "gaps": [],
    }
    for c in claims:
        bucket = _bucket(c)
        if bucket != "findings":
            by_section[bucket].append(c)

    theme_words = _keywords(claims)
    theme_lines: List[str] = list(by_section["themes"])
    if not theme_lines and len(claims) > 1:
        # A theme is a claim that recurs across more than one paper. Rather than
        # asserting one, name the vocabulary the surviving claims share.
        shared = _keywords(claims, top=5)
        if shared:
            theme_lines = [
                f"The surviving claims from {len({m for c in claims for m in _markers(c)})} "
                f"source location(s) concentrate on: {', '.join(shared)}."
            ]

    sources = [
        {
            "marker": c.get("marker"),
            "locator": c.get("locator") or _locator(c),
            "title": c.get("title"),
            "authors": _blank(c.get("authors")),
            "year": _blank(c.get("year")),
            "venue": _blank(c.get("venue")),
            "arxiv_id": _blank(c.get("arxiv_id")),
            "doi": _blank(c.get("doi")),
            "page": c.get("page"),
            "section": c.get("section"),
            "quote": (c.get("quote") or "")[:400],
            "chunk_id": c.get("chunk_id"),
            "source_url": _blank(c.get("source_url")),
            # 1 = full-text PDF ingested and cited; 0 = abstract-only. The UI
            # shows this badge so nobody mistakes an abstract for full text.
            "full_text_available": int(c.get("full_text_available", 1)),
        }
        for c in citations
    ]

    return {
        "question": question,
        "direct_answer": answer.strip(),
        "sections": {
            "key_findings": by_section["findings"] or [NOT_ESTABLISHED],
            "comparison": by_section["comparison"] or [NOT_ESTABLISHED],
            "themes": theme_lines or [NOT_ESTABLISHED],
            "limitations": by_section["limitations"] or [NOT_ESTABLISHED],
            "gaps": by_section["gaps"] or [NOT_ESTABLISHED],
        },
        "comparison_table": build_comparison_table(papers, citations),
        "sources": sources,
        "theme_keywords": theme_words,
        "verified": verified,
        "support_rate": round(support_rate, 4),
        "claims_total": len(claims),
        "reflection_notes": reflection_notes or [],
        "unverified": not verified,
        #: Automated citation checks are warnings for human review, not a proof
        #: that the science is correct. Surfaced beside every review.
        "disclaimer": (
            "Automated citation checks verify that each claim quotes an approved "
            "passage with its page. They are warnings for human review, not proof "
            "that a scientific claim is correct."
        ),
    }


#: Placeholder strings the ingest layer uses for "the PDF did not say". These
#: must never reach the UI or a citation, where they read like data.
_MISSING = {"unavailable", "unknown", "n/a", "na", "none", "null", "", "-"}


def _blank(value: Any) -> Any:
    """Normalise a 'we do not know' placeholder to None."""
    if value is None:
        return None
    if isinstance(value, str) and value.strip().lower() in _MISSING:
        return None
    return value


def _locator(citation: Dict[str, Any]) -> str:
    marker = citation.get("marker") or "?"
    page = citation.get("page")
    return f"{marker} p.{page}" if page is not None else str(marker)


def _markers(sentence: str) -> Tuple[str, ...]:
    return tuple(re.findall(r"\[(S\d+)", sentence or ""))


def render_markdown(review: Dict[str, Any]) -> str:
    """Plain-markdown rendering, used by the API and the CLI smoke test."""
    lines = [f"# Literature review\n", f"**Question.** {review['question']}\n"]
    lines.append(f"**Verification.** {'passed' if review['verified'] else 'INCOMPLETE'} "
                 f"(support rate {review['support_rate']:.2f} over "
                 f"{review['claims_total']} claim(s))\n")
    lines.append(f"## Direct answer\n{review['direct_answer']}\n")
    for key, heading in (
        ("key_findings", "Key findings"),
        ("comparison", "Comparison across papers"),
        ("themes", "Themes"),
        ("limitations", "Limitations and conflicts"),
        ("gaps", "Research gaps"),
    ):
        body = "\n".join(f"- {s}" for s in review["sections"][key])
        lines.append(f"## {heading}\n{body}\n")

    lines.append("## Comparison table\n")
    lines.append("| Source | Paper | Year | Venue | Cited pages |")
    lines.append("| --- | --- | --- | --- | --- |")
    for r in review["comparison_table"]:
        pages = ", ".join(str(p) for p in r["pages_cited"]) or "-"
        title = str(r["title"])[:70].replace("|", "/")
        year = r.get("year") or "-"
        venue = r.get("venue") or "-"
        lines.append(f"| {r['marker']} | {title} | {year} | {venue} | {pages} |")
    lines.append("")

    lines.append("## Sources\n")
    for s in review["sources"]:
        ref = f" [{s.get('locator') or s.get('marker')}]"
        bits = [str(s.get("title") or "Untitled")]
        if int(s.get("full_text_available", 1)) == 0:
            bits.append("(abstract only -- full text unavailable)")
        if s.get("authors"):
            bits.append(str(s["authors"])[:60])
        if s.get("year"):
            bits.append(str(s["year"]))
        if s.get("arxiv_id"):
            bits.append(f"arXiv:{s['arxiv_id']}")
        if s.get("doi"):
            bits.append(f"doi:{s['doi']}")
        if s.get("source_url"):
            bits.append(s["source_url"])
        lines.append("- " + ", ".join(bits) + ref
                     + (f" (p. {s['page']}, {s.get('section') or 'n/a'})"
                        if s.get("page") else ""))
    if review["reflection_notes"]:
        lines.append("\n## Reflection notes\n")
        for n in review["reflection_notes"]:
            lines.append(f"- {n}")
    if review.get("disclaimer"):
        lines.append(f"\n> {review['disclaimer']}")
    return "\n".join(lines)
