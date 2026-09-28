"""Provider-agnostic LLM contract.

Every provider returns the same `LLMResult`, so the agent, the reflection
stage, the activity log and the evaluator never need to know which backend is
in play. Token counts and latency are captured on every call because Phase 3
requires reporting cost and latency honestly -- including when a provider does
not report usage, in which case the fields are `None` rather than zero.
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


class LLMError(RuntimeError):
    """Raised when a provider call fails in a way the caller must handle."""


@dataclass
class LLMResult:
    text: str
    provider: str
    model: str
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    latency_s: float = 0.0
    raw: Dict[str, Any] = field(default_factory=dict)

    @property
    def usage_known(self) -> bool:
        return self.total_tokens is not None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "usage_known": self.usage_known,
            "latency_s": round(self.latency_s, 4),
        }


class BaseLLM(ABC):
    """One-shot text generation. Chat/tool-calling layers build on this."""

    name: str = "base"
    model: str = "base"
    #: True when the provider is deterministic and works with no credentials.
    offline: bool = False

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: int = 1200,
        temperature: float = 0.0,
        stop: Optional[list] = None,
    ) -> LLMResult:
        raise NotImplementedError

    def health(self) -> Dict[str, Any]:
        return {"provider": self.name, "model": self.model, "offline": self.offline}


class _Timer:
    def __enter__(self):
        self.t0 = time.perf_counter()
        return self

    def __exit__(self, *exc):
        self.elapsed = time.perf_counter() - self.t0
        return False
