"""Retrieval tests: BM25, fusion, prose prior, diversification, determinism.

These assert behaviour that was empirically calibrated against the bundled
corpus, so a regression shows up as a failure rather than as a quiet drop in
citation quality.
"""
from __future__ import annotations

import pytest

from services import retrieval
from services.retrieval import BM25, reciprocal_rank_fusion


# --- BM25 ---------------------------------------------------------------
def test_bm25_prefers_term_frequency():
    docs = [["alpha"] * 5, ["alpha", "beta"], ["gamma"]]
    scores = BM25(docs).score(["alpha"])
    assert scores[0] > scores[1] > scores[2]


def test_bm25_idf_rewards_rare_terms():
    docs = [["common", "rare"], ["common", "other"], ["common", "third"]]
    m = BM25(docs)
    assert m.score(["rare"])[0] > 0
    assert m.score(["nonexistent"])[0] == 0.0


def test_bm25_is_deterministic():
    docs = [["a", "b"], ["b", "c"], ["c", "d"]]
    assert BM25(docs).score(["a", "c"]) == BM25(docs).score(["a", "c"])


# --- RRF ----------------------------------------------------------------
def test_rrf_rewards_agreement_across_rankers():
    fused = reciprocal_rank_fusion([[0, 1, 2], [0, 2, 1]])
    assert fused[0] > fused[1] and fused[0] > fused[2]


def test_rrf_handles_empty_input():
    assert reciprocal_rank_fusion([]) == {}


# --- tokenisation -------------------------------------------------------
def test_stopwords_dropped_but_content_kept():
    assert retrieval.tokenize("The Transformer uses attention") == [
        "transformer", "uses", "attention"
    ]


def test_content_terms_deduplicates_preserving_order():
    assert retrieval.content_terms("patching patching tokenization tokenization") == [
        "patching", "tokenization"
    ]


def test_empty_query_yields_nothing(chunks):
    assert retrieval.retrieve("", chunks) == []
    assert retrieval.retrieve("   ", chunks) == []


# --- intent detection ---------------------------------------------------
@pytest.mark.parametrize(
    "query,intent",
    [
        ("How does PatchTST patch a time series?", "method"),
        ("What are the limitations of these models?", "limitation"),
        ("What results do they report on benchmarks?", "result"),
        ("what is the ProbSparse attention mechanism", "method"),
    ],
)
def test_detect_intents(query, intent):
    assert intent in retrieval.detect_intents(query)


def test_section_boost_prefers_matching_sections():
    assert retrieval.section_boost("3. Methodology", {"method"}) > 0
    assert retrieval.section_boost("6. Limitations & Gaps", {"limitation"}) > 0
    assert retrieval.section_boost("2. Related Work", {"method"}) == 0.0
    assert retrieval.section_boost("3. Methodology", set()) == 0.0


# --- end-to-end retrieval on the real corpus ----------------------------
def test_retrieval_finds_the_right_paper(chunks):
    """A question about a specific method must surface that paper."""
    hits = retrieval.retrieve(
        "How does iTransformer invert the variate tokens?",
        chunks, top_k=5,
    )
    assert hits, "expected results"
    titles = " ".join(h["doc_title"] for h in hits).lower()
    assert "itransformer" in titles


def test_retrieval_demotes_table_debris(chunks):
    """Figure/table fragments must not dominate purely on term density."""
    hits = retrieval.retrieve(
        "decomposition trend seasonal auto-correlation Autoformer",
        chunks, top_k=5,
    )
    assert hits
    for h in hits:
        assert h["_prose"] > 0.0
        # Every returned chunk must read like prose, not a numeric table row.
        assert h["_prose"] >= 0.5, f"debris leaked into top-k: {h['text'][:80]!r}"


def test_retrieval_is_deterministic(chunks):
    q = "efficiency of attention for long sequences"
    a = [h["id"] for h in retrieval.retrieve(q, chunks, top_k=6)]
    b = [h["id"] for h in retrieval.retrieve(q, chunks, top_k=6)]
    assert a == b


def test_per_doc_cap_is_enforced(chunks):
    hits = retrieval.retrieve(
        "transformer attention forecasting", chunks, top_k=10, per_doc_cap=2
    )
    per_doc: dict = {}
    for h in hits:
        per_doc[h["doc_id"]] = per_doc.get(h["doc_id"], 0) + 1
    assert all(n <= 2 for n in per_doc.values()), per_doc
    assert len(per_doc) >= 2, "diversification should surface multiple papers"


def test_provenance_fields_present(chunks):
    hits = retrieval.retrieve("patching sub-series tokens", chunks, top_k=3)
    assert hits
    for h in hits:
        for key in ("_score", "_bm25", "_prose", "_section_boost", "_intents"):
            assert key in h


def test_rank_papers_orders_by_relevance(corpus):
    ranked = retrieval.rank_papers("inverted transformers variate tokens", corpus)
    assert ranked
    assert ranked[0]["_score"] >= ranked[-1]["_score"]
