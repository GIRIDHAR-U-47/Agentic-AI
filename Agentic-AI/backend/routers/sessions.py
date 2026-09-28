"""Session + review workflow endpoints.

Route map (the demo path is exactly this order):

    POST   /api/sessions              create a session, get suggested candidates
    POST   /api/sessions/{id}/approval   approve / reject papers
    POST   /api/sessions/{id}/run     run the agent and assemble the review
    GET    /api/sessions/{id}         full resumable state
    POST   /api/sessions/{id}/reply   answer a question the agent asked
    GET    /api/sessions              recent sessions
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import config
import db
from services import workflow
from services.llm.base import LLMError

router = APIRouter(prefix="/api", tags=["Review Workflow"])


class StartSessionIn(BaseModel):
    question: str
    mode: str = "agentic_rag"
    provider: Optional[str] = None
    model: Optional[str] = None
    #: true = search arXiv for a fresh topic (discovery) instead of ranking the
    #: fixed corpus. The returned candidates carry abs_url/pdf_url + metadata.
    discover: bool = False


class Decision(BaseModel):
    doc_id: str
    decision: str
    note: str = ""


class ApprovalIn(BaseModel):
    decisions: List[Decision] = Field(default_factory=list)


class RunIn(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    human_note: str = ""


class ReplyIn(BaseModel):
    reply: str


class FeedbackIn(BaseModel):
    feedback: str
    exclude_doc_ids: List[str] = Field(default_factory=list)


@router.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "version": "2.5.0",
        "llm": config.llm_status(),
        "limits": {
            "max_agent_iterations": config.MAX_AGENT_ITERATIONS,
            "max_tool_calls": config.MAX_TOOL_CALLS,
            "max_query_refinements": config.MAX_QUERY_REFINEMENTS,
            "retrieval_top_k": config.RETRIEVAL_TOP_K,
        },
        "corpus": db.corpus_stats(),
        "modes": list(workflow.VALID_MODES),
    }


@router.post("/sessions")
def create_session(payload: StartSessionIn) -> Dict[str, Any]:
    try:
        return workflow.start_session(
            payload.question, payload.mode, payload.provider, payload.model,
            discover=payload.discover,
        )
    except workflow.WorkflowError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/sessions")
def list_sessions(limit: int = 50) -> Dict[str, Any]:
    return {"sessions": db.list_sessions(limit=limit)}


@router.get("/sessions/{session_id}")
def get_session(session_id: str) -> Dict[str, Any]:
    try:
        return workflow.get_session_view(session_id)
    except workflow.WorkflowError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str) -> Dict[str, str]:
    if not db.delete_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "session_id": session_id}


@router.post("/sessions/{session_id}/approval")
def set_approval(session_id: str, payload: ApprovalIn) -> Dict[str, Any]:
    try:
        return workflow.set_approvals(
            session_id, [d.model_dump() for d in payload.decisions]
        )
    except workflow.WorkflowError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/sessions/{session_id}/run")
def run(session_id: str, payload: RunIn) -> Dict[str, Any]:
    try:
        return workflow.run_review(
            session_id, provider=payload.provider, model=payload.model,
            human_note=payload.human_note,
        )
    except workflow.WorkflowError as exc:
        code = 404 if "Unknown session" in str(exc) else 400
        raise HTTPException(status_code=code, detail=str(exc))
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/sessions/{session_id}/reply")
def reply(session_id: str, payload: ReplyIn) -> Dict[str, Any]:
    try:
        return workflow.answer_user(session_id, payload.reply)
    except workflow.WorkflowError as exc:
        code = 404 if "Unknown session" in str(exc) else 400
        raise HTTPException(status_code=code, detail=str(exc))


@router.post("/sessions/{session_id}/feedback")
def feedback(session_id: str, payload: FeedbackIn) -> Dict[str, Any]:
    """Researcher feedback on a completed review -> revised draft.

    The earlier draft and this feedback are saved on the session; excluded
    papers are dropped from the revised retrieval scope only (approvals are
    untouched so the researcher can see what changed).
    """
    try:
        return workflow.revise_review(
            session_id,
            payload.feedback,
            exclude_doc_ids=payload.exclude_doc_ids,
        )
    except workflow.WorkflowError as exc:
        code = 404 if "Unknown session" in str(exc) else 400
        raise HTTPException(status_code=code, detail=str(exc))
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/sessions/{session_id}/markdown")
def review_markdown(session_id: str) -> Dict[str, str]:
    from services import review_service

    try:
        view = workflow.get_session_view(session_id)
    except workflow.WorkflowError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    if not view.get("review"):
        raise HTTPException(status_code=409, detail="This session has no review yet")
    return {"markdown": review_service.render_markdown(view["review"])}
