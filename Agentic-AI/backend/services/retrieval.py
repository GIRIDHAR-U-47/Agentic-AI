"""Deterministic retrieval over the chunk store.

Design
------
The original `PDFRAGService._retrieve` scored chunks with raw set overlap
(`len(matches) / (len(q_words) + 1)`) plus hand-written section bonuses. That
worked for a single hand-tuned query but is not good enough to support the
evaluation in Phase 3, because retrieval quality has to be *measurable* and
*reproducible*.

This module keeps the same intuition (section awareness is genuinely useful)
but replaces the scoring with a textbook BM25, fuses several independent
rankers with Reciprocal Rank Fusion, and enforces per-paper diversification
so one long paper cannot monopolise the top-k.

Everything here is pure and deterministic: no randomness, no network, no LLM.
That is what makes the eval numbers trustworthy and the unit tests meaningful.
"""
from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import config

# --- Tokenisation ---------------------------------------------------------
_WORD_RE = re.compile(r"[a-z0-9]+")

STOPWORDS = frozenset(
    """
    a an the and or but if then than that this these those of in on at to for with
    from by as is are was were be been being it its into about over under between
    do does did done can could should would may might must shall will shall not no
    we our us you your they their he she his her i me my what which who whom how
    why when where whether there here also more most much many some any each other
    another such own same so too very s t just now use used using based via
    paper papers document documents study studies work works approach method
    methods result results show shows shown propose proposed present presents
    """.split()
)

# Terms that signal which part of a paper the question is about. Kept as data
# (not code) so the behaviour is inspectable and testable.
SECTION_SIGNALS: Dict[str, Tuple[str, ...]] = {
    "method": (
        "method", "methodology", "approach", "model", "architecture", "framework",
        "algorithm", "design", "we propose", "we introduce", "our model",
        # "How does X do Y" / "what is Y" are definition questions, and the
        # definition almost always lives in the abstract or methodology section.
        "how does", "how do", "what is", "what are", "explain", "mechanism",
        "how it works", "work", "define", "definition", "overview of",
    ),
    "result": (
        "result", "results", "performance", "accuracy", "metric", "metrics",
        "benchmark", "outperform", "improve", "improvement", "state of the art",
        "sota", "compare", "comparison", "ablation", "experiment",
    ),
    "limitation": (
        "limitation", "limitations", "gap", "gaps", "future work", "constraint",
        "constraints", "weakness", "challenge", "challenges", "threat",
        "bottleneck", "open problem",
    ),
    "context": (
        "abstract", "summary", "overview", "introduction", "contribution",
        "contributions", "motivation", "background", "related work",
    ),
    "conclusion": ("conclusion", "conclusions", "conclude", "concluding", "takeaway"),
}


def tokenize(text: str, drop_stopwords: bool = True) -> List[str]:
    if not text:
        return []
    toks = _WORD_RE.findall(text.lower())
    if drop_stopwords:
        toks = [t for t in toks if t not in STOPWORDS and len(t) > 2]
    return toks


def token_set(text: str) -> set:
    return set(tokenize(text))


def content_terms(query: str) -> List[str]:
    """Query terms in order, duplicates removed, stopwords dropped."""
    seen, out = set(), []
    for t in tokenize(query):
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


#: Minimum share of query content terms that must appear in the retrieved
#: passages before the collection is treated as covering the question, and the
#: absolute minimum number of matched terms. Derived from the bundled corpus:
#: an in-scope question ("How does channel independence work in PatchTST?")
#: matches 3/4 terms; a physics question that no time-series paper discusses
#: matches 1/5. The floor sits between them.
COVERAGE_FLOOR = 0.5
COVERAGE_MIN_TERMS = 2


def lexical_coverage(query: str, hits: Sequence[Dict[str, Any]]) -> Tuple[List[str], int, float]:
    """Which of the query's content terms survive in the retrieved passages.

    A passage "matches" when the term appears in its text or in its paper's
    title / abstract (definition sentences live in the abstract as often as in
    the body). Returns `(matched_terms, total_terms, ratio)`.
    """
    terms = content_terms(query)
    if not terms:
        return [], 0, 0.0
    haystack: set = set()
    for h in hits:
        haystack |= set(tokenize(str(h.get("text") or "")))
        haystack |= set(tokenize(
            " ".join(str(x or "") for x in (
                h.get("doc_title"), h.get("doc_filename"), h.get("doc_abstract"),
            ))
        ))
    matched = [t for t in terms if t in haystack]
    return matched, len(terms), (len(matched) / len(terms) if terms else 0.0)


