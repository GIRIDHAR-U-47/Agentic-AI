"""Google Gemini provider.

Uses the LangChain integration (`langchain_google_genai`) so that provider
swapping, retries and usage metadata are handled consistently with the rest of
the stack. The import is deliberately lazy: the project must import and run its
test-suite with no Google packages and no credentials present.
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

import config
from services.llm.base import BaseLLM, LLMError, LLMResult, _Timer
from services.llm.context_builder import safe_log_llm_call

logger = logging.getLogger("rlens.llm.gemini")


def get_gemini_key() -> str:
    """Retrieve the Gemini API key from environment without exposing it."""
    return os.getenv("GEMINI_API_KEY", "").strip() or os.getenv("GOOGLE_API_KEY", "").strip()


def available() -> bool:
    if not get_gemini_key():
        return False
    try:
        import langchain_google_genai  # noqa: F401
    except ImportError:
        return False
    return True


class GeminiLLM(BaseLLM):
    name = "gemini"

    def __init__(self, model: str = "gemini-3.8-flash", max_output_tokens: Optional[int] = None):
        self.model = model or os.getenv("RLENS_GEMINI_MODEL", os.getenv("GEMINI_MODEL", "gemini-3.8-flash"))
        self.max_output_tokens = max_output_tokens or config.GEMINI_MAX_OUTPUT_TOKENS
        self._chat = None

    def _ensure(self, max_tokens: Optional[int] = None):
        key = get_gemini_key()
        if not key:
            raise LLMError("Gemini provider selected but GEMINI_API_KEY is not configured.")
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
        except ImportError as exc:
            raise LLMError(
                "langchain-google-genai is not installed. "
                "Run: pip install langchain-google-genai"
            ) from exc

        target_max_tokens = max_tokens or self.max_output_tokens or config.GEMINI_MAX_OUTPUT_TOKENS
        return ChatGoogleGenerativeAI(
            model=self.model,
            google_api_key=key,
            temperature=0.0,
            max_output_tokens=target_max_tokens,
        )

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.0,
        stop: Optional[list] = None,
    ) -> LLMResult:
        key = get_gemini_key()
        if not key:
            raise LLMError("Gemini provider selected but GEMINI_API_KEY is not configured.")

        chat = self._ensure(max_tokens=max_tokens)
        messages: List[Any] = []
        if system:
            messages.append(("system", system))
        messages.append(("human", prompt))

        safe_log_llm_call(
            provider="gemini",
            model=self.model,
            stats={"input_chars": len(prompt), "message_count": len(messages), "chunk_count": prompt.count("[EVIDENCE ")},
            max_tokens=max_tokens,
        )

        with _Timer() as t:
            try:
                resp = chat.invoke(messages, stop=stop)
            except Exception as exc:
                err_str = str(exc).lower()
                if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                    raise LLMError("Gemini quota/rate limit reached. Please retry later.") from exc
                elif "context" in err_str and ("length" in err_str or "too large" in err_str or "token" in err_str):
                    raise LLMError("Request context is too large. Reducing retrieved evidence.") from exc
                elif "api_key" in err_str or "auth" in err_str or "permission_denied" in err_str or "unauthenticated" in err_str:
                    raise LLMError("Gemini API authentication failed. Please check GEMINI_API_KEY.") from exc
                elif "timeout" in err_str or "timed out" in err_str:
                    raise LLMError("Gemini request timed out. Please retry.") from exc
                else:
                    # Sanitize error message so no API keys or internal tokens are surfaced
                    sanitized = re_key_filter(str(exc))
                    raise LLMError(f"Gemini call failed: {sanitized}") from exc

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


def re_key_filter(msg: str) -> str:
    """Strip anything that looks like an API key from error strings."""
    import re
    # Strip AIzaSy... or sk-...
    cleaned = re.sub(r"AIza[0-9A-Za-z-_]{35}", "[REDACTED_KEY]", msg)
    cleaned = re.sub(r"sk-[0-9A-Za-z-_]{20,}", "[REDACTED_KEY]", cleaned)
    return cleaned

