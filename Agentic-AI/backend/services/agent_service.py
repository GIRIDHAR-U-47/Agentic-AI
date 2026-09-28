"""Agent provenance, repointed from mock steps to the real activity log.

The original returned six hardcoded `MOCK_AGENT_STEPS` -- strings like
"Retrieved relevant context" and "Synthesized response" that the code never
produced. An agent-provenance panel that shows invented steps is worse than no
panel at all, because it looks like evidence.

This service now returns the actual `ActivityEvent` stream recorded by
`ActivityRecorder` during real runs, newest session first. With no sessions
recorded it returns an empty list; the UI is expected to show "no runs yet"
rather than filler.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import db
from models.schemas import AgentProvenanceStep
from services.agent.callbacks import ActivityEvent

_KIND_TO_MODULE = {
    "plan": "Planner",
    "tool": "Tool Use",
    "llm": "Reasoning",
    "decision": "Reflection",
    "limit": "Guardrail",
    "error": "Error",
}


def _duration(ev: Dict[str, Any]) -> str:
    ms = ev.get("latency_ms")
    if ms is None:
        return "-"
    if ms < 1000:
        return f"{ms} ms"
    return f"{ms / 1000:.1f} s"


class AgentService:
    def __init__(self) -> None:
        self._autopilot = False

    # -- provenance -----------------------------------------------------
    def get_steps(self, session_id: Optional[str] = None) -> List[AgentProvenanceStep]:
        if session_id:
            sessions = [db.get_session(session_id)]
        else:
            sessions = db.list_sessions(limit=10)
        steps: List[AgentProvenanceStep] = []
        number = 0
        for s in sessions:
            if not s:
                continue
            for ev in s.get("activity") or []:
                number += 1
                steps.append(
                    AgentProvenanceStep(
                        id=f"{s['id']}-{ev['seq']}",
                        stepNumber=number,
                        title=ev["name"],
                        detail=ev.get("detail", ""),
                        duration=_duration(ev),
                        agentModule=_KIND_TO_MODULE.get(ev["kind"], ev["kind"]),
                        status=ev.get("status", "done"),
                        progress=100 if ev.get("status") == "done" else None,
                    )
                )
        return steps

    def get_sessions(self, limit: int = 20) -> List[Dict[str, Any]]:
        return db.list_sessions(limit=limit)

    # -- modes ----------------------------------------------------------
    def is_autopilot_mode(self) -> bool:
        return self._autopilot

    def set_autopilot_mode(self, enabled: bool) -> bool:
        """Fully autonomous runs are not supported.

        R-Lens is a human-in-the-loop tool: a review cannot start without an
        approved paper set. The flag is kept for API compatibility and is
        reported honestly as disabled.
        """
        self._autopilot = False
        return False

    def add_instruction(self, prompt: str, session_id: Optional[str] = None) -> Optional[AgentProvenanceStep]:
        """Record a researcher instruction on a session's activity log."""
        if not session_id:
            return None
        session = db.get_session(session_id)
        if not session:
            return None
        activity = list(session.get("activity") or [])
        activity.append(
            ActivityEvent(
                seq=len(activity) + 1,
                kind="decision",
                name="Researcher instruction",
                detail=prompt[:300],
                data={"source": "user"},
            ).to_dict()
        )
        db.update_session(session_id, activity=activity)
        return self.get_steps(session_id)[-1] if self.get_steps(session_id) else None


agent_service = AgentService()
