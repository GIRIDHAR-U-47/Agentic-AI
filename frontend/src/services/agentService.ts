import { AgentProvenanceStep } from '../types';
import { MOCK_AGENT_STEPS } from '../data/mockResearchData';

class AgentService {
  private steps: AgentProvenanceStep[] = [...MOCK_AGENT_STEPS];
  private isAutoPilot: boolean = false;

  getSteps(): AgentProvenanceStep[] {
    return [...this.steps];
  }

  isAutoPilotMode(): boolean {
    return this.isAutoPilot;
  }

  setAutoPilotMode(enabled: boolean) {
    this.isAutoPilot = enabled;
  }

  addInstruction(prompt: string): AgentProvenanceStep {
    const newStep: AgentProvenanceStep = {
      id: `agent-step-${Date.now()}`,
      stepNumber: this.steps.length + 1,
      title: 'Researcher instruction applied',
      detail: prompt,
      duration: 'Just now',
      agentModule: 'User Dynamic Prior',
      status: 'done'
    };
    this.steps.push(newStep);
    return newStep;
  }
}

export const agentService = new AgentService();
