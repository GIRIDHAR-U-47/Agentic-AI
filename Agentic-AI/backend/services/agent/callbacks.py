"""Structured activity log captured from the LangChain callback interface.

`AgentExecutor`'s control flow is opaque, which is precisely why the activity
log is a *callback* rather than something the agent loop writes itself. Every
LLM call and every tool call is intercepted here and turned into a typed event
with its own latency, so the reasoning loop is visible to the user and to the
evaluator.

This is also where the hard limits are enforced. `AgentExecutor.max_iterations`
stops the loop, but a loop can also be bounded by the tool layer refusing to
exceed a budget -- belt and braces, so a misconfigured executor cannot produce
an unbounded run.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from langchain_core.callbacks.base import BaseCallbackHandler

from config import LIMITS


@dataclass
class ActivityEvent:
    """One observable step in the agent's reasoning."""

    seq: int
    kind: str                      # 'plan' | 'tool' | 'llm' | 'decision' | 'limit' | 'error'
    name: str
    detail: str = ""
    status: str = "done"           # 'done' | 'running' | 'blocked' | 'failed'
    data: Dict[str, Any] = field(default_factory=dict)
    latency_ms: Optional[int] = None
    at: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "seq": self.seq,
            "kind": self.kind,
            "name": self.name,
            "detail": self.detail,
            "status": self.status,
            "data": self.data,
            "latency_ms": self.latency_ms,
            "at": self.at,
        }


class ToolBudgetExceeded(RuntimeError):
    """Raised by the tool layer when the per-run tool budget is spent."""


class AgentNeedsUser(RuntimeError):
    """Raised when the agent decides it must ask the human something.

    Carries the structured question so the session can be persisted in
    `awaiting_user` state and resumed after an answer arrives.
    """

    def __init__(self, question: str, options: Optional[List[str]] = None,
                 reason: str = ""):
        super().__init__(question)
        self.question = question
        self.options = options or []
        self.reason = reason

    def to_dict(self) -> Dict[str, Any]:
        return {
            "question": self.question,
            "options": self.options,
            "reason": self.reason,
        }


