"""The end-to-end review workflow.

This is the layer the API and the UI actually call. It owns the state machine:

    created -> planning -> awaiting_approval -> (awaiting_user) -> complete

and it is the only place that transitions a session, so a review can always be
resumed: the session row, its activity log, the approval decisions and the
citations all live in SQLite, and re-entering a session replays that state
rather than re-running the agent.

The human-approval gate is enforced here as well as in the tools. `run_agentic`
already refuses to retrieve from unapproved papers; this layer additionally
refuses to *start* a review before the researcher has chosen a set, so the
"user approves papers" step cannot be bypassed by calling the run endpoint
directly.

Two honest-answer guarantees live here too:

* A hosted provider that is explicitly requested but has no key raises
  `WorkflowError` instead of silently running offline while still being
  labelled with the hosted provider's name.
* Fresh-topic ("discovery") sessions materialise each approved arXiv paper
  into the corpus *before* the decision is recorded, so a citation can always
  point at a real stored paper and a real passage.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import db
from services import agent, discovery, review_service
from services.retrieval import rank_papers

VALID_MODES = set(agent.MODES)


class WorkflowError(RuntimeError):
    """A workflow step cannot proceed. Surfaced to the client as 400."""


# --------------------------------------------------------------------------
# Candidate selection (the step before approval)
# --------------------------------------------------------------------------
def suggest_candidates(
    question: str, top_k: int = 8, include_all: bool = False
) -> List[Dict[str, Any]]:
    """Rank the corpus for `question` so the user has something to approve.

    With an empty corpus this returns `[]`; the caller is expected to have
    ingested papers first. The response is deliberately *candidates*, not
    results: nothing is retrieved from a paper until it is approved.
    """
    docs = db.list_documents()
    if not docs:
        return []
    pool = docs if include_all else rank_papers(question, docs, top_k=len(docs))
    out: List[Dict[str, Any]] = []
    for d in pool:
        if not include_all and d.get("_score", 0) <= 0:
            continue
        out.append(
            {
                "doc_id": d["id"],
                "title": d.get("title") or d.get("filename"),
                "authors": d.get("authors"),
                "year": d.get("year"),
                "venue": d.get("venue"),
                "arxiv_id": d.get("arxiv_id"),
                "doi": d.get("doi"),
                "abstract": (d.get("abstract") or "")[:600],
                "page_count": d.get("page_count"),
                "source": d.get("source"),
                "relevance": round(float(d.get("_score", 0.0)), 4),
            }
        )
        if len(out) >= top_k:
            break
    return out


# --------------------------------------------------------------------------
# Session lifecycle
# --------------------------------------------------------------------------
def _resolve_provider(
    provider: Optional[str] = None, model: Optional[str] = None
):
    """Pick the provider for a session/run, refusing to mislabel offline output.

    A hosted provider that was explicitly requested but lacks its API key raises
    `WorkflowError`: recording the session as e.g. `openrouter` while actually
    running the deterministic extractive engine would label an offline result as
    a hosted result, which the pilot treats as a correctness bug.
    """
    import config

    spec = config.get_provider(provider) if provider else None
    if provider and (spec is None or not spec.key_present()):
        if spec is None:
            raise WorkflowError(f"Unknown provider {provider!r}.")
        raise WorkflowError(
            f"Provider {provider!r} needs {spec.api_key_env} to be set in the "
            "environment. The offline extractive provider is available without "
            "credentials and is always clearly labelled as offline."
        )
    if spec is None:
        spec = config.default_provider()
    return spec


def _enrich_citations(citations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Attach stored document metadata (source URL, full-text availability,
    canonical arXiv id/title/authors) to every citation so the review sources
    and comparison table can link out to the real paper and show whether the
    claim was drawn from full text or only an abstract.

    Citation rows produced by the reflection stage carry the fields the agent
    saw during retrieval; this step merges the authoritative row from
    `documents`, which also covers abstract-only discovery papers.
    """
    docs = {d["id"]: d for d in db.list_documents()}
    out: List[Dict[str, Any]] = []
    for c in citations:
        c = dict(c)
        doc = docs.get(c.get("doc_id") or "")
        if doc:
            c.setdefault("title", doc.get("title") or "")
            c.setdefault("authors", doc.get("authors") or "")
            c.setdefault("year", doc.get("year"))
            c.setdefault("venue", doc.get("venue") or "")
            c.setdefault("doi", doc.get("doi") or "")
            c.setdefault("arxiv_id", doc.get("arxiv_id"))
            c["source_url"] = doc.get("source_url") or ""
            c["full_text_available"] = int(doc.get("full_text_available", 1))
        else:
            c["source_url"] = c.get("source_url") or ""
            c["full_text_available"] = int(c.get("full_text_available", 1))
        out.append(c)
    return out


