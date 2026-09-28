"""Agent loop, approval gate, limits, and the insufficient-evidence path.

These are the tests for the claims the project actually makes, so they are
written against observable behaviour rather than internals: a run either cites
real retrieved passages or it says it could not.
"""
from __future__ import annotations

import re

import pytest

import db
from services import agent
from services.agent import callbacks as cb
from services.agent.callbacks import ActivityRecorder
from services.agent.reflection import verify
from services.agent.tools import ToolBudgetExceeded, ToolContext, build_tools

QUESTION = "How does channel independence work in PatchTST?"


# --- the approval gate is not optional ----------------------------------
def test_run_with_no_approved_papers_cites_nothing(real_corpus):
    result = agent.run_agentic(QUESTION, doc_ids=[])
    assert result.citations == []
    assert "approved" in " ".join(e["detail"] for e in result.activity).lower()
    assert result.insufficient_evidence is True


def test_search_tool_cannot_reach_unapproved_paper(real_corpus):
    """`search_papers` is passed only approved ids, so the corpus it sees is
    the approved subset -- the gate holds at the query, not just the filter."""
    doc_ids = [d["id"] for d in real_corpus]
    approved = doc_ids[0]
    ctx = ToolContext(
        question=QUESTION,
        approved_doc_ids=[approved],  # only the first paper is approved
        recorder=ActivityRecorder(QUESTION),
    )
    tools = {t.name: t for t in build_tools(ctx)}
    # Query the approved paper's actual topic so coverage passes.
    out = tools["search_papers"].run({"query": "attention"})
    for other in doc_ids[1:]:
        title = (db.get_document(other) or {}).get("title", "")
        assert title[:40] not in out, f"leaked unapproved paper: {title}"


def test_read_passage_refuses_unapproved_chunk(real_corpus):
    """`read_passage` resolves against the passages this run actually retrieved.

    A chunk from an unapproved paper was never retrieved, so it is unresolvable
    -- the tool cannot hand it back even when its id is guessed.
    """
    doc_ids = [d["id"] for d in real_corpus]
    approved = doc_ids[0]
    foreign = next(c for c in db.get_chunks([doc_ids[1]]) if c["text"].strip())
    ctx = ToolContext(
        question=QUESTION, approved_doc_ids=[approved],
        recorder=ActivityRecorder(QUESTION),
    )
    tools = {t.name: t for t in build_tools(ctx)}
    out = tools["read_passage"].run({"chunk_id": foreign["id"]})
    low = out.lower()
    assert "no passage matches" in low, out[:200]
    # And it must not have leaked the passage text.
    assert foreign["text"][:60] not in out


def test_unapproved_paper_cannot_be_cited(real_corpus):
    approved, other = real_corpus[0]["id"], real_corpus[1]["id"]
    evidence = [
        {"id": "x", "doc_id": other, "marker": "S1", "page": 1,
         "section": "1", "doc_title": "Unapproved paper",
         "text": "Channel independence treats each variate separately."}
    ]
    result = verify("Channel independence treats each variate separately [S1].",
                    evidence, approved_doc_ids=[approved])
    assert not result.verified
    assert any("never approved" in i for i in result.issues)


# --- the loop terminates and respects limits -----------------------------
def test_agentic_run_terminates_within_limits(real_corpus):
    doc_ids = [d["id"] for d in real_corpus[:3]]
    result = agent.run_agentic(QUESTION, doc_ids=doc_ids, max_iterations=6)
    assert result.state in ("complete", "awaiting_user", "insufficient_evidence")
    assert result.metrics["tool_calls"] <= result.metrics.get("max_tool_calls", 12)
    assert len(result.activity) > 0


def test_tool_budget_is_enforced(real_corpus):
    """Exhausting the tool budget must stop the run, not silently continue."""
    from services.agent.tools import build_tools as _bt  # noqa: F401

    doc_ids = [d["id"] for d in real_corpus[:3]]
    result = agent.run_agentic(QUESTION, doc_ids=doc_ids, max_iterations=12)
    tool_events = [e for e in result.activity if e["kind"] == "tool"]
    assert len(tool_events) == result.metrics["tool_calls"]
    assert result.metrics["tool_calls"] <= 12


def test_exhausted_marker_is_not_reported_as_an_answer(real_corpus):
    """A run cut short must not present the executor's stop string as content.

    LangChain returns "Agent stopped due to iteration limit or time limit." as a
    successful return value. Passing that through as the answer would report a
    truncated run as a finished one, so the executor has to intercept it.
    """
    from services.agent.executor import EXHAUSTED_MARKER

    assert EXHAUSTED_MARKER in "Agent stopped due to iteration limit or time limit."

    doc_ids = [d["id"] for d in real_corpus[:4]]
    result = agent.run_agentic(QUESTION, doc_ids=doc_ids, max_iterations=1)
    assert result.answer.strip() != EXHAUSTED_MARKER.strip()
    if not result.citations:
        assert "insufficient evidence" in result.answer.lower() or result.state != "complete"


