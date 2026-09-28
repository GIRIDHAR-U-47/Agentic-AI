"""OpenAI provider, also covering any OpenAI-compatible endpoint.

`OPENAI_BASE_URL` is honoured, so the same adapter drives OpenAI itself,
Azure-style gateways, Together, Groq, DeepSeek, or a local Ollama/LM Studio
server. That is what makes the "compare at least two LLMs" requirement
satisfiable with whatever credentials happen to exist, rather than being
hard-wired to two vendors.
"""
from __future__ import annotations

import os
from typing import Any, List, Optional

from services.llm.base import BaseLLM, LLMError, LLMResult, _Timer


def available() -> bool:
    if not os.getenv("OPENAI_API_KEY", "").strip():
        return False
    try:
        import langchain_openai  # noqa: F401
    except ImportError:
        return False
    return True


class OpenAICompatLLM(BaseLLM):
    name = "openai"

    def __init__(self, model: str = "gpt-4o-mini", base_url: Optional[str] = None):
        self.model = model
        self.base_url = base_url or os.getenv("OPENAI_BASE_URL") or None
        self._chat = None

    def _ensure(self):
        if self._chat is not None:
            return self._chat
        key = os.getenv("OPENAI_API_KEY", "").strip()
        if not key:
            raise LLMError("OPENAI_API_KEY is not set")
        try:
            from langchain_openai import ChatOpenAI
        except ImportError as exc:
            raise LLMError(
                "langchain-openai is not installed. Run: pip install langchain-openai"
            ) from exc
        kwargs: dict = {
            "model": self.model,
            "api_key": key,
            "temperature": 0.0,
            "max_tokens": 2048,
        }
        if self.base_url:
            kwargs["base_url"] = self.base_url
        self._chat = ChatOpenAI(**kwargs)
        return self._chat

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: int = 1200,
        temperature: float = 0.0,
        stop: Optional[list] = None,
    ) -> LLMResult:
        chat = self._ensure()
        messages: List[Any] = []
        if system:
            messages.append(("system", system))
        messages.append(("human", prompt))

        with _Timer() as t:
            try:
                resp = chat.invoke(messages, stop=stop)
            except Exception as exc:
                raise LLMError(f"OpenAI-compatible call failed: {exc}") from exc

        text = getattr(resp, "content", "") or ""
        if isinstance(text, list):
            text = "".join(
                b.get("text", "") if isinstance(b, dict) else str(b) for b in text
            )
        usage = getattr(resp, "usage_metadata", None)
        ptok = getattr(usage, "input_tokens", None) if usage else None
        ctok = getattr(usage, "output_tokens", None) if usage else None
        return LLMResult(
            text=text.strip(),
            provider=self.name,
            model=self.model,
            prompt_tokens=ptok,
            completion_tokens=ctok,
            total_tokens=(ptok + ctok) if (ptok is not None and ctok is not None) else None,
            latency_s=t.elapsed,
        )
