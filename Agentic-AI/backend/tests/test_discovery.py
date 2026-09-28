"""Fresh-topic discovery: arXiv search, refinement, dedupe, ingest-on-approval.

Everything runs against `_FakeArxivClient` -- the arXiv export API is frequently
rate-limited from CI/dev boxes, and the point here is the *logic*: canonical
candidate shape, refine-when-poor, dedupe against the corpus, PDF vs
abstract-only ingest. Live-network behaviour is exercised by the API smoke path
(PENDING when arXiv is unreachable) and documented in the final report.
"""
from __future__ import annotations

import pytest

import db
from services import arxiv, discovery, workflow

Q = "How do graph neural networks generalise to unseen graphs?"

CANDIDATES = [
    {
        "arxiv_id": "2023.12345",
        "title": "Graph Meta-Learning for Unseen Graph Generalisation",
        "abstract": "We study graph neural networks generalising to unseen graph structures.",
        "authors": "A Graph, B Networks",
        "year": "2023",
        "venue": "arXiv preprint",
        "doi": "",
        "abs_url": "https://arxiv.org/abs/2023.12345",
    },
    {
        "arxiv_id": "2024.54321",
        "title": "Unseen Graph Topology and Transfer Learning",
        "abstract": "Transferring graph representations to unseen topologies.",
        "authors": "C Transfer",
        "year": "2024",
        "venue": "arXiv preprint",
        "doi": "10.1234/example",
        "abs_url": "https://arxiv.org/abs/2024.54321",
    },
]

# A duplicate of the first candidate under a different version string must not
# appear twice (arXiv returns the same paper under several ids).
DUPLICATE = {**CANDIDATES[0], "arxiv_id": "2023.12345v2", "title": CANDIDATES[0]["title"]}


def _fake_client(**kw) -> discovery._FakeArxivClient:
    return discovery._FakeArxivClient([*CANDIDATES, DUPLICATE], **kw)


# --- discover() -----------------------------------------------------------
def test_discover_returns_canonical_candidates(clean_db):
    out = discovery.discover(Q, client=_fake_client(), use_cache=False)
    assert out["candidates"], "a fresh topic search must return candidates"
    first = out["candidates"][0]
    assert first["doc_id"] == "arxiv_2023_12345"
    assert first["abs_url"] == "https://arxiv.org/abs/2023.12345"
    assert first["pdf_url"].startswith("https://arxiv.org/pdf/")
    assert first["title"] and first["abstract"]
    # The version-duplicate must have been deduped by arxiv id / title.
    titles = [c["title"] for c in out["candidates"]]
    assert titles.count(CANDIDATES[0]["title"]) == 1
    assert not out["cached"]
    # Search events are recorded so the UI can show what was tried.
    assert out["search_events"][0]["query"] == Q


def test_discover_refines_when_first_pass_is_poor(clean_db):
    irrelevant = {
        "arxiv_id": "2201.00001",
        "title": "A Study of Prehistoric Pottery Firing Temperatures",
        "abstract": "Ceramic analysis of kiln temperature effects on ancient pottery.",
        "authors": "D Kiln",
        "year": "2022",
        "venue": "arXiv preprint",
        "doi": "",
        "abs_url": "https://arxiv.org/abs/2201.00001",
    }
    relevant = {
        "arxiv_id": "2202.00002",
        "title": "Graph Neural Network Generalisation to Unseen Graphs",
        "abstract": "We study how graph neural networks generalise to unseen graph structures.",
        "authors": "E Gnn",
        "year": "2022",
        "venue": "arXiv preprint",
        "doi": "",
        "abs_url": "https://arxiv.org/abs/2202.00002",
    }
    client = discovery._FakeArxivClient(
        [irrelevant], refined_entries=[relevant]
    )
    out = discovery.discover(Q, client=client, use_cache=False)
    assert out["refined"] is True, "poor first pass should trigger a refined query"
    assert len(client.search_calls) == 2
    assert any("graph" in q.lower() for q in client.search_calls[1:])
    assert any(c["arxiv_id"] == "2202.00002" for c in out["candidates"])
    # Both passes remain visible in the event log.
    assert len(out["search_events"]) >= 2


