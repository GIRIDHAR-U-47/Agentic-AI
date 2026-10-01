"""Provider factory and the LangChain adapter.

`build_llm()` returns a `BaseLLM` for any configured provider, falling back to
the deterministic offline provider rather than failing. `ChatModelAdapter`
wraps a `BaseLLM` as a LangChain `BaseChatModel` so the same provider object can
drive `AgentExecutor` (which speaks ReAct text) and the standalone reflection
and synthesis stages.
"""
from __future__ import annotations

import os
from typing import Any, List, Optional

import config
from services.llm.base import BaseLLM, LLMError, LLMResult
from services.llm.offline import ExtractiveLLM


def build_llm(
    provider: Optional[str] = None, model: Optional[str] = None
) -> BaseLLM:
    """Instantiate a provider. Never raises for a missing key -- falls back."""
    name = (provider or config.default_provider().name).strip().lower()
    spec = config.get_provider(name)

    if name == "offline" or spec is None or not spec.key_present():
        if name not in ("offline",) and spec is not None and not spec.key_present():
            # Explicitly requested but unavailable: report via health(), fall
            # back so the caller still gets a working (grounded) system.
            pass
        return ExtractiveLLM(model=model or "extractive-v1")

    if name in ("openrouter", "openrouter-strong"):
        from services.llm import openrouter

        return openrouter.OpenRouterLLM(model=model or spec.model, base_url=spec.base_url)

    if name == "gemini":
        from services.llm import gemini

        return gemini.GeminiLLM(model=model or (spec.model if spec else "gemini-2.0-flash"))

    return ExtractiveLLM()


def is_real(llm: BaseLLM) -> bool:
    return not getattr(llm, "offline", False)


# --------------------------------------------------------------------------
# LangChain adapter
# --------------------------------------------------------------------------
def _adapter_class():
    from langchain_core.language_models.chat_models import BaseChatModel

    class ChatModelAdapter(BaseChatModel):
        """Adapts a `BaseLLM` to LangChain's chat interface.

        LangChain calls `_generate` with a flat message list; this flattens it
        into a single prompt (prefixing any system message) and delegates. Tool
        results arrive inline in the prompt because the ReAct loop embeds
        observations in the scratchpad.
        """

        llm: Any
        role: str = "agent"
        max_tokens: int = 1400

        @property
        def _llm_type(self) -> str:
            return f"rlens-{getattr(self.llm, 'name', 'base')}"

        @property
        def _identifying_params(self) -> dict:
            return {"model": getattr(self.llm, "model", "?"), "role": self.role}

        def _generate(self, messages, stop=None, run_manager=None, **kwargs) -> Any:
            from langchain_core.messages import AIMessage
            from langchain_core.outputs import ChatGeneration, ChatResult

            system = None
            parts: List[str] = []
            for m in messages:
                c = m.content if hasattr(m, "content") else str(m)
                c = c if isinstance(c, str) else str(c)
                if getattr(m, "type", None) == "system":
                    system = c
                else:
                    parts.append(c)
            prompt = "\n\n".join(p for p in parts if p)
            res: LLMResult = self.llm.generate(
                prompt, system=system, max_tokens=self.max_tokens, stop=stop
            )
            if run_manager is not None:
                try:
                    run_manager.on_llm_new_token(res.text)
                except Exception:
                    pass
            msg = AIMessage(content=res.text)
            if res.usage_known:
                # Surface usage on the message *and* in llm_output: LangChain
                # normalises the former into `usage_metadata`, and the latter is
                # what `ActivityRecorder.on_llm_end` reads. Without this the
                # activity log would report unknown token usage for every call.
                msg.usage_metadata = {
                    "input_tokens": res.prompt_tokens,
                    "output_tokens": res.completion_tokens,
                    "total_tokens": res.total_tokens,
                }
            return ChatResult(
                generations=[ChatGeneration(message=msg)],
                llm_output={
                    "model_name": res.model,
                    "token_usage": (
                        {
                            "prompt_tokens": res.prompt_tokens,
                            "completion_tokens": res.completion_tokens,
                            "total_tokens": res.total_tokens,
                        }
                        if res.usage_known
                        else None
                    ),
                },
            )

    return ChatModelAdapter


_adapter_cache: dict = {}


def as_chat_model(llm: BaseLLM, role: str = "agent") -> Any:
    """Wrap (and memoise) a BaseLLM as a LangChain chat model."""
    key = (id(llm), role)
    if key not in _adapter_cache:
        _adapter_cache[key] = _adapter_class()(llm=llm, role=role)
    return _adapter_cache[key]