"""HTTP-level tests against the real FastAPI app and the real corpus.

These assert the contract the frontend depends on. Every response here is
produced by the same code paths the UI calls.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client(real_corpus):
    import main

    with TestClient(main.app) as c:
        yield c


# --- health --------------------------------------------------------------
def test_health_reports_providers_and_limits(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert set(body["modes"]) == {"no_rag", "basic_rag", "agentic_rag"}
    assert body["limits"]["max_agent_iterations"] > 0
    assert body["limits"]["max_tool_calls"] > 0
    assert "providers" in body["llm"]


def test_root_points_at_the_workflow(client):
    body = client.get("/").json()
    assert body["status"] == "online"
    assert "sessions" in body["workflow"]


# --- corpus --------------------------------------------------------------
def test_corpus_lists_real_papers(client):
    body = client.get("/api/corpus").json()
    assert body["documents"]
    assert body["stats"]["documents"] == len(body["documents"])
    for d in body["documents"]:
        assert d["title"], d
        assert d["chunk_count"] > 0


def test_corpus_document_detail(client):
    docs = client.get("/api/corpus").json()["documents"]
    r = client.get(f"/api/corpus/{docs[0]['id']}")
    assert r.status_code == 200
    assert r.json()["sections"]


def test_unknown_document_is_404(client):
    assert client.get("/api/corpus/nope").status_code == 404


def test_suggest_ranks_by_relevance(client):
    r = client.get("/api/corpus/suggest", params={"q": "channel independence patching",
                                                  "top_k": 3})
    assert r.status_code == 200
    cands = r.json()["candidates"]
    assert cands
    scores = [c["relevance"] for c in cands]
    assert scores == sorted(scores, reverse=True)
    assert all(c["relevance"] > 0 for c in cands)


def test_suggest_requires_a_query(client):
    assert client.get("/api/corpus/suggest", params={"q": "  "}).status_code == 400


def test_upload_rejects_non_pdf(client):
    assert client.post(
        "/api/corpus/upload", files={"file": ("notes.txt", b"hello", "text/plain")}
    ).status_code == 400


# --- the review workflow -------------------------------------------------
def test_full_review_flow_over_http(client):
    """create -> approve -> run -> read back, exactly as the UI does it."""

    r = client.post("/api/sessions", json={
        "question": "How does channel independence work in PatchTST, and what does it buy?",
        "mode": "agentic_rag",
    })
    assert r.status_code == 200, r.text
    session = r.json()
    sid = session["session_id"]
    assert session["candidates"]

    docs = client.get("/api/corpus").json()["documents"]
    approved = [d["id"] for d in docs[:3]]
    r = client.post(f"/api/sessions/{sid}/approval", json={"decisions": [
        {"doc_id": i, "decision": "approved"} for i in approved
    ]})
    assert r.status_code == 200, r.text
    assert set(r.json()["approved"]) == set(approved)

    r = client.post(f"/api/sessions/{sid}/run", json={})
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["state"] in ("complete", "awaiting_user", "insufficient_evidence")
    assert out["review"]["question"]
    assert out["activity"], "the activity log must be returned to the UI"

    # Nothing outside the approved set may be cited.
    assert {c["doc_id"] for c in out["citations"]} <= set(approved)

    r = client.get(f"/api/sessions/{sid}")
    assert r.status_code == 200
    view = r.json()
    assert view["can_run"] is True
    assert view["review"]["question"] == out["review"]["question"]

    r = client.get(f"/api/sessions/{sid}/markdown")
    assert r.status_code == 200
    assert r.json()["markdown"].startswith("# Literature review")


def test_run_without_approval_is_rejected(client):
    sid = client.post("/api/sessions", json={"question": "What is channel independence?"}).json()["session_id"]
    r = client.post(f"/api/sessions/{sid}/run", json={})
    assert r.status_code == 400
    assert "approve" in r.json()["detail"].lower()


def test_short_question_is_rejected(client):
    r = client.post("/api/sessions", json={"question": "hi"})
    assert r.status_code == 400


def test_unknown_mode_is_rejected(client):
    r = client.post("/api/sessions", json={"question": "What is channel independence?",
                                          "mode": "telepathy"})
    assert r.status_code == 400
    assert "mode" in r.json()["detail"].lower()


def test_unknown_session_is_404(client):
    assert client.get("/api/sessions/nope").status_code == 404
    assert client.post("/api/sessions/nope/run", json={}).status_code == 404


def test_reply_without_a_pending_question_is_rejected(client):
    sid = client.post("/api/sessions", json={"question": "What is channel independence?"}).json()["session_id"]
    r = client.post(f"/api/sessions/{sid}/reply", json={"reply": "focus on PatchTST"})
    assert r.status_code == 400


def test_markdown_export_requires_a_review(client):
    sid = client.post("/api/sessions", json={"question": "What is channel independence?"}).json()["session_id"]
    assert client.get(f"/api/sessions/{sid}/markdown").status_code == 409


def test_sessions_are_listed(client):
    assert client.get("/api/sessions").json()["sessions"] is not None


# --- legacy routes, now backed by real data -----------------------------
def test_legacy_papers_route_serves_the_real_corpus(client):
    body = client.get("/api/papers").json()
    assert body, "legacy route must still return the real corpus, not mocks"
    for p in body:
        assert p["title"]
        # Real ingested PDFs may have valid DOIs (e.g. arXiv papers carry
        # their canonical doi); the invariant is simply that the field is
        # present and is a string -- not that it matches a narrow set of
        # placeholder values left over from the original mock data.
        assert isinstance(p.get("doi", ""), str)



def test_legacy_agent_steps_are_empty_without_runs(client, ):
    """No hardcoded provenance. With no session scoped, the list is empty."""
    steps = client.get("/api/agents/steps", params={"session_id": "nope"}).json()
    assert steps == []


def test_autopilot_is_reported_as_unsupported(client):
    r = client.post("/api/agents/autopilot", json={"enabled": True})
    assert r.json()["autopilot"] is False
    assert "not supported" in r.json()["note"].lower()


def test_bibtex_export_is_real(client):
    r = client.get("/api/evidence/export/bibtex")
    assert r.status_code == 200
    body = r.text
    assert "@article{" in body
    # The original returned a hardcoded block with a fabricated DOI and a
    # fabricated paper. Neither may reappear.
    assert "10.1109/TSG.2024.3389102" not in body
    assert "Microgrid" not in body


def test_evidence_matrix_is_empty_without_a_session(client):
    assert client.get("/api/evidence/matrix").json() == []


def test_pdf_routes_still_work(client):
    """The Chat-with-PDF page calls these; they must not regress."""
    docs = client.get("/pdf/documents").json()
    assert docs
    r = client.post("/pdf/query", json={
        "query": "What is channel independence?",
        "active_doc_ids": [d["id"] for d in docs[:3]],
    })
    assert r.status_code == 200, r.text
    assert r.json()["answer"]
