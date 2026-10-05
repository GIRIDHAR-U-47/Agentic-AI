"""Groq provider for ultra-fast LLM inference.

Groq exposes an OpenAI-compatible endpoint at https://api.groq.com/openai/v1
with high token throughput and low latency.
"""
from __future__ import annotations

import logging
import os
import re
from typing import Any, List, Optional

import config
from services.llm.base import BaseLLM, LLMError, LLMResult, _Timer
from services.llm.context_builder import safe_log_llm_call

logger = logging.getLogger("rlens.llm.groq")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"


def get_groq_key() -> str:
    """Retrieve Groq API key from environment."""
    return os.getenv("GROQ_API_KEY", "").strip()


def available() -> bool:
    if not get_groq_key():
        return False
    try:
        import langchain_openai  # noqa: F401
    except ImportError:
        return False
    return True


class GroqLLM(BaseLLM):
    name = "groq"

    def __init__(
        self,
        model: str = "openai/gpt-oss-120b",
        base_url: Optional[str] = None,
        max_output_tokens: Optional[int] = None,
    ):
        self.model = model or os.getenv("RLENS_GROQ_MODEL", os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"))
        self.base_url = base_url or os.getenv("GROQ_BASE_URL", GROQ_BASE_URL)
        self.max_output_tokens = max_output_tokens or config.NORMAL_CHAT_MAX_OUTPUT_TOKENS
        self._chat = None

    def _ensure(self, max_tokens: Optional[int] = None):
        key = get_groq_key()
        if not key:
            raise LLMError("Groq provider selected but GROQ_API_KEY is not configured.")
        try:
            from langchain_openai import ChatOpenAI
        except ImportError as exc:
            raise LLMError(
                "langchain-openai is not installed. Run: pip install langchain-openai"
            ) from exc

        target_max_tokens = max_tokens or self.max_output_tokens or 1024
        return ChatOpenAI(
            model=self.model,
            api_key=key,
            base_url=self.base_url,
            temperature=0.0,
            max_tokens=target_max_tokens,
            default_headers={
                "User-Agent": "R-Lens/2.5 (Academic Research Assistant)",
            },
        )

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.0,
        stop: Optional[list] = None,
    ) -> LLMResult:
        key = get_groq_key()
        if not key:
            raise LLMError("Groq provider selected but GROQ_API_KEY is not configured.")

        chat = self._ensure(max_tokens=max_tokens)
        messages: List[Any] = []
        if system:
            messages.append(("system", system))
        messages.append(("human", prompt))

        safe_log_llm_call(
            provider="groq",
            model=self.model,
            stats={"input_chars": len(prompt), "message_count": len(messages), "chunk_count": prompt.count("[EVIDENCE ")},
            max_tokens=max_tokens,
        )

        with _Timer() as t:
            try:
                resp = chat.invoke(messages, stop=stop)
            except Exception as exc:
                err_str = str(exc).lower()
                if "429" in err_str or "rate_limit" in err_str:
                    raise LLMError("Groq rate limit reached. Please retry shortly.") from exc
                elif "401" in err_str or "invalid_api_key" in err_str or "unauthorized" in err_str:
                    raise LLMError("Groq API authentication failed. Please check GROQ_API_KEY.") from exc
                else:
                    sanitized = re.sub(r"gsk_[0-9A-Za-z-_]{20,}", "[REDACTED_GROQ_KEY]", str(exc))
                    raise LLMError(f"Groq call failed: {sanitized}") from exc

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
