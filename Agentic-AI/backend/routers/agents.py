"""Agent provenance endpoints.

The original returned six hardcoded `MOCK_AGENT_STEPS`. These now return the real
`ActivityEvent` stream, optionally scoped to a session.
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from services.agent_service import agent_service

router = APIRouter(prefix="/api/agents", tags=["Agents"])


class InstructionIn(BaseModel):
    prompt: str
    session_id: Optional[str] = None


class AutoPilotIn(BaseModel):
    enabled: bool


@router.get("/steps")
def get_provenance_steps(
    session_id: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    return [s.model_dump() for s in agent_service.get_steps(session_id)]


@router.get("/sessions")
def list_agent_sessions(limit: int = Query(20, ge=1, le=200)) -> Dict[str, Any]:
    return {"sessions": agent_service.get_sessions(limit)}


@router.post("/instruction")
def submit_instruction(payload: InstructionIn) -> Dict[str, Any]:
    step = agent_service.add_instruction(payload.prompt, payload.session_id)
    if step is None:
        return {
            "recorded": False,
            "reason": "A session_id is required; instructions attach to a specific review.",
        }
    return {"recorded": True, "step": step.model_dump()}


@router.get("/autopilot")
def get_autopilot_status() -> Dict[str, Any]:
    """Always false: R-Lens is human-in-the-loop by design."""
    return {"autopilot": agent_service.is_autopilot_mode()}


@router.post("/autopilot")
def set_autopilot_status(payload: AutoPilotIn) -> Dict[str, Any]:
    new_state = agent_service.set_autopilot_mode(payload.enabled)
    return {
        "autopilot": new_state,
        "note": (
            "Autonomous mode is not supported. A review cannot begin without a "
            "human-approved paper set, which is the core safety property of "
            "this tool."
        ),
    }