def test_discover_dedupes_against_corpus(seeded_corpus):
    # A real corpus was seeded into this test's database: its papers can never
    # be re-suggested by a fresh-topic search.
    known = {d.get("arxiv_id") for d in db.list_documents() if d.get("arxiv_id")}
    assert known, "seeded corpus must carry arXiv ids"
    known_entry = {
        "arxiv_id": next(iter(known)),
        "title": "Corpus paper that should be skipped",
        "abstract": "Already in the corpus; must not be re-suggested.",
        "authors": "Z Known",
        "year": "2020",
        "venue": "arXiv preprint",
        "doi": "",
        "abs_url": "https://arxiv.org/abs/0000.00000",
    }
    client = discovery._FakeArxivClient([known_entry, *CANDIDATES])
    out = discovery.discover(Q, client=client, use_cache=False)
    ids = {c["arxiv_id"] for c in out["candidates"]}
    assert not ids & known, "corpus papers must not reappear as new candidates"
    assert out["skipped_known"] >= 1


def test_discover_caches_and_reuses(clean_db):
    first = discovery.discover(Q, client=_fake_client(), use_cache=True)
    cached = db.get_discovery_cache(Q)
    assert cached, "a successful search must be cached"
    # A second call (no client injected even) reuses the cache, no network.
    again = discovery.discover(Q, use_cache=True)
    assert again["cached"] is True
    assert [c["doc_id"] for c in again["candidates"]] == [
        c["doc_id"] for c in first["candidates"]
    ]


def test_discover_empty_question_is_harmless(clean_db):
    out = discovery.discover("   ", client=_fake_client(), use_cache=False)
    assert out["candidates"] == []
    assert "Empty" in out["error"]


# --- ingest_candidate -----------------------------------------------------
def test_ingest_full_text_pdf(clean_db):
    cand = discovery.discover(Q, client=_fake_client(), use_cache=False)["candidates"][0]
    rec = discovery.ingest_candidate(cand, client=_fake_client())
    assert rec.get("duplicate") is False
    assert rec["full_text_available"] == 1
    assert db.get_document(cand["doc_id"])
    assert db.get_chunks([cand["doc_id"]]), "a full-text paper must have chunks"
    # Re-ingesting is a no-op duplicate.
    again = discovery.ingest_candidate(cand, client=_fake_client())
    assert again["duplicate"] is True


def test_ingest_abstract_only_when_pdf_unavailable(clean_db):
    cand = discovery.discover(Q, client=_fake_client(), use_cache=False)["candidates"][0]
    client = _fake_client(fail_downloads=[cand["arxiv_id"]])
    rec = discovery.ingest_candidate(cand, client=client)
    assert rec["abstract_only"] is True
    assert rec["full_text_available"] == 0
    assert rec["reason"], "the reason for abstract-only must be recorded"
    doc = db.get_document(cand["doc_id"])
    assert doc["full_text_available"] == 0
    chunks = db.get_chunks([cand["doc_id"]])
    assert len(chunks) == 1 and chunks[0]["section"] == "Abstract"


def test_ingest_requires_arxiv_id(clean_db):
    with pytest.raises(ValueError):
        discovery.ingest_candidate({"title": "No id"}, client=_fake_client())