def coverage_passes(
    query: str,
    hits: Sequence[Dict[str, Any]],
    floor: float = COVERAGE_FLOOR,
    min_terms: int = COVERAGE_MIN_TERMS,
) -> bool:
    """True when the retrieved passages plausibly cover the question.

    This is the insufficient-evidence gate. It is deliberately conservative:
    a *low* lexical overlap means the corpus was searched and does not discuss
    the question's concepts, and answering anyway on whatever ranked highest is
    exactly the behaviour that produces made-up findings.
    """
    matched, total, _ = lexical_coverage(query, hits)
    if total == 0:
        return True
    need = max(min_terms, math.ceil(floor * total)) if total > min_terms else min_terms
    return len(matched) >= min(need, total) and (not total or len(matched) >= 1)


# --- BM25 -----------------------------------------------------------------
class BM25:
    """Standard Okapi BM25 over an in-memory corpus of token lists."""

    def __init__(self, corpus: Sequence[Sequence[str]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus = [list(doc) for doc in corpus]
        self.n = len(self.corpus)
        self.doc_len = [len(d) for d in self.corpus]
        self.avgdl = (sum(self.doc_len) / self.n) if self.n else 0.0
        self.tf: List[Counter] = [Counter(d) for d in self.corpus]
        df: Counter = Counter()
        for d in self.corpus:
            df.update(set(d))
        self.df = df
        self.idf: Dict[str, float] = {
            term: math.log(1.0 + (self.n - freq + 0.5) / (freq + 0.5))
            for term, freq in df.items()
        }

    def score(self, query_terms: Iterable[str]) -> List[float]:
        terms = [t for t in dict.fromkeys(query_terms) if t]
        if not self.n or not self.avgdl:
            return [0.0] * self.n
        scores = [0.0] * self.n
        for term in terms:
            idf = self.idf.get(term)
            if idf is None:
                continue
            for i, tf in enumerate(self.tf):
                f = tf.get(term, 0)
                if not f:
                    continue
                denom = f + self.k1 * (1 - self.b + self.b * (self.doc_len[i] / self.avgdl))
                scores[i] += idf * (f * (self.k1 + 1)) / denom
        return scores


# --- Fusion helpers -------------------------------------------------------
RRF_K = 60.0


def reciprocal_rank_fusion(
    ranked_lists: Sequence[Sequence[int]], k: float = RRF_K, weights: Optional[Sequence[float]] = None
) -> Dict[int, float]:
    """Fuse several ranked id-lists into one score per id.

    RRF is used instead of score addition because BM25 scores and
    section-boost scores are not on a comparable scale; ranks are.
    """
    if weights is None:
        weights = [1.0] * len(ranked_lists)
    fused: Dict[int, float] = defaultdict(float)
    for w, order in zip(weights, ranked_lists):
        for rank, idx in enumerate(order, start=1):
            fused[idx] += w / (k + rank)
    return dict(fused)


def _rank(scores: Sequence[float], top: int) -> List[int]:
    order = sorted(range(len(scores)), key=lambda i: (-scores[i], i))
    return order[:top]


def detect_intents(query: str) -> set:
    """Which section signals does this query carry?"""
    low = (query or "").lower()
    found = set()
    for intent, signals in SECTION_SIGNALS.items():
        for s in signals:
            if s in low:
                found.add(intent)
                break
    return found


def section_boost(section: str, intents: set) -> float:
    if not intents:
        return 0.0
    sec = (section or "").lower()
    boost = 0.0
    if "method" in intents:
        # Definitions live in the abstract as often as in the methodology
        # section, so both count. Measured on the bundled corpus, boosting only
        # Methodology left the short, precise definition sentences behind longer
        # Related Work prose that merely repeated the topic words.
        if re.search(r"method|model|approach|architect|framework", sec):
            boost += 0.5
        elif re.search(r"abstract|introduction", sec):
            boost += 0.4
    if "result" in intents and re.search(r"result|performance|experiment|evaluat|benchmark|analysis", sec):
        boost += 0.5
    if "limitation" in intents and re.search(r"limitation|conclusion|discussion|future|gap", sec):
        boost += 0.5
    if "context" in intents and re.search(r"abstract|introduction", sec):
        boost += 0.35
    if "conclusion" in intents and "conclusion" in sec:
        boost += 0.35
    return boost


# --- Public API -----------------------------------------------------------
class RetrievedChunk(dict):
    """A chunk plus retrieval provenance. Behaves as a dict for JSON safety."""


def retrieve(
    query: str,
    chunks: List[Dict[str, Any]],
    top_k: Optional[int] = None,
    per_doc_cap: int = 3,
    min_score: float = 0.0,
) -> List[Dict[str, Any]]:
    """Rank `chunks` against `query`.

    Returns dicts with retrieval provenance attached so the UI activity log and
    the evaluator can both see *why* a passage was selected.
    """
    top_k = top_k or config.RETRIEVAL_TOP_K
    if not query or not query.strip() or not chunks:
        return []

    terms = content_terms(query)
    if not terms:
        return []

    corpus = [tokenize(c.get("text", "")) for c in chunks]
    bm25 = BM25(corpus)
    base = bm25.score(terms)

    intents = detect_intents(query)
    boosted = [
        base[i] * (1.0 + section_boost(chunks[i].get("section", ""), intents))
        for i in range(len(chunks))
    ]

    # Prose prior. PDF figure/table fragments score *high* on BM25 precisely
    # because they are dense in rare terms, so this penalty has to be applied
    # after scoring. `prose` is computed once at ingestion (see ingest.prose_score).
    prose = [float(c.get("prose", 1.0) or 0.0) for c in chunks]
    quality = [
        base[i] * (1.0 + section_boost(chunks[i].get("section", ""), intents))
        * (0.15 + 0.85 * prose[i])
        for i in range(len(chunks))
    ]

    # Paper-level ranker: does the paper's own title/abstract match the query?
    doc_profiles: Dict[str, List[str]] = {}
    for c, toks in zip(chunks, corpus):
        d = c.get("doc_id", "")
        if d not in doc_profiles:
            prof = tokenize(
                " ".join(
                    str(x or "")
                    for x in (c.get("doc_title"), c.get("doc_filename"), c.get("doc_abstract"))
                )
            )
            doc_profiles[d] = prof or toks
    doc_bm25 = {d: BM25([prof]) for d, prof in doc_profiles.items()}
    doc_scores = {d: m.score(terms)[0] for d, m in doc_bm25.items()}

    pool = max(top_k * 5, 40)
    fused = reciprocal_rank_fusion(
        [
            _rank(base, pool),
            _rank(quality, pool),
            _rank([doc_scores.get(c.get("doc_id", ""), 0.0) for c in chunks], pool),
        ],
        weights=[1.0, 1.2, 0.6],
    )

    out: List[Dict[str, Any]] = []
    per_doc: Counter = Counter()
    for idx, score in sorted(fused.items(), key=lambda kv: (-kv[1], kv[0])):
        if score <= min_score or prose[idx] <= 0.0:
            continue
        c = chunks[idx]
        doc_id = c.get("doc_id", "")
        if per_doc[doc_id] >= per_doc_cap:
            continue
        per_doc[doc_id] += 1
        item = dict(c)
        item["_score"] = round(float(score), 6)
        item["_bm25"] = round(float(base[idx]), 6)
        item["_prose"] = round(prose[idx], 4)
        item["_section_boost"] = round(section_boost(c.get("section", ""), intents), 4)
        item["_intents"] = sorted(intents)
        out.append(item)
        if len(out) >= top_k:
            break
    return out


def rank_papers(
    query: str,
    documents: List[Dict[str, Any]],
    top_k: int = 20,
) -> List[Dict[str, Any]]:
    """Rank whole papers (used for the candidate list shown before approval)."""
    if not documents or not query.strip():
        return []
    corpus = [
        tokenize(" ".join(str(x or "") for x in (d.get("title"), d.get("abstract"))))
        for d in documents
    ]
    bm25 = BM25(corpus)
    scores = bm25.score(content_terms(query))
    for d, toks, s in zip(documents, corpus, scores):
        recency = 0.0
        try:
            year = int(str(d.get("year") or "")[:4])
            if year:
                recency = min(0.25, max(0.0, (year - 2015) / 100.0))
        except (TypeError, ValueError):
            recency = 0.0
        d["_score"] = round(s + recency, 6)
    return sorted(documents, key=lambda d: -d["_score"])[:top_k]
