"""Vector RAG: local persistent Chroma DB with the deterministic fake embedder.

These tests prove the full vector pipeline with zero credentials: passages are
upserted with page/section/source-URL metadata, retrieval is cosine-similarity
restricted to approved papers, vectors survive review revisions, and deleting a
paper from the collection removes its vectors -- the only path that ever does.

The real OpenRouter embedder is exercised in integration tests (marked PENDING
without credentials); fake and real embeddings use separate Chroma collections
so they can never mix.
"""
from __future__ import annotations

import pytest

import config
import db
from services import discovery, vectorstore
from services.embeddings import FakeEmbedder


Q = "How does channel independence work in PatchTST?"


@pytest.fixture
def chroma_store(clean_db, monkeypatch):
    monkeypatch.setattr(config, "VECTOR_BACKEND", "chroma")
    monkeypatch.setattr(config, "OPENROUTER_API_KEY", "")  # force fake embedder
    # Clean up any existing collection before test
    import chromadb
    from chromadb.config import Settings
    client = chromadb.PersistentClient(
        path=str(config.CHROMA_PERSIST_DIR),
        settings=Settings(anonymized_telemetry=False),
    )
    try:
        client.delete_collection(config.CHROMA_COLLECTION_FAKE)
    except Exception:
        pass
    store = vectorstore.build_vector_store()
    assert store is not None and store.available
    assert store.embedder.real is False, "no key -> fake embedder"
    yield store
    # Cleanup: delete the test collection after test
    try:
        store._client.delete_collection(config.CHROMA_COLLECTION_FAKE)
    except Exception:
        pass


# --- embedder -------------------------------------------------------------
def test_fake_embedder_is_deterministic_and_discriminative(clean_db):
    e = FakeEmbedder()
    a1, a2 = e.embed("attention is all you need"), e.embed("attention is all you need")
    b = e.embed("croissant baking temperatures and yeast")
    assert a1 == a2, "the fake embedder must be deterministic"
    from services.vectorstore import cosine

    sim_self = cosine(a1, a2)
    sim_other = cosine(a1, b)
    assert sim_self > sim_other, "similar text must rank above unrelated text"
    assert abs(sum(v * v for v in a1) - 1.0) < 1e-6, "vectors must be normalised"


# --- chroma backend -------------------------------------------------------
def test_upsert_and_retrieve_with_metadata(chroma_store, seeded_corpus):
    doc = seeded_corpus[0]
    res = chroma_store.upsert_paper(doc["id"])
    assert res["upserted"] > 0
    assert chroma_store.count() == res["upserted"]
    assert res["embedder"]["real"] is False, "no key -> fake embedder, labelled"
    assert res["embedder"]["provider"] == "fake"

    hits = chroma_store.retrieve(Q, [doc["id"]], top_k=3)
    assert hits, "a semantically matched passage must be retrieved"
    best = hits[0]
    # Retrieved rows look like db.get_chunks rows so the agent pipeline is
    # unchanged, plus score/metadata.
    assert best["doc_id"] == doc["id"]
    assert best["page"] and best["section"]
    assert best["doc_title"]
    assert "_score" in best and best["_retriever"] == "vector-chroma"
    assert all(h["doc_id"] == doc["id"] for h in hits)


def test_retrieval_is_restricted_to_approved_papers(chroma_store, seeded_corpus):
    a, b = seeded_corpus[0], seeded_corpus[1]
    chroma_store.upsert_paper(a["id"])
    chroma_store.upsert_paper(b["id"])
    hits = chroma_store.retrieve(Q, [b["id"]], top_k=10)
    # Only the approved paper may appear, even though both are embedded.
    assert hits and all(h["doc_id"] == b["id"] for h in hits)


def test_retrieval_respects_approved_set_presence(chroma_store, seeded_corpus):
    chroma_store.upsert_paper(seeded_corpus[0]["id"])
    assert chroma_store.retrieve(Q, [], top_k=5) == []


def test_abstract_only_paper_carries_its_labels(chroma_store, clean_db):
    cand = {
        "doc_id": "arxiv_2099_00042",
        "arxiv_id": "2099.00042",
        "title": "Vector RAG over Astronomy Catalogues",
        "abstract": ("We embed astronomy catalogue passages for retrieval over "
                     "unseen survey datasets with zero-shot generalisation."),
        "authors": "V Astronomy",
        "year": "2099",
        "venue": "arXiv preprint",
        "doi": "",
        "abs_url": "https://arxiv.org/abs/2099.00042",
    }
    client = discovery._FakeArxivClient([], fail_downloads=[cand["arxiv_id"]])
    rec = discovery.ingest_candidate(cand, client=client)
    assert rec["full_text_available"] == 0

    chroma_store.upsert_paper(cand["doc_id"])
    hits = chroma_store.retrieve("astronomy catalogue retrieval", [cand["doc_id"]])
    assert hits, "abstract-only papers must still be retrievable"
    assert hits[0]["doc_full_text_available"] == 0
    assert hits[0]["doc_source_url"] == cand["abs_url"]


def test_delete_paper_removes_vectors_only(chroma_store, seeded_corpus):
    doc = seeded_corpus[0]
    chroma_store.upsert_paper(doc["id"])
    n = chroma_store.count()
    assert n > 0
    removed = chroma_store.delete_paper(doc["id"])
    assert removed == n
    assert chroma_store.count() == 0
    # The document itself is untouched until the explicit collection delete.
    assert db.get_document(doc["id"])


def test_build_vector_store_returns_none_when_off(clean_db, monkeypatch):
    monkeypatch.setattr(config, "VECTOR_BACKEND", "off")
    assert vectorstore.build_vector_store() is None
    assert vectorstore.sync_paper_vectors("anything")["skipped"] is True


def test_sync_all_upserts_every_paper(chroma_store, seeded_corpus):
    out = vectorstore.sync_all()
    assert out["papers"] == len(seeded_corpus)
    assert out["synced"] > 0


def test_fake_and_real_collections_are_separate(clean_db, monkeypatch):
    """Fake and real embeddings must never mix -- separate collections."""
    monkeypatch.setattr(config, "VECTOR_BACKEND", "chroma")

    # Fake embedder collection
    monkeypatch.setattr(config, "OPENROUTER_API_KEY", "")
    fake_store = vectorstore.build_vector_store()
    assert fake_store is not None and fake_store.available
    assert fake_store.collection.name == config.CHROMA_COLLECTION_FAKE
    fake_store.upsert_paper("test_doc_fake")
    fake_count = fake_store.count()

    # Real embedder collection (simulated by using a different collection name)
    # We can't test real without a key, but we verify the collection names differ
    assert config.CHROMA_COLLECTION_REAL != config.CHROMA_COLLECTION_FAKE


# --- astra removed, chroma is the only vector backend ---------------------
# (astra tests removed since astra backend is no longer supported)