def start_session(
    question: str,
    mode: str = "agentic_rag",
    provider: Optional[str] = None,
    model: Optional[str] = None,
    discover: bool = False,
) -> Dict[str, Any]:
    question = (question or "").strip()
    if len(question) < 8:
        raise WorkflowError("The research question is too short to plan a review.")
    if mode not in VALID_MODES:
        raise WorkflowError(
            f"Unknown mode {mode!r}. Expected one of {sorted(VALID_MODES)}."
        )

    spec = _resolve_provider(provider, model)

    sid = db.create_session(question, mode=mode, provider=spec.name, model=spec.model)

    candidates: List[Dict[str, Any]] = []
    discovery_info = {"refined": False, "search_events": []}
    if discover:
        found = discovery.discover(question)
        candidates = found.get("candidates", [])
        discovery_info = {
            "refined": bool(found.get("refined")),
            "search_events": found.get("search_events", []),
            "skipped_known": found.get("skipped_known", 0),
            "cached": bool(found.get("cached")),
        }
        db.update_session(sid, discovery=candidates, discovery_meta=discovery_info)
    else:
        candidates = suggest_candidates(question)

    return {
        "session_id": sid,
        "question": question,
        "mode": mode,
        "provider": spec.name,
        "model": spec.model,
        "state": "created",
        "candidates": candidates,
        "discovery": discovery_info,
        "activity": [],
    }


def set_approvals(
    session_id: str, decisions: List[Dict[str, str]]
) -> Dict[str, Any]:
    """Record the researcher's approve/reject choices.

    Passing an empty list clears the selection, which is how the UI's "start
    over" works. The whole set is replaced atomically so a partially-saved
    selection can never be mistaken for a complete one.
    """
    session = db.get_session(session_id)
    if not session:
        raise WorkflowError(f"Unknown session {session_id!r}.")
    valid = {d["id"] for d in db.list_documents()}

    # Fresh-topic sessions: approving an arXiv candidate materialises it first
    # (full-text PDF, or an explicitly-labelled abstract-only record when the
    # PDF cannot be fetched), so every approval points at a real stored paper.
    discovery_candidates = {c.get("doc_id"): c for c in (session.get("discovery") or []) if c.get("doc_id")}
    # A rejected discovery candidate is never materialised, so it is not in
    # `valid` yet -- but the rejection decision must still be recorded, or the
    # researcher's filter would be silently dropped (the agent would later see
    # it as an un-decided source). Only *rejected* ids get whitelisted here:
    # an approved candidate must still pass the `not in valid` check below so
    # it is materialised via ingest_candidate first.
    for d in decisions:
        doc_id = (d.get("doc_id") or "").strip()
        if doc_id in discovery_candidates and d.get("decision") == "rejected":
            valid.add(doc_id)
    ingest_log: List[Dict[str, Any]] = []
    for d in decisions:
        doc_id = (d.get("doc_id") or "").strip()
        if not doc_id:
            continue
        if doc_id not in valid and doc_id in discovery_candidates and d.get("decision") == "approved":
            rec = discovery.ingest_candidate(discovery_candidates[doc_id])
            valid.add(doc_id)
            ingest_log.append(
                {
                    "doc_id": doc_id,
                    "full_text_available": int(rec.get("full_text_available", 1)),
                    "abstract_only": bool(rec.get("abstract_only", False)),
                    "duplicate": bool(rec.get("duplicate", False)),
                }
            )

    db.clear_actor_approvals(session_id, "user")
    for d in decisions:
        doc_id = (d.get("doc_id") or "").strip()
        decision = (d.get("decision") or "").strip().lower()
        if not doc_id:
            continue
        if doc_id not in valid:
            raise WorkflowError(f"Unknown document {doc_id!r}.")
        if decision not in ("approved", "rejected"):
            raise WorkflowError(f"decision must be 'approved' or 'rejected', got {decision!r}")
        db.set_approval(session_id, doc_id, decision, note=d.get("note", ""))
    approved = db.approved_doc_ids(session_id)
    db.update_session(
        session_id,
        state="awaiting_approval" if not approved else "created",
    )
    return {
        "session_id": session_id,
        "approved": approved,
        "rejected": db.rejected_doc_ids(session_id),
        "decisions": db.get_approvals(session_id),
        "ingested": ingest_log,
    }


