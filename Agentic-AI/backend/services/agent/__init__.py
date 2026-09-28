"""Agentic literature-review engine.

`from services.agent import run, MODES` is the public surface.
"""
from services.agent.callbacks import (
    ActivityEvent,
    ActivityRecorder,
    AgentNeedsUser,
    ToolBudgetExceeded,
)
from services.agent.executor import MODES, RunResult, run, run_agentic, run_basic_rag, run_no_rag
from services.agent.reflection import ReflectionResult, verify

__all__ = [
    "run",
    "MODES",
    "RunResult",
    "run_agentic",
    "run_basic_rag",
    "run_no_rag",
    "verify",
    "ReflectionResult",
    "ActivityEvent",
    "ActivityRecorder",
    "AgentNeedsUser",
    "ToolBudgetExceeded",
]