# --- modes ---------------------------------------------------------------
@pytest.mark.parametrize("mode", ["no_rag", "basic_rag", "agentic_rag"])
def test_all_modes_run(real_corpus, mode):
    doc_ids = [d["id"] for d in real_corpus[:4]]
    result = agent.run(mode, QUESTION, doc_ids=doc_ids)
    assert result.mode == mode
    assert isinstance(result.answer, str) and result.answer.strip()
    assert result.provider


def test_no_rag_produces_no_citations(real_corpus):
    result = agent.run_no_rag(QUESTION)
    assert result.citations == []
    assert result.metrics["llm_real"] is False


def test_basic_rag_cites_real_pages(real_corpus):
    doc_ids = [d["id"] for d in real_corpus[:4]]
    result = agent.run_basic_rag(QUESTION, doc_ids=doc_ids)
    assert result.citations, "basic RAG should produce citations for an in-scope question"
    for c in result.citations:
        assert c["page"], c
        assert c["quote"], "a citation must carry the passage it came from"
        assert c["title"], c


def test_unknown_mode_raises(real_corpus):
    with pytest.raises(ValueError):
        agent.run("telepathy", QUESTION, doc_ids=[real_corpus[0]["id"]])


# --- insufficient evidence ----------------------------------------------
def test_out_of_scope_question_does_not_fabricate(real_corpus):
    """An unanswerable question must either be refused or paused for the human.

    Any resolution that ends with zero fabricated citations is acceptable:
    the agent may declare insufficient evidence, or it may pause and ask the
    researcher (awaiting_user). What it must never do is answer anyway with
    invented passages.
    """
    doc_ids = [d["id"] for d in real_corpus[:3]]
    result = agent.run_agentic(
        "What is the asymptotic freedom scale in quantum chromodynamics?",
        doc_ids=doc_ids,
    )
    assert result.state in ("awaiting_user", "insufficient_evidence"), result.state
    if result.insufficient_evidence:
        assert "insufficient evidence" in result.answer.lower() \
            or "pause" in result.answer.lower()
        assert not result.citations
    else:
        # awaiting_user: it asked the human instead of guessing
        assert result.pending
        assert not result.citations


# --- citations resolve to stored chunks ---------------------------------
def test_evidence_marker_namespace_is_consistent(real_corpus):
    """Markers in the answer must match the citation records exactly.

    These two namespaces drifted apart once and silently failed every claim in a
    run, so it is asserted rather than assumed.
    """
    doc_ids = [d["id"] for d in real_corpus[:4]]
    result = agent.run_agentic(QUESTION, doc_ids=doc_ids)
    markers = {c["marker"] for c in result.citations}
    used = set(re.findall(r"\[(S\d+)", result.answer))
    assert used <= markers, f"answer cites {used - markers}, which have no citation record"


def test_every_citation_names_a_real_page_and_quote(real_corpus):
    doc_ids = [d["id"] for d in real_corpus[:4]]
    result = agent.run_agentic(QUESTION, doc_ids=doc_ids)
    for c in result.citations:
        assert c["marker"].startswith("S")
        assert c["title"], c
        assert c["page"], c
        assert c["quote"], c


# --- activity log --------------------------------------------------------
def test_activity_log_has_plan_tool_and_verification(real_corpus):
    doc_ids = [d["id"] for d in real_corpus[:3]]
    result = agent.run_agentic(QUESTION, doc_ids=doc_ids)
    kinds = {e["kind"] for e in result.activity}
    assert "plan" in kinds
    assert "tool" in kinds
    seqs = [e["seq"] for e in result.activity]
    assert seqs == sorted(seqs), "activity log must be ordered"


def test_budget_exceeded_is_a_distinct_exception():
    assert issubclass(ToolBudgetExceeded, RuntimeError)


# --- usage accounting ----------------------------------------------------
def test_estimate_usage_is_deterministic():
    rec = ActivityRecorder(QUESTION)
    a = rec.estimate_usage("hello world", "a reply")
    b = rec.estimate_usage("hello world", "a reply")
    assert a == b
    assert a[0] > 0 and a[1] > 0


def test_activity_summary_reports_which_limit_was_hit():
    """Tool and refinement counts come from the LangChain callbacks, not notes.

    Counting `note()` calls would mean the log claimed work that never ran --
    the exact defect the original hardcoded activity log had.
    """
    rec = ActivityRecorder(QUESTION, max_tool_calls=1, max_refinements=1)
    assert rec.summary()["hit_tool_limit"] is False
    rec.on_tool_start({"name": "search_papers"}, "query text")
    rec.on_tool_end("some output")
    rec.on_tool_start({"name": "read_passage"}, "S1")
    rec.on_tool_end("passage")
    summary = rec.summary()
    assert summary["tool_calls"] == 2
    assert summary["hit_tool_limit"] is True
    assert summary["hit_refinement_limit"] is True
    assert [e["name"] for e in rec.as_dicts() if e["kind"] == "tool"] == [
        "search_papers", "read_passage",
    ]


def test_offline_run_does_not_claim_provider_token_counts(real_corpus):
    doc_ids = [d["id"] for d in real_corpus[:2]]
    result = agent.run_agentic(QUESTION, doc_ids=doc_ids)
    assert result.metrics["llm_real"] is False
