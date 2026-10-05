"""LLM provider layer.

`from services.llm import build_llm` is the only import callers need.
"""
from services.llm.base import BaseLLM, LLMError, LLMResult
from services.llm.groq import GroqLLM
from services.llm.offline import ExtractiveLLM
from services.llm.registry import as_chat_model, build_llm, is_real

__all__ = [
    "BaseLLM",
    "LLMError",
    "LLMResult",
    "ExtractiveLLM",
    "GroqLLM",
    "build_llm",
    "as_chat_model",
    "is_real",
]
