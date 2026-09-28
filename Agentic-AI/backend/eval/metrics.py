"""Scoring functions for the R-Lens evaluation harness.

Deliberately mechanical. Every metric here is defined so two people running the
same inputs get identical numbers:

* **Factual accuracy** - a gold fact is *hit* when its verbatim source quote
  (or its keyword set) appears in the delivered answer after whitespace /
  casing / LaTeX normalisation. No human judgement.
* **Retrieval relevance** - precision/recall/F1 of the papers a run actually
  cited against the papers the gold answer names.
* **Citation support** - the reflection module's own support rate, i.e. the
  fraction of delivered claims that mechanically verified against their cited
  passages (lexical overlap + numeric containment + resolvable markers).
* **Consistency** - 1.0 when two runs produce the identical answer, otherwise
  the overlap of their content words. Offline extraction is deterministic, so
  identical runs must score 1.0; a lower number for the same provider/mode is a
  bug, not a nuance.
* **Cost** - from provider token prices when known; offline extraction is free
  and `usage_known` says so.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Any, Dict, List, Optional, Sequence, Tuple

STOP = {
    "the", "a", "an", "of", "in", "on", "for", "to", "and", "or", "is", "are",
    "be", "by", "with", "as", "than", "that", "this", "their", "its", "at",
    "from", "over", "into", "can", "may", "not", "no", "it", "we", "they",
}


def _norm(text: str) -> str:
    """Normalise for containment: fold ligatures, drop LaTeX, punctuation,
    casing and whitespace entirely.

    The PDF text layer hyphenates across line breaks ("embed- ding") and carries
    ligature runs ("beneﬁt"). Both are invisible in the answer, so the check
    must be blind to them: ASCII-fold (NFKC turns `ﬁ` into `fi`), then compare
    on the bare letter/digit string. `embed- ding` and `embedding` both become
    `embedding`. The residual false-positive risk (the same chars in the same
    order appearing elsewhere) is acceptable for a 19-fact containment tripwire.
    """
    folded = unicodedata.normalize("NFKC", text or "").replace("$", " ").replace("\\", " ")
    return re.sub(r"[^a-z0-9]+", "", folded.lower())


def fact_hit(answer: str, fact: Dict[str, Any]) -> bool:
    """A gold fact is hit if its quote survives normalisation inside the answer,
    or, for facts whose extraction lost the quote's LaTeX (e.g. `O(L \log L)`),
    if every declared keyword is present."""
    quote = fact.get("source_quote") or ""
    if quote and _norm(quote) and _norm(quote) in _norm(answer):
        return True
    keys = fact.get("keywords") or []
    if keys:
        na = _norm(answer)
        return all(_norm(k) and _norm(k) in na for k in keys)
    return False


def factual_accuracy(answer: str, facts: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
    if not facts:
        return {"hits": 0, "total": 0, "recall": None,
                "missed": []}
    hits = [f for f in facts if fact_hit(answer, f)]
    missed = [f["fact"] for f in facts if f not in hits]
    return {
        "hits": len(hits),
        "total": len(facts),
        "recall": round(len(hits) / len(facts), 4),
        "missed": missed,
    }


def retrieval_relevance(
    cited_doc_ids: Sequence[str], gold_papers: Sequence[str]
) -> Optional[Dict[str, Any]]:
    cited = set(cited_doc_ids or [])
    gold = set(gold_papers or [])
    if not cited and not gold:
        # Out-of-scope question: correct behaviour is to cite nothing.
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0, "note": "no citations expected"}
    if not cited:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0,
                "note": "run cited nothing but gold papers exist"}
    inter = len(cited & gold)
    precision = inter / len(cited)
    recall = inter / len(gold) if gold else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    return {"precision": round(precision, 4), "recall": round(recall, 4),
            "f1": round(f1, 4), "cited": sorted(cited), "gold": sorted(gold)}


def _content(text: str) -> set:
    return {t for t in re.findall(r"[a-z0-9]+", (text or "").lower()) if t not in STOP}


def consistency(a: str, b: str) -> float:
    if a == b:
        return 1.0
    sa, sb = _content(a), _content(b)
    if not sa and not sb:
        return 1.0
    j = len(sa & sb) / len(sa | sb)
    return round(j, 4)


#: USD per million tokens, from public provider pricing. Offline extraction is
#: not a billed model, so it costs nothing and its counts are estimates anyway.
_PRICE_PER_M = {
    "gemini/gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    "openai/gpt-4o-mini": {"input": 0.15, "output": 0.60},
}


def estimate_cost_usd(provider: str, model: str, prompt_tokens: int,
                      completion_tokens: int) -> Tuple[Optional[float], bool]:
    """Return (usd, known). Offline and anything unlisted -> (None, False)."""
    price = _PRICE_PER_M.get(f"{provider}/{model}")
    if not price or prompt_tokens is None:
        return None, False
    usd = (
        (prompt_tokens or 0) / 1_000_000 * price["input"]
        + (completion_tokens or 0) / 1_000_000 * price["output"]
    )
    return round(usd, 6), True


def summarize(run: Any, question: Dict[str, Any], agentic_twice: Optional[Any] = None) -> Dict[str, Any]:
    """One evaluatable row from one agent run."""
    metrics = run.metrics or {}
    usd, cost_known = estimate_cost_usd(
        run.provider, run.model or "",
        metrics.get("prompt_tokens"), metrics.get("completion_tokens"),
    )
    facts = question.get("gold_facts") or []
    out: Dict[str, Any] = {
        "question": question["id"],
        "mode": run.mode,
        "provider": run.provider,
        "model": run.model,
        "state": run.state,
        "verified": bool(run.verified),
        "insufficient_evidence": bool(run.insufficient_evidence),
        "expected_insufficient_evidence": bool(question.get("expect_insufficient_evidence")),
        "claims": None,  # claim-level breakdown lives in the activity log
        "citations": len(run.citations) if run.citations else 0,
        "support_rate": round(float(run.support_rate or 0.0), 4),
        "factual_accuracy": factual_accuracy(run.answer, facts),
        "retrieval_relevance": retrieval_relevance(
            [c.get("doc_id") for c in (run.citations or [])],
            question.get("gold_papers") or [],
        ),
        "latency_s": round(float(run.latency_s or 0.0), 3),
        "token_usage": {
            "prompt": metrics.get("prompt_tokens"),
            "completion": metrics.get("completion_tokens"),
            "total": metrics.get("total_tokens"),
            "usage_known": bool(metrics.get("usage_known")),
            "cost_usd": usd,
            "cost_known": cost_known,
        },
        "answer_excerpt": (run.answer or "")[:400],
    }
    if agentic_twice is not None:
        out["consistency"] = consistency(run.answer, agentic_twice.answer)
    return out


def action_taken_when_out_of_scope(row: Dict[str, Any]) -> bool:
    """The out-of-scope question was handled correctly iff the run refused."""
    return row["expected_insufficient_evidence"] and row["insufficient_evidence"] and row["citations"] == 0