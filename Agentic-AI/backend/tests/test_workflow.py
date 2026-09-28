"""Session lifecycle, approval gate, resumption, and review assembly.

The review assembler is tested against hand-written verified answers so its
bucketing is checked independently of the agent, and against the real corpus so
its "not established" behaviour is checked against real thin evidence.
"""
from __future__ import annotations

import pytest

import db
from services import review_service, workflow


QUESTION = "How does channel independence work in PatchTST, and what does it buy?"

ANSWER_WITH_FINDINGS = (
    "**Evidence-grounded answer (extractive mode).**\n\n"
    "- [S1 p.5] PatchTST reduces the forecasting error by a large margin when the "
    "look-back window is increased [S1].\n"
    "- [S1 p.9] Channel independence improves the model accuracy compared with "
    "channel mixing on eight datasets [S1].\n"
    "- [S2 p.3] The approach has a limitation: it cannot model cross-channel "
    "dependencies directly [S2].\n"
    "- [S2 p.11] Anomaly detection and transfer learning remain an open question "
    "for this family of models [S2].\n"
    "- [S3 p.2] Both methods commonly use a decomposition of the input series "
    "before the encoder [S3].\n"
)

CITATIONS = [
    {"marker": "S1", "page": 5, "doc_id": "d1", "title": "Paper One",
     "authors": "A One", "year": "2023", "venue": "ICLR", "arxiv_id": "2211.14730",
     "doi": "", "section": "3. Methodology", "quote": "reduced error"},
    {"marker": "S1", "page": 9, "doc_id": "d1", "title": "Paper One",
     "authors": "A One", "year": "2023", "venue": "ICLR", "arxiv_id": "2211.14730",
     "doi": "", "section": "4. Experiments", "quote": "improves accuracy"},
    {"marker": "S2", "page": 3, "doc_id": "d2", "title": "Paper Two",
     "authors": "B Two", "year": "2022", "venue": "NeurIPS", "arxiv_id": "2310.06625",
     "doi": "", "section": "5. Conclusion", "quote": "limitation"},
    {"marker": "S3", "page": 2, "doc_id": "d3", "title": "Paper Three",
     "authors": "C Three", "year": "2021", "venue": "AAAI", "arxiv_id": "2106.13008",
     "doi": "", "section": "1. Introduction", "quote": "decomposition"},
]

PAPERS = [
    {"marker": "S1", "title": "Paper One", "authors": "A One", "year": "2023",
     "venue": "ICLR", "arxiv_id": "2211.14730", "doi": ""},
    {"marker": "S2", "title": "Paper Two", "authors": "B Two", "year": "2022",
     "venue": "NeurIPS", "arxiv_id": "2310.06625", "doi": ""},
    {"marker": "S4", "title": "Paper Four (never cited)", "authors": "D Four",
     "year": "2020", "venue": "ICML", "arxiv_id": "1706.03762", "doi": ""},
]


# --- review assembly -----------------------------------------------------
def test_sections_are_populated_from_cited_claims():
    review = review_service.assemble_review(
        ANSWER_WITH_FINDINGS, CITATIONS, PAPERS, QUESTION,
        verified=True, support_rate=1.0,
    )
    assert review["sections"]["key_findings"] != [review_service.NOT_ESTABLISHED]
    assert review["sections"]["comparison"] != [review_service.NOT_ESTABLISHED]
    assert review["sections"]["limitations"] != [review_service.NOT_ESTABLISHED]
    assert review["sections"]["gaps"] != [review_service.NOT_ESTABLISHED]
    assert review["sections"]["themes"] != [review_service.NOT_ESTABLISHED]


def test_empty_sections_say_not_established():
    review = review_service.assemble_review(
        "- [S1 p.5] PatchTST reduces the forecasting error substantially [S1].",
        CITATIONS[:1], PAPERS, QUESTION, verified=True, support_rate=1.0,
    )
    assert review["sections"]["gaps"] == [review_service.NOT_ESTABLISHED]
    assert review["sections"]["limitations"] == [review_service.NOT_ESTABLISHED]


def test_comparison_table_lists_every_paper_even_uncited():
    review = review_service.assemble_review(
        ANSWER_WITH_FINDINGS, CITATIONS, PAPERS, QUESTION, verified=True,
    )
    rows = {r["title"]: r for r in review["comparison_table"]}
    assert len(rows) == 3
    assert rows["Paper One"]["pages_cited"] == [5, 9]
    assert rows["Paper One"]["cited"] is True
    assert rows["Paper Four (never cited)"]["cited"] is False


