import time
from typing import List, Dict, Any
from data.mock_data import MOCK_AGENT_STEPS
from models.schemas import AgentProvenanceStep

class AgentService:
    def __init__(self):
        self.steps: List[Dict[str, Any]] = [dict(s) for s in MOCK_AGENT_STEPS]
        self.is_auto_pilot: bool = False

    def get_steps(self) -> List[AgentProvenanceStep]:
        return [AgentProvenanceStep(**s) for s in self.steps]

    def is_autopilot_mode(self) -> bool:
        return self.is_auto_pilot

    def set_autopilot_mode(self, enabled: bool) -> bool:
        self.is_auto_pilot = enabled
        return self.is_auto_pilot

    def add_instruction(self, prompt: str) -> AgentProvenanceStep:
        step_dict = {
            "id": f"agent-step-{int(time.time() * 1000)}",
            "stepNumber": len(self.steps) + 1,
            "title": "Researcher instruction applied",
            "detail": prompt,
            "duration": "Just now",
            "agentModule": "User Dynamic Prior",
            "status": "done",
            "progress": None
        }
        self.steps.append(step_dict)
        return AgentProvenanceStep(**step_dict)

agent_service = AgentService()
