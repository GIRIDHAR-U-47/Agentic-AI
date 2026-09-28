"""OpenRouter provider: one key, many model families.

OpenRouter exposes OpenAI-compatible chat endpoints plus `openrouter/` model
ids (e.g. `openai/gpt-4o-mini`, `anthropic/claude-3.5-sonnet`). The key lives
exclusively in the backend environment as `OPENROUTER_API_KEY`; nothing about
the credential ever leaves the server or reaches the frontend. Two model slots
(`openrouter` and `openrouter-strong`) are registered in `config`, so the
evaluation harness can compare at least two OpenRouter models whenever the key
is present.

Honesty rule: this provider is never *implicitly* selected for an offline run.
`workflow._resolve_provider` raises when a hosted provider is requested without
its key, and `registry.build_llm` only returns an `OpenRouterLLM` when the key
is actually set -- so an offline result can never carry an `openrouter` label.
"""
from __future__ import annotations

import os
from typing import Optional

from services.llm.base import LLMError
from services.llm.openai_compat import OpenAICompatLLM

#: OpenRouter asks for the app identity on every call; harmless, public metadata.
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def available() -> bool:
    if not os.getenv("OPENROUTER_API_KEY", "").strip():
        return False
    try:
        import langchain_openai  # noqa: F401
    except ImportError:
        return False
    return True


class OpenRouterLLM(OpenAICompatLLM):
    """ChatOpenAI pointed at OpenRouter, tagged with the app identity."""

    name = "openrouter"

    def __init__(self, model: str = "openai/gpt-4o-mini", base_url: Optional[str] = None):
        # Keep `model` exactly as the operator configured it: OpenRouter serves
        # ids like `openai/gpt-4o-mini` verbatim.
        super().__init__(model=model, base_url=base_url or OPENROUTER_BASE_URL)

    def _ensure(self):
        if self._chat is not None:
            return self._chat
        key = os.getenv("OPENROUTER_API_KEY", "").strip()
        if not key:
            raise LLMError("OPENROUTER_API_KEY is not set")
        try:
            from langchain_openai import ChatOpenAI
        except ImportError as exc:
            raise LLMError(
                "langchain-openai is not installed. Run: pip install langchain-openai"
            ) from exc
        self._chat = ChatOpenAI(
            model=self.model,
            api_key=key,
            base_url=self.base_url or OPENROUTER_BASE_URL,
            default_headers={
                "HTTP-Referer": "https://github.com/GIRIDHAR-U-47/Agentic-AI",
                "X-Title": "R-Lens Research Pilot",
            },
            temperature=0.0,
            max_tokens=2048,
        )
        return self._chat