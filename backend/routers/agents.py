from typing import List, Dict
from fastapi import APIRouter
from models.schemas import AgentProvenanceStep, AgentInstructionRequest, AutoPilotRequest
from services.agent_service import agent_service

router = APIRouter(prefix="/api/agents", tags=["Agents"])

@router.get("/steps", response_model=List[AgentProvenanceStep])
def get_provenance_steps():
    return agent_service.get_steps()

@router.post("/instruction", response_model=AgentProvenanceStep)
def submit_instruction(payload: AgentInstructionRequest):
    return agent_service.add_instruction(payload.prompt)

@router.get("/autopilot", response_model=Dict[str, bool])
def get_autopilot_status():
    return {"autopilot": agent_service.is_autopilot_mode()}

@router.post("/autopilot", response_model=Dict[str, bool])
def set_autopilot_status(payload: AutoPilotRequest):
    new_state = agent_service.set_autopilot_mode(payload.enabled)
    return {"autopilot": new_state}