def test_no_paper_metadata_is_invented():
    """Missing fields must be `None`, not a placeholder that reads as data."""
    review = review_service.assemble_review(
        ANSWER_WITH_FINDINGS, CITATIONS,
        [{"marker": "S9", "title": "Untitled"}], QUESTION, verified=True,
    )
    row = review["comparison_table"][0]
    assert row["authors"] is None
    assert row["year"] is None
    assert row["doi"] is None
    assert "None" not in review_service.render_markdown(review)


def test_unverified_review_is_flagged():
    review = review_service.assemble_review(
        ANSWER_WITH_FINDINGS, CITATIONS, PAPERS, QUESTION, verified=False,
        support_rate=0.4,
    )
    assert review["unverified"] is True
    assert review["verified"] is False


def test_markdown_render_mentions_every_source():
    review = review_service.assemble_review(
        ANSWER_WITH_FINDINGS, CITATIONS, PAPERS, QUESTION, verified=True,
    )
    md = review_service.render_markdown(review)
    assert "# Literature review" in md
    for c in review["sources"]:
        assert c["marker"] in md
    assert "| S1 |" in md


def test_real_run_produces_a_review_with_real_sources(real_corpus):
    from services import agent

    result = agent.run_agentic(QUESTION, doc_ids=[d["id"] for d in real_corpus])
    review = review_service.assemble_review(
        result.answer, result.citations, result.papers, QUESTION,
        verified=result.verified, support_rate=result.support_rate,
    )
    assert review["question"] == QUESTION
    for s in review["sources"]:
        assert s["title"], "a source must name a real paper"
        assert s["page"], "a source must name a real page"
        if s.get("doi"):
            assert s["doi"] != "Unavailable"


# --- session lifecycle ---------------------------------------------------
def test_session_requires_a_real_question(real_corpus):
    with pytest.raises(workflow.WorkflowError):
        workflow.start_session("hi")


def test_session_rejects_unknown_mode(real_corpus):
    with pytest.raises(workflow.WorkflowError):
        workflow.start_session(QUESTION, mode="telepathy")


def test_run_refuses_without_approval(real_corpus):
    s = workflow.start_session(QUESTION)
    with pytest.raises(workflow.WorkflowError) as exc:
        workflow.run_review(s["session_id"])
    assert "approve" in str(exc.value).lower()


def test_approval_rejects_unknown_document(real_corpus):
    s = workflow.start_session(QUESTION)
    with pytest.raises(workflow.WorkflowError):
        workflow.set_approvals(s["session_id"], [
            {"doc_id": "does-not-exist", "decision": "approved"},
        ])


def test_approval_rejects_nonsense_decision(real_corpus):
    s = workflow.start_session(QUESTION)
    doc_id = real_corpus[0]["id"]
    with pytest.raises(workflow.WorkflowError):
        workflow.set_approvals(s["session_id"], [
            {"doc_id": doc_id, "decision": "maybe"},
        ])


def test_full_workflow_real_corpus(real_corpus):
    s = workflow.start_session(QUESTION, mode="agentic_rag")
    assert s["session_id"]
    assert s["candidates"], "the approval panel needs something to approve"

    approved = [d["id"] for d in real_corpus[:3]]
    workflow.set_approvals(s["session_id"], [
        {"doc_id": i, "decision": "approved"} for i in approved
    ])
    out = workflow.run_review(s["session_id"])

    assert out["state"] in ("complete", "awaiting_user", "insufficient_evidence")
    assert out["review"]["question"].startswith(QUESTION)
    # Nothing outside the approved set may be cited.
    cited_docs = {c["doc_id"] for c in out["citations"]}
    assert cited_docs <= set(approved), cited_docs - set(approved)

    view = workflow.get_session_view(s["session_id"])
    assert view["session_id"] == s["session_id"]
    assert set(view["approved"]) == set(approved)
    assert view["activity"], "the activity log must survive the round trip"


def test_session_state_is_reproducible_after_reload(real_corpus):
    """A review must resume from the database, not from process memory."""
    s = workflow.start_session(QUESTION)
    approved = [d["id"] for d in real_corpus[:2]]
    workflow.set_approvals(s["session_id"], [
        {"doc_id": i, "decision": "approved"} for i in approved
    ])
    workflow.run_review(s["session_id"])
    first = workflow.get_session_view(s["session_id"])

    raw = db.get_session(s["session_id"])
    assert raw["review"]["question"] == QUESTION
    assert raw["activity"]
    assert first["review"] == raw["review"]


def test_reply_refuses_when_not_waiting(real_corpus):
    s = workflow.start_session(QUESTION)
    with pytest.raises(workflow.WorkflowError):
        workflow.answer_user(s["session_id"], "some clarification")


def test_unknown_session_raises(real_corpus):
    with pytest.raises(workflow.WorkflowError):
        workflow.get_session_view("no-such-session")
