"""Agent tools.

Two design points matter here and both are load-bearing for the brief:

1. **Retrieval is hard-scoped to human-approved papers.** `search_papers` and
   `read_passage` will not touch a document the researcher has not approved (or
   has explicitly rejected). Approval is therefore a real gate, not a UI
   decoration.

2. **The agent can ask for help.** `request_user_clarification` does not
   fabricate an answer to proceed; it raises `AgentNeedsUser`, which aborts the
   run with the session persisted in `awaiting_user` so it can be resumed.
   This is the human-in-the-loop requirement implemented as an actual pause.

Tools are built as closures over a per-run `ToolContext` because LangChain
tools are plain callables and this avoids a global mutable singleton.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

import db
from services import retrieval
from services.agent.callbacks import ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded

MAX_OBSERVATION_CHARS = 3500


@dataclass
class ToolContext:
    """Per-run state shared by the tools."""

    question: str
    approved_doc_ids: List[str]
    recorder: ActivityRecorder
    allow_external_search: bool = False
    retrieved: List[Dict[str, Any]] = field(default_factory=list)
    seen_chunk_ids: set = field(default_factory=set)
    papers_seen: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    answer: str = ""
    insufficient_evidence: bool = False
    #: When set, `search_papers` retrieves by vector similarity (restricted to
    #: approved docs) instead of BM25. basic_rag never sets this, which is what
    #: keeps the BM25 baseline intact.
    vector_store: Any = None

    @property
    def top_chunks(self) -> List[Dict[str, Any]]:
        return self.retrieved[:12]

    def unique_docs(self) -> List[Dict[str, Any]]:
        return list(self.papers_seen.values())


def _fmt_passage(chunk: Dict[str, Any], idx: int) -> str:
    title = (chunk.get("doc_title") or chunk.get("doc_filename") or "unknown source")
    marker = chunk.get("marker") or f"E{idx}"
    page = chunk.get("page")
    return (
        f"[{marker}] {title}\n"
        f"    page: {page} | section: {chunk.get('section', 'n/a')} | "
        f"year: {chunk.get('doc_year') or 'n/a'}\n"
        f"    {(chunk.get('text') or '')[:700]}"
    )


def _assign_markers(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Stable per-document markers so a citation always names its source."""
    order: List[str] = []
    for c in chunks:
        d = c.get("doc_id", "")
        if d not in order:
            order.append(d)
    mapping = {d: f"S{i + 1}" for i, d in enumerate(order)}
    for c in chunks:
        c["marker"] = mapping.get(c.get("doc_id", ""), "Sx")
    return chunks