# --- workflow integration -------------------------------------------------
def test_approving_a_discovery_candidate_ingests_then_runs(clean_db, monkeypatch):
    """Approving an arXiv candidate materialises it before the decision is
    recorded, so the review can then be run over it."""
    s = workflow.start_session(Q)  # corpus mode; discovery handled below
    sid = s["session_id"]

    cand = {
        "doc_id": "arxiv_2099_00001",
        "arxiv_id": "2099.00001",
        "title": "Graph Foundation Models for Zero-Shot Generalisation",
        "abstract": ("Graph foundation models generalise to unseen graphs "
                     "with zero-shot transfer of structural inductive biases."),
        "authors": "F Fm",
        "year": "2099",
        "venue": "arXiv preprint",
        "doi": "",
        "abs_url": "https://arxiv.org/abs/2099.00001",
    }
    db.update_session(sid, discovery=[cand])

    calls = {"n": 0}

    def fake_ingest(candidate, client=None):
        calls["n"] += 1
        assert candidate["doc_id"] == "arxiv_2099_00001"
        return {**candidate, "full_text_available": 0, "abstract_only": True}

    monkeypatch.setattr("services.discovery.ingest_candidate", fake_ingest)
    out = workflow.set_approvals(sid, [
        {"doc_id": cand["doc_id"], "decision": "approved"},
    ])
    assert calls["n"] == 1
    assert out["approved"] == [cand["doc_id"]]
    assert out["ingested"][0]["doc_id"] == cand["doc_id"]


def test_rejecting_an_unmaterialised_discovery_candidate_is_recorded(clean_db, monkeypatch):
    """Rejecting a fresh-topic candidate that has never been materialised as a
    document must still record the decision, so the agent never sees it as
    un-decided. Regression: this used to raise 'Unknown document' and silently
    drop the rejection (approvals partially written, 400 to the UI)."""
    s = workflow.start_session(Q)
    sid = s["session_id"]

    def cand(doc_id, title):
        return {
            "doc_id": doc_id,
            "arxiv_id": doc_id.replace("arxiv_", "").replace("_", "."),
            "title": title,
            "abstract": (title + ". A reasonably long abstract so full-text "
                         "ingest paths behave realistically across papers."),
            "authors": "F Fm",
            "year": "2099",
            "venue": "arXiv preprint",
            "doi": "",
            "abs_url": f"https://arxiv.org/abs/{doc_id}",
        }

    cands = [cand("arxiv_2099_00001", "Graph Foundation Models A"),
             cand("arxiv_2099_00002", "Graph Foundation Models B")]
    db.update_session(sid, discovery=cands)

    calls = {"n": 0}

    def fake_ingest(candidate, client=None):
        calls["n"] += 1
        assert candidate["doc_id"] == cands[0]["doc_id"]
        return {**candidate, "full_text_available": 1, "abstract_only": False}

    monkeypatch.setattr("services.discovery.ingest_candidate", fake_ingest)
    out = workflow.set_approvals(sid, [
        {"doc_id": cands[0]["doc_id"], "decision": "approved"},
        {"doc_id": cands[1]["doc_id"], "decision": "rejected"},
    ])
    # Only the approved candidate is materialised; the rejected one is still
    # recorded so it is excluded from the agent's scope.
    assert calls["n"] == 1
    assert out["approved"] == [cands[0]["doc_id"]]
    assert out["rejected"] == [cands[1]["doc_id"]]
    assert all(d["decision"] == "approved" for d in out["decisions"] if d["doc_id"] == cands[0]["doc_id"])
    assert any(d["decision"] == "rejected" for d in out["decisions"] if d["doc_id"] == cands[1]["doc_id"])


def test_workflow_rejects_requested_keyed_provider_without_key(clean_db):
    with pytest.raises(workflow.WorkflowError) as exc:
        workflow.start_session(Q, provider="openrouter")
    assert "OPENROUTER_API_KEY" in str(exc.value)


def test_arxiv_network_helpers_exist():
    # The live client interface used by the API path (not called here).
    client = discovery.ArxivClient()
    assert callable(client.search) and callable(client.download_pdf)
    assert arxiv.pdf_url("2001.00001") == "https://arxiv.org/pdf/2001.00001"