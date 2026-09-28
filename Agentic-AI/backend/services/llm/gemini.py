"""Google Gemini provider.

Uses the LangChain integration (`langchain_google_genai`) so that provider
swapping, retries and usage metadata are handled consistently with the rest of
the stack. The import is deliberately lazy: the project must import and run its
test-suite with no Google packages and no credentials present.
"""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from services.llm.base import BaseLLM, LLMError, LLMResult, _Timer


def available() -> bool:
    if not os.getenv("GEMINI_API_KEY", "").strip():
        return False
    try:
        import langchain_google_genai  # noqa: F401
    except ImportError:
        return False
    return True


class GeminiLLM(BaseLLM):
    name = "gemini"

    def __init__(self, model: str = "gemini-2.0-flash"):
        self.model = model
        self._chat = None

    def _ensure(self):
        if self._chat is not None:
            return self._chat
        key = os.getenv("GEMINI_API_KEY", "").strip()
        if not key:
            raise LLMError("GEMINI_API_KEY is not set")
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
        except ImportError as exc:
            raise LLMError(
                "langchain-google-genai is not installed. "
                "Run: pip install langchain-google-genai"
            ) from exc
        self._chat = ChatGoogleGenerativeAI(
            model=self.model,
            google_api_key=key,
            temperature=0.0,
            max_output_tokens=2048,
        )
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
                raise LLMError(f"Gemini call failed: {exc}") from exc

        text = getattr(resp, "content", "") or ""
        if isinstance(text, list):  # some versions return content blocks
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