def build_tools(ctx: ToolContext) -> List[Any]:
    """Return LangChain `Tool` objects bound to this run's context."""
    from langchain_classic.agents import Tool

    rec = ctx.recorder

    # ---------------------------------------------------------------- search
    def search_papers(query: str) -> str:
        """Search the approved paper collection for passages relevant to a query.
        Use focused keyword queries, not whole questions. Returns ranked passages
        with source and page so you can cite them."""
        if rec.tool_call_count > rec.max_tool_calls:
            raise ToolBudgetExceeded(
                f"Tool budget of {rec.max_tool_calls} calls is spent; synthesise now."
            )
        q = (query or "").strip()
        if not q:
            return "ERROR: empty query."

        if not ctx.approved_doc_ids:
            raise AgentNeedsUser(
                question=(
                    "No papers have been approved for this review yet. Which papers "
                    "should I base the review on?"
                ),
                options=[
                    "Approve all recommended candidates and continue",
                    "Let me pick the papers manually first",
                ],
                reason="empty_approved_set",
            )

        chunks = db.get_chunks(ctx.approved_doc_ids)
        if ctx.vector_store is not None:
            # Vector RAG over the approved papers only. The rows are shaped
            # exactly like `db.get_chunks` rows so everything downstream
            # (markers, coverage gate, verification) is unchanged.
            hits = ctx.vector_store.retrieve(q, ctx.approved_doc_ids, top_k=8)
        else:
            # BM25 baseline (always, for basic_rag; and for agentic when the
            # vector backend is off).
            hits = retrieval.retrieve(q, chunks, top_k=5, per_doc_cap=2)

        # Insufficient-evidence gate. If the passages BM25 ranked highest do not
        # actually contain the question's concepts, the collection does not
        # cover this topic; answering anyway on whatever ranked highest is how
        # a system reports findings the sources never made.
        if hits and not retrieval.coverage_passes(q, hits):
            matched, total, _ = retrieval.lexical_coverage(q, hits)
            rec.note(
                "limit", "Coverage check",
                f"Top passages matched {len(matched)}/{total} query terms; "
                "the approved collection does not cover this topic.",
            )
            return (
                "Insufficient evidence: the approved collection does not cover the "
                f"concepts in this question (matched {len(matched)}/{total} search "
                f"terms across the top-ranked passages). Try different keywords, or "
                "if the topic is genuinely uncovered, call request_user_clarification."
            )[:MAX_OBSERVATION_CHARS]

        # Merge into this run's evidence set, keeping the best score per chunk.
        merged: Dict[str, Dict[str, Any]] = {c["id"]: c for c in ctx.retrieved}
        for h in hits:
            prev = merged.get(h["id"])
            if prev is None or h["_score"] > prev.get("_score", 0.0):
                merged[h["id"]] = h
        ctx.retrieved = sorted(merged.values(), key=lambda c: -c.get("_score", 0.0))
        _assign_markers(ctx.retrieved)

        for h in hits:
            doc_id = h.get("doc_id", "")
            if doc_id and doc_id not in ctx.papers_seen:
                ctx.papers_seen[doc_id] = {
                    "doc_id": doc_id,
                    "marker": next(
                        (c["marker"] for c in ctx.retrieved if c.get("doc_id") == doc_id), "Sx"
                    ),
                    "title": h.get("doc_title") or h.get("doc_filename"),
                    "authors": h.get("doc_authors"),
                    "year": h.get("doc_year"),
                    "venue": h.get("doc_venue"),
                    "doi": h.get("doc_doi"),
                    "arxiv_id": h.get("doc_arxiv_id"),
                    "page_count": None,
                }

        if not hits:
            return (
                f"No passages in the approved collection matched '{q}'. "
                f"Retrieved 0 passages. Try different keywords, or if the topic is "
                f"genuinely uncovered, call request_user_clarification."
            )
        block = "\n".join(
            _fmt_passage(c, i) for i, c in enumerate(ctx.retrieved[:6], 1)
        )
        return (
            f"Retrieved {len(hits)} passage(s) for '{q}' "
            f"({len({h.get('doc_id') for h in hits})} distinct paper(s)). "
            f"Running evidence set: {len(ctx.retrieved)} passages.\n{block}"
        )[:MAX_OBSERVATION_CHARS]

    # ----------------------------------------------------------- read detail
    def read_passage(source: str) -> str:
        """Read a passage in full by its source marker (e.g. S1) or passage id.
        Use when a search snippet is truncated and you need the exact wording
        before citing a specific claim."""
        if rec.tool_call_count > rec.max_tool_calls:
            raise ToolBudgetExceeded(
                f"Tool budget of {rec.max_tool_calls} calls is spent; synthesise now."
            )
        key = (source or "").strip()
        if not key:
            return "ERROR: provide a source marker (e.g. S1) or passage id."
        target = next(
            (c for c in ctx.retrieved if c.get("marker") == key or c.get("id") == key), None
        )
        if target is None and key.startswith("S") and key[1:].isdigit():
            target = next(
                (
                    c
                    for c in ctx.retrieved
                    if (c.get("doc_title") or "").lower().find(key.lower()) >= 0
                ),
                None,
            )
        if target is None:
            known = sorted({c.get("marker", "?") for c in ctx.retrieved}) or ["(none)"]
            return (
                f"ERROR: no passage matches '{key}'. "
                f"Available markers from your searches: {', '.join(known)}."
            )
        ctx.seen_chunk_ids.add(target["id"])
        title = target.get("doc_title") or target.get("doc_filename")
        return (
            f"[{target.get('marker')}] {title} | page {target.get('page')} | "
            f"{target.get('section')}\n{target.get('text', '')}"
        )[:MAX_OBSERVATION_CHARS]

    # ---------------------------------------------------------------- finish
    def finalize(answer: str) -> str:
        """Submit the final answer. Cite every factual claim with a source marker
        such as [S1]. If the evidence is insufficient, say so explicitly instead
        of guessing."""
        if rec.tool_call_count > rec.max_tool_calls:
            raise ToolBudgetExceeded(
                f"Tool budget of {rec.max_tool_calls} calls is spent; finalise now."
            )
        text = (answer or "").strip()
        if not text:
            return "ERROR: the answer is empty."
        ctx.answer = text
        if re_insufficient(text):
            ctx.insufficient_evidence = True
        return (
            "Answer recorded. It will be checked for citation support before it is "
            "shown to the user."
        )

    # ------------------------------------------------------------------ ask
    def request_user_clarification(question: str, options: str = "") -> str:
        """Ask the researcher a question when the evidence is insufficient or the
        request is ambiguous. This pauses the run and waits for a human answer.
        Only call this when you genuinely cannot proceed."""
        opts = [o.strip() for o in (options or "").split("|") if o.strip()]
        raise AgentNeedsUser(
            question=(question or "").strip() or "I need more information to continue.",
            options=opts,
            reason="agent_request",
        )

    return [
        Tool(
            name="search_papers",
            description=search_papers.__doc__,
            func=search_papers,
        ),
        Tool(
            name="read_passage",
            description=read_passage.__doc__,
            func=read_passage,
        ),
        Tool(
            name="finalize",
            description=finalize.__doc__,
            func=finalize,
        ),
        Tool(
            name="request_user_clarification",
            description=request_user_clarification.__doc__,
            func=request_user_clarification,
        ),
    ]


INSUFFICIENT_MARKERS = (
    "insufficient evidence",
    "not enough evidence",
    "does not cover",
    "could not be found in the",
    "no passages",
    "cannot answer",
    "unable to answer",
    "not addressed by",
)


def re_insufficient(text: str) -> bool:
    low = (text or "").lower()
    return any(m in low for m in INSUFFICIENT_MARKERS)