class ActivityRecorder(BaseCallbackHandler):
    """Collects the agent's observable behaviour into `ActivityEvent`s."""

    def __init__(
        self,
        question: str = "",
        max_tool_calls: Optional[int] = None,
        max_refinements: Optional[int] = None,
    ):
        self.question = question
        self.events: List[ActivityEvent] = []
        self.max_tool_calls = max_tool_calls if max_tool_calls is not None else LIMITS.max_tool_calls
        self.max_refinements = (
            max_refinements if max_refinements is not None else LIMITS.max_query_refinements
        )
        self.tool_calls: List[Dict[str, Any]] = []
        self.searches: List[Dict[str, Any]] = []
        self.prompt_tokens = 0
        self.completion_tokens = 0
        self.usage_known = True
        self._open: Dict[str, float] = {}

    # -- helpers --------------------------------------------------------
    def _add(self, event: ActivityEvent) -> ActivityEvent:
        self.events.append(event)
        return event

    def note(self, kind: str, name: str, detail: str = "", **data: Any) -> ActivityEvent:
        """Manually record a non-callback step (plan, decision, limit)."""
        return self._add(
            ActivityEvent(seq=len(self.events) + 1, kind=kind, name=name, detail=detail, data=data)
        )

    @property
    def tool_call_count(self) -> int:
        return len(self.tool_calls)

    @property
    def refinement_count(self) -> int:
        return len(self.searches)

    def budget_left(self) -> int:
        return max(0, self.max_tool_calls - self.tool_call_count)

    def estimate_usage(self, prompt: str, output: str) -> tuple:
        """Whitespace-token count for providers that report no usage.

        Deliberately naive and clearly labelled as an estimate. The alternative
        -- reporting zero -- would make offline runs look artificially cheap in
        the evaluation, which is exactly the kind of dishonest number Phase 3 is
        meant to rule out.
        """
        return len((prompt or "").split()), len((output or "").split())

    def as_dicts(self) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in self.events]

    def summary(self) -> Dict[str, Any]:
        return {
            "events": len(self.events),
            "tool_calls": self.tool_call_count,
            "searches": self.refinement_count,
            "prompt_tokens": self.prompt_tokens or None,
            "completion_tokens": self.completion_tokens or None,
            "total_tokens": (
                self.prompt_tokens + self.completion_tokens
                if self.usage_known and (self.prompt_tokens or self.completion_tokens)
                else None
            ),
            "usage_known": self.usage_known,
            "hit_tool_limit": self.tool_call_count >= self.max_tool_calls,
            "hit_refinement_limit": self.refinement_count >= self.max_refinements,
        }

    # -- LangChain callbacks -------------------------------------------
    def on_llm_start(self, serialized: Any, prompts: List[str], **kw: Any) -> None:
        self._open["llm"] = time.perf_counter()
        self.note(
            "llm",
            "Reasoning step",
            f"Prompt built ({len(prompts)} prompt(s), ~{sum(len(p) for p in prompts):,} chars)",
            running=True,
        )

    def on_llm_end(self, response: Any, **kw: Any) -> None:
        dt = self._last_dt("llm")
        usage = None
        try:
            out = getattr(response, "llm_output", None) or {}
            usage = out.get("token_usage") or out.get("usage")
            if usage is None:
                gen = getattr(response, "generations", None)
                if gen:
                    usage = getattr(gen[0][0].message, "usage_metadata", None)
        except Exception:
            usage = None
        if usage:
            pt = _pick(usage, "prompt_tokens", "input_tokens")
            ct = _pick(usage, "completion_tokens", "output_tokens")
            if pt:
                self.prompt_tokens += int(pt)
            if ct:
                self.completion_tokens += int(ct)
        else:
            # Honest reporting: a provider that does not report usage must not
            # silently look like a zero-token call.
            self.usage_known = False
        if self.events:
            last = self.events[-1]
            if last.kind == "llm" and last.status == "running":
                last.status = "done"
                last.latency_ms = dt
                last.data["running"] = False
                if usage:
                    last.data["usage"] = {
                        "prompt": _pick(usage, "prompt_tokens", "input_tokens"),
                        "completion": _pick(usage, "completion_tokens", "output_tokens"),
                    }

    def on_llm_error(self, error: BaseException, **kw: Any) -> None:
        if self.events:
            self.events[-1].status = "failed"
        self._add(
            ActivityEvent(
                seq=len(self.events) + 1,
                kind="error",
                name="LLM call failed",
                detail=str(error)[:300],
                status="failed",
                latency_ms=self._last_dt("llm"),
            )
        )

    def on_tool_start(self, serialized: Any, input_str: str, **kw: Any) -> None:
        name = (serialized or {}).get("name", "tool")
        self._open[f"tool:{name}"] = time.perf_counter()
        self.tool_calls.append({"tool": name, "input": str(input_str)[:300]})
        if name in ("search_papers", "read_passage"):
            self.searches.append({"tool": name, "input": str(input_str)[:200]})
        self._add(
            ActivityEvent(
                seq=len(self.events) + 1,
                kind="tool",
                name=name,
                detail=f"called with: {str(input_str)[:160]}",
                status="running",
                data={"input": str(input_str)[:300], "call_index": len(self.tool_calls)},
            )
        )

    def on_tool_end(self, output: Any, **kw: Any) -> None:
        name = "tool"
        for e in reversed(self.events):
            if e.kind == "tool" and e.status == "running":
                name = e.name
                break
        dt = self._last_dt(f"tool:{name}")
        text = _stringify(output)[:2200]
        for e in reversed(self.events):
            if e.kind == "tool" and e.status == "running":
                e.status = "done"
                e.latency_ms = dt
                e.data["output_preview"] = text[:400]
                break
        # Search outcomes are what the "decide whether to refine" logic reads.
        if name in ("search_papers", "read_passage"):
            for c in reversed(self.tool_calls):
                if c["tool"] == name and "hits" not in c:
                    c["hits"] = _extract_hit_count(text)
                    break

    def on_tool_error(self, error: BaseException, **kw: Any) -> None:
        for e in reversed(self.events):
            if e.kind == "tool" and e.status == "running":
                e.status = "failed"
                break
        self._add(
            ActivityEvent(
                seq=len(self.events) + 1,
                kind="error",
                name="Tool call failed",
                detail=str(error)[:300],
                status="failed",
            )
        )

    def on_agent_action(self, action: Any, **kw: Any) -> None:
        thought = getattr(action, "log", "") or ""
        if thought:
            first = thought.strip().split("\n")[0][:200]
            self.note("decision", "Agent chose next action", first, raw=thought[:400])

    def on_agent_finish(self, finish: Any, **kw: Any) -> None:
        self.note("decision", "Agent produced final answer", "Reasoning loop complete")

    def on_text(self, text: str, **kw: Any) -> None:
        t = (text or "").strip()
        if t and t.lower().startswith("thought:"):
            self.note("decision", "Agent reasoning", t[:220])

    def _last_dt(self, key: str) -> Optional[int]:
        t0 = self._open.pop(key, None)
        return int((time.perf_counter() - t0) * 1000) if t0 else None


def _pick(usage: Any, *names: str) -> Any:
    for n in names:
        if isinstance(usage, dict) and usage.get(n) is not None:
            return usage[n]
        v = getattr(usage, n, None)
        if v is not None:
            return v
    return None


def _stringify(v: Any) -> str:
    if isinstance(v, str):
        return v
    content = getattr(v, "content", None)
    if isinstance(content, str):
        return content
    return str(v)


def _extract_hit_count(text: str) -> Optional[int]:
    import re

    m = re.search(r"(?:retrieved|found|passages?|hits?)\D{0,12}(\d+)", text, re.I)
    return int(m.group(1)) if m else None