def run_review(
    session_id: str,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    human_note: str = "",
    exclude_doc_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Execute the configured mode for a session with an approved paper set.

    `exclude_doc_ids` lets a revision drop specific papers from the retrieval
    scope without touching the stored approvals (the researcher's selection
    stays intact so they can see what changed).
    """
    session = db.get_session(session_id)
    if not session:
        raise WorkflowError(f"Unknown session {session_id!r}.")
    approved = db.approved_doc_ids(session_id)
    if not approved:
        raise WorkflowError(
            "No papers have been approved for this session. Approve at least one "
            "paper before running a review."
        )
    rejected = set(db.rejected_doc_ids(session_id))
    excluded = set(exclude_doc_ids or [])
    scope = [d for d in approved if d not in rejected and d not in excluded]
    if not scope:
        raise WorkflowError("Every approved paper is excluded or rejected for this run.")

    mode = session["mode"]
    # Honest provider resolution: an explicitly requested hosted provider with
    # no key raises instead of silently running offline under its label.
    prov = provider or session["provider"]
    mdl = model or session["model"] or None
    _resolve_provider(prov, mdl)

    db.update_session(session_id, state="planning")
    result = agent.run(
        mode,
        session["question"],
        doc_ids=scope,
        session_id=session_id,
        provider=prov,
        model=mdl,
    )

    result.citations = _enrich_citations(result.citations)
    review = review_service.assemble_review(
        answer=result.answer,
        citations=result.citations,
        papers=result.papers,
        question=session["question"],
        verified=result.verified,
        support_rate=result.support_rate,
        reflection_notes=[
            e["detail"] for e in result.activity if e["kind"] in ("decision", "limit")
        ][-4:],
    )
    db.update_session(
        session_id,
        review=review,
        state=result.state,
        activity=result.activity,
        metrics=result.metrics,
    )
    return {
        "session_id": session_id,
        "state": result.state,
        "mode": result.mode,
        "provider": result.provider,
        "model": result.model,
        "answer": result.answer,
        "review": review,
        "activity": result.activity,
        "citations": result.citations,
        "papers": result.papers,
        "verified": result.verified,
        "support_rate": result.support_rate,
        "insufficient_evidence": result.insufficient_evidence,
        "metrics": result.metrics,
        "latency_s": round(result.latency_s, 4),
        "pending": result.pending,
    }


def revise_review(
    session_id: str,
    feedback: str,
    exclude_doc_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Revise a completed review from researcher feedback.

    The prior review and its activity are preserved in `session.revisions`
    (SQLite, so it survives restarts), the feedback is folded into the
    research question for the revised run, the requested papers are excluded
    from the retrieval scope, and the agent re-searches + re-writes. Sessions
    are re-runnable forever: draft 0 is never destroyed.
    """
    session = db.get_session(session_id)
    if not session:
        raise WorkflowError(f"Unknown session {session_id!r}.")
    if session["state"] != "complete":
        raise WorkflowError(
            f"Session is in state {session['state']!r}; only a completed review "
            "can be revised."
        )
    feedback = (feedback or "").strip()
    if not feedback:
        raise WorkflowError("Feedback is empty.")
    if not db.approved_doc_ids(session_id):
        raise WorkflowError("No papers have been approved for this session.")

    prior_review = session.get("review")
    prior_activity = session.get("activity") or []
    effective_question = (
        f"{session['question']}\n\nResearcher feedback: {feedback}".strip()
    )

    # Run the revision with the modified question and exclusions.
    db.update_session(
        session_id,
        state="created",
        question=session["question"],  # keep the stored question canonical
    )
    out = _run_with_question(
        session_id,
        effective_question,
        exclude_doc_ids=exclude_doc_ids,
    )
    if out.get("state") == "awaiting_user":
        # The agent asked the human something during the revision; keep the
        # prior draft available and stash the revised question + exclusions so
        # a later /reply resumes *this* revision, not the original question.
        _record_revision(
            session_id,
            feedback=feedback,
            exclude_doc_ids=list(exclude_doc_ids or []),
            prior_review=prior_review,
            prior_activity=prior_activity,
            effective_question=effective_question,
            completed=False,
        )
        pending = dict(session.get("pending") or {})
        pending["_revision"] = {
            "feedback": feedback,
            "exclude_doc_ids": list(exclude_doc_ids or []),
            "effective_question": effective_question,
        }
        db.update_session(session_id, pending=pending)
        return out

    _record_revision(
        session_id,
        feedback=feedback,
        exclude_doc_ids=list(exclude_doc_ids or []),
        prior_review=prior_review,
        prior_activity=prior_activity,
        effective_question=effective_question,
        completed=True,
        revised_review=out.get("review"),
        revised_answer=out.get("answer"),
        revised_activity=out.get("activity"),
    )
    out["revision"] = True
    return out


def _run_with_question(
    session_id: str,
    question: str,
    exclude_doc_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Run the session's agent over a possibly-modified question, persisting
    the review, activity and metrics exactly like `run_review`."""
    session = db.get_session(session_id)
    approved = db.approved_doc_ids(session_id)
    rejected = set(db.rejected_doc_ids(session_id))
    excluded = set(exclude_doc_ids or [])
    scope = [d for d in approved if d not in rejected and d not in excluded]
    if not scope:
        raise WorkflowError("Every approved paper is excluded or rejected for this run.")

    prov = session["provider"]
    mdl = session["model"] or None
    _resolve_provider(prov, mdl)

    db.update_session(session_id, state="planning")
    result = agent.run(
        session["mode"],
        question,
        doc_ids=scope,
        session_id=session_id,
        provider=prov,
        model=mdl,
    )
    result.citations = _enrich_citations(result.citations)
    review = review_service.assemble_review(
        answer=result.answer,
        citations=result.citations,
        papers=result.papers,
        question=question,
        verified=result.verified,
        support_rate=result.support_rate,
        reflection_notes=[
            e["detail"] for e in result.activity if e["kind"] in ("decision", "limit")
        ][-4:],
    )
    db.update_session(
        session_id,
        review=review,
        state=result.state,
        activity=result.activity,
        metrics=result.metrics,
    )
    return {
        "session_id": session_id,
        "state": result.state,
        "mode": result.mode,
        "provider": result.provider,
        "model": result.model,
        "answer": result.answer,
        "review": review,
        "activity": result.activity,
        "citations": result.citations,
        "papers": result.papers,
        "verified": result.verified,
        "support_rate": result.support_rate,
        "insufficient_evidence": result.insufficient_evidence,
        "metrics": result.metrics,
        "latency_s": round(result.latency_s, 4),
        "pending": result.pending,
    }


def _record_revision(
    session_id: str,
    feedback: str,
    exclude_doc_ids: List[str],
    prior_review: Any,
    prior_activity: Any,
    effective_question: str,
    completed: bool,
    revised_review: Any = None,
    revised_answer: str = "",
    revised_activity: Any = None,
) -> None:
    session = db.get_session(session_id)
    revisions = list(session.get("revisions") or [])
    revisions.append(
        {
            "revision": len(revisions) + 1,
            "feedback": feedback,
            "exclude_doc_ids": exclude_doc_ids,
            "effective_question": effective_question,
            "prior_review": prior_review,
            "prior_activity": prior_activity,
            "completed": completed,
            "review": revised_review,
            "answer": revised_answer,
            "activity": revised_activity,
            "created_at": db.now(),
        }
    )
    db.update_session(session_id, revisions=revisions)


def answer_user(
    session_id: str, reply: str, provider: Optional[str] = None
) -> Dict[str, Any]:
    """Resume a session that paused to ask the human something.

    The reply is folded into the question rather than replacing it, so the agent
    keeps the original research intent plus the clarification. That is also why
    the activity log keeps the original question visible.
    """
    session = db.get_session(session_id)
    if not session:
        raise WorkflowError(f"Unknown session {session_id!r}.")
    if session["state"] != "awaiting_user":
        raise WorkflowError(
            f"Session is in state {session['state']!r}, so it is not waiting for input."
        )
    reply = (reply or "").strip()
    if not reply:
        raise WorkflowError("The reply is empty.")

    original = session["question"]
    pending = session.get("pending") or {}

    # A revision that paused keeps its own question + exclusions in pending so
    # the clarification continues the revision instead of restarting draft 1.
    revision = pending.get("_revision") if isinstance(pending, dict) else None
    if revision:
        eff_question = revision.get("effective_question") or original
        combined = f"{eff_question}\n\nResearcher clarification: {reply}"
        db.update_session(
            session_id, question=combined, pending=None, state="created"
        )
        out = _run_with_question(
            session_id, combined, exclude_doc_ids=revision.get("exclude_doc_ids") or []
        )
        if out.get("state") == "awaiting_user":
            # Agent paused again -- preserve revision context for next answer_user call
            pending = dict(session.get("pending") or {})
            pending["_revision"] = revision
            db.update_session(session_id, pending=pending)
        else:
            _finalize_revision(session_id, combined, out)
        out["revision"] = True
        out["resumed_from"] = pending.get("question")
        return out

    combined = f"{original}\n\nResearcher clarification: {reply}"
    db.update_session(session_id, question=combined, pending=None, state="created")
    out = run_review(session_id, provider=provider)
    out["resumed_from"] = pending.get("question")
    return out


def _finalize_revision(
    session_id: str, effective_question: str, out: Dict[str, Any]
) -> None:
    """Mark the most recent (incomplete) revision as completed with its output."""
    session = db.get_session(session_id)
    revisions = list(session.get("revisions") or [])
    if not revisions:
        return
    last = dict(revisions[-1])
    last.update(
        {
            "completed": True,
            "effective_question": effective_question,
            "review": out.get("review"),
            "answer": out.get("answer"),
            "activity": out.get("activity"),
        }
    )
    revisions[-1] = last
    db.update_session(session_id, revisions=revisions)


def get_session_view(session_id: str) -> Dict[str, Any]:
    """Everything the UI needs to render a resumable session."""
    session = db.get_session(session_id)
    if not session:
        raise WorkflowError(f"Unknown session {session_id!r}.")
    decisions = db.get_approvals(session_id)
    candidates = (session.get("discovery") or []) if session.get("discovery") else []
    return {
        "session_id": session["id"],
        "question": session["question"],
        "title": session["title"],
        "mode": session["mode"],
        "provider": session["provider"],
        "model": session["model"],
        "state": session["state"],
        "activity": session["activity"],
        "review": session["review"],
        "metrics": session["metrics"],
        "pending": session["pending"],
        "error": session["error"],
        "revisions": session.get("revisions") or [],
        "approved": [d["doc_id"] for d in decisions if d["decision"] == "approved"],
        "rejected": [d["doc_id"] for d in decisions if d["decision"] == "rejected"],
        "decisions": decisions,
        "citations": db.get_citations(session_id),
        "candidates": candidates or None,
        # arXiv-discovery provenance (refined?, per-pass search events, dedupe):
        # None for corpus-ranked sessions, so the UI can hide the strip.
        "discovery": session.get("discovery_meta") or None,
        "created_at": session["created_at"],
        "updated_at": session["updated_at"],
        "can_run": bool([d for d in decisions if d["decision"] == "approved"]),
        "can_resume": session["state"] == "awaiting_user",
        "can_revise": session["state"] == "complete",
    }
