"""The three run modes, and the agent loop that drives the agentic one.

Modes
-----
`no_rag`      LLM answers from parametric memory only, no retrieval. This is the
              control that measures hallucination without a corpus.
`basic_rag`   One retrieve, one generate. The classic RAG baseline.
`agentic_rag` The `AgentExecutor` loop: plan, search, judge, refine, read,
              verify, and either answer or ask the human.

Running the same questions through all three over the same collection with the
same provider is what makes the Phase 3 comparison meaningful rather than
rhetorical.

The `AgentExecutor` exhaustion string is checked explicitly. The compat spike
showed that hitting `max_iterations` returns
`"Agent stopped due to iteration limit or time limit."` as a *successful* result,
so trusting `output` alone would silently ship an empty answer.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import config
import db
from services import retrieval
from services.agent import prompts
from services.agent.callbacks import (
    ActivityRecorder,
    AgentNeedsUser,
    ToolBudgetExceeded,
)
from services.agent.tools import ToolContext, _assign_markers, build_tools
from services.llm import build_llm, is_real

EXHAUSTED_MARKER = "Agent stopped due to iteration limit or time limit"


@dataclass
class RunResult:
    mode: str
    provider: str
    model: str
    answer: str = ""
    activity: List[Dict[str, Any]] = field(default_factory=list)
    citations: List[Dict[str, Any]] = field(default_factory=list)
    papers: List[Dict[str, Any]] = field(default_factory=list)
    verified: bool = False
    support_rate: float = 0.0
    metrics: Dict[str, Any] = field(default_factory=dict)
    state: str = "complete"
    pending: Optional[Dict[str, Any]] = None
    insufficient_evidence: bool = False
    latency_s: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mode": self.mode,
            "provider": self.provider,
            "model": self.model,
            "answer": self.answer,
            "activity": self.activity,
            "citations": self.citations,
            "papers": self.papers,
            "verified": self.verified,
            "support_rate": round(self.support_rate, 4),
            "metrics": self.metrics,
            "state": self.state,
            "pending": self.pending,
            "insufficient_evidence": self.insufficient_evidence,
            "latency_s": round(self.latency_s, 4),
        }


# --------------------------------------------------------------------------
# Shared helpers
# --------------------------------------------------------------------------
def _evidence_prompt(question: str, chunks: List[Dict[str, Any]], limit: int = 10) -> str:
    _assign_markers(chunks)
    blocks = []
    for c in chunks[:limit]:
        title = c.get("doc_title") or c.get("doc_filename")
        # The evidence id IS the citation marker (`S1`, `S2`, ...). Using the
        # positional index here instead would put `[1]` in the answer while the
        # verifier checks for `[S1]`, silently failing every claim.
        blocks.append(
            f"[EVIDENCE {c['marker']}] Source: {title} | Page {c.get('page')} | "
            f"Section: {c.get('section')}\n{c.get('text', '')}"
        )
    return (
        "=== RETRIEVED EVIDENCE ===\n\n"
        + "\n\n---\n\n".join(blocks)
        + f"\n\n=== USER QUESTION ===\n{question}\n\n=== GROUNDED ANSWER (cite every fact) ==="
    )


def _paper_records(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: Dict[str, Dict[str, Any]] = {}
    for c in chunks:
        d = c.get("doc_id")
        if not d or d in seen:
            continue
        seen[d] = {
            "doc_id": d,
            "marker": c.get("marker"),
            "title": c.get("doc_title") or c.get("doc_filename"),
            "authors": c.get("doc_authors"),
            "year": c.get("doc_year"),
            "venue": c.get("doc_venue"),
            "doi": c.get("doc_doi"),
            "arxiv_id": c.get("doc_arxiv_id"),
        }
    return list(seen.values())


def _persist(session_id: Optional[str], result: RunResult) -> None:
    if not session_id:
        return
    db.update_session(
        session_id,
        activity=result.activity,
        state=result.state,
        pending=result.pending,
        metrics=result.metrics,
    )
    if result.citations:
        db.replace_citations(session_id, result.citations)


# --------------------------------------------------------------------------
# no_rag
# --------------------------------------------------------------------------
def run_no_rag(
    question: str,
    session_id: Optional[str] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> RunResult:
    """Answer with no retrieval at all. Deliberately hallucination-prone."""
    rec = ActivityRecorder(question)
    t0 = time.perf_counter()
    rec.note("plan", "No-retrieval baseline",
             "Answering from model knowledge only. No sources will be available, "
             "so any factual claim is unverifiable by construction.")
    llm = build_llm(provider, model)
    rec.note("llm", "Reasoning step", "Generating ungrounded answer", running=True)
    try:
        res = llm.generate(
            f"Answer this research question from your own knowledge.\n\n"
            f"Question: {question}",
            system="You are a knowledgeable research assistant. Answer thoroughly.",
        )
    except Exception as exc:
        return RunResult(
            mode="no_rag", provider=llm.name, model=llm.model, state="failed",
            answer=f"Provider error: {exc}", activity=rec.as_dicts(),
            latency_s=time.perf_counter() - t0,
        )
    if rec.events:
        rec.events[-1].status = "done"
    rec.prompt_tokens = res.prompt_tokens or 0
    rec.completion_tokens = res.completion_tokens or 0
    rec.usage_known = res.usage_known
    rec.note("limit", "Verification", "No passages exist, so zero claims can be "
                                "verified. This is the expected failure mode of this baseline.")

    out = RunResult(
        mode="no_rag",
        provider=llm.name,
        model=llm.model,
        answer=res.text,
        activity=rec.as_dicts(),
        verified=False,
        support_rate=0.0,
        insufficient_evidence=True,
        metrics=rec.summary() | {
            "llm": res.to_dict(),
            "llm_real": is_real(llm),
            "insufficient_evidence": True,
        },
        latency_s=time.perf_counter() - t0,
    )
    _persist(session_id, out)
    return out


# --------------------------------------------------------------------------
# basic_rag  (the no-agent baseline)
# --------------------------------------------------------------------------
def run_basic_rag(
    question: str,
    doc_ids: Optional[List[str]] = None,
    session_id: Optional[str] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    top_k: Optional[int] = None,
) -> RunResult:
    """Single retrieve + single generate. No planning, no tools, no reflection."""
    from services.agent.reflection import verify

    rec = ActivityRecorder(question)
    t0 = time.perf_counter()
    scope = doc_ids or [d["id"] for d in db.list_documents()]
    rec.note("plan", "Single-shot retrieval",
             f"Retrieving top-{top_k or config.RETRIEVAL_TOP_K} passages for the query "
             f"as written. No query refinement, no multi-hop search, no tool loop.",
             scope=len(scope))
    chunks = db.get_chunks(scope)
    hits = retrieval.retrieve(question, chunks, top_k=top_k or config.RETRIEVAL_TOP_K)
    rec.note("tool", "search_papers", f"Retrieved {len(hits)} passage(s)", hits=len(hits))
    if not hits or not retrieval.coverage_passes(question, hits):
        rec.note("limit", "Retrieval", "No passages matched or topic uncovered; declining to answer.")
        out = RunResult(
            mode="basic_rag", provider="offline", model="extractive-v1",
            answer="Insufficient evidence: no passage in the approved collection matches "
                   "the question.",
            activity=rec.as_dicts(), state="complete", insufficient_evidence=True,
            verified=False, metrics=rec.summary() | {"hits": 0},
            latency_s=time.perf_counter() - t0,
        )
        _persist(session_id, out)
        return out

    llm = build_llm(provider, model)
    rec.note("llm", "Reasoning step", f"Grounded generation via {llm.name}/{llm.model}",
             running=True)
    try:
        res = llm.generate(
            _evidence_prompt(question, hits),
            system=prompts.BASIC_RAG_SYSTEM,
        )
    except Exception as exc:
        rec.events[-1].status = "failed"
        out = RunResult(
            mode="basic_rag", provider=llm.name, model=llm.model, state="failed",
            answer=f"Provider error: {exc}", activity=rec.as_dicts(),
            latency_s=time.perf_counter() - t0,
        )
        _persist(session_id, out)
        return out
    rec.events[-1].status = "done"
    rec.prompt_tokens = res.prompt_tokens or 0
    rec.completion_tokens = res.completion_tokens or 0
    rec.usage_known = res.usage_known

    refl = verify(res.text, hits, approved_doc_ids=scope, correct=False)
    rec.note(
        "decision", "Verification",
        f"{sum(1 for c in refl.checks if c.ok)}/{len(refl.checks)} claims supported "
        f"(rate {refl.support_rate:.2f}); baseline does not self-correct.",
        verified=refl.verified,
    )
    out = RunResult(
        mode="basic_rag",
        provider=llm.name,
        model=llm.model,
        answer=res.text,
        activity=rec.as_dicts(),
        citations=refl.citations,
        papers=_paper_records(hits),
        verified=refl.verified,
        support_rate=refl.support_rate,
        insufficient_evidence=not refl.citations,
        # `llm_real` / `insufficient_evidence` are part of the metric contract
        # across all three modes; the evaluation harness compares them directly,
        # so a mode that omitted them would be silently incomparable.
        metrics=rec.summary() | {
            "hits": len(hits),
            "llm": res.to_dict(),
            "llm_real": is_real(llm),
            "insufficient_evidence": not refl.citations,
        },
        latency_s=time.perf_counter() - t0,
    )
    _persist(session_id, out)
    return out


# --------------------------------------------------------------------------
# agentic_rag
# --------------------------------------------------------------------------
def run_agentic(
    question: str,
    doc_ids: Optional[List[str]] = None,
    session_id: Optional[str] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    max_iterations: Optional[int] = None,
    human_note: str = "",
) -> RunResult:
    """The full agentic loop. May pause for human input; may refuse to answer."""
    from langchain_classic.agents import AgentExecutor, create_react_agent
    from langchain_core.prompts import PromptTemplate

    from services.agent.offline_policy import OfflineReactPolicy
    from services.agent.reflection import verify
    from services.llm import as_chat_model

    rec = ActivityRecorder(question)
    t0 = time.perf_counter()
    scope = doc_ids if doc_ids is not None else db.approved_doc_ids(session_id or "")
    if session_id and not doc_ids:
        rejected = set(db.rejected_doc_ids(session_id))
        scope = [d for d in scope if d not in rejected]

    rec.note(
        "plan", "Planning the review",
        f"Scope: {len(scope)} human-approved paper(s). "
        f"Budget: {rec.max_tool_calls} tool calls, {rec.max_refinements} query refinements, "
        f"{max_iterations or config.MAX_AGENT_ITERATIONS} reasoning steps.",
        approved=list(scope),
    )
    if human_note:
        rec.note("decision", "Researcher instruction", human_note[:300])
    if not scope:
        rec.note("limit", "Blocked", "No approved papers; cannot retrieve anything.")

    ctx = ToolContext(question=question, approved_doc_ids=list(scope), recorder=rec)
    # Vector RAG for the agentic loop when the operator enabled a backend.
    from services import vectorstore as _vs

    if config.VECTOR_BACKEND != "off":
        store = _vs.build_vector_store()
        if store is not None and store.available:
            ctx.vector_store = store
            rec.note(
                "plan", "Retrieval backend",
                f"Vector RAG ({store.backend}, embedder "
                f"{store.embedder.label().get('model')} real="
                f"{store.embedder.label().get('real')}) over approved papers.",
            )
    tools = build_tools(ctx)

    llm = build_llm(provider, model)
    iters = max_iterations or config.MAX_AGENT_ITERATIONS

    if is_real(llm):
        chat = as_chat_model(llm, role="agent")
    else:
        chat = OfflineReactPolicy(ctx, rec).model

    react_prompt = PromptTemplate.from_template(
        "{system}\n\n"
        "You have these tools:\n{tools}\n\n"
        "Tool names: {tool_names}\n\n"
        "Research question: {input}\n\n"
        "{agent_scratchpad}"
    ).partial(system=prompts.AGENT_SYSTEM)

    agent = create_react_agent(chat, tools, react_prompt)
    ex = AgentExecutor(
        agent=agent,
        tools=tools,
        max_iterations=iters,
        early_stopping_method="force",
        return_intermediate_steps=True,
        handle_parsing_errors=True,
        verbose=False,
    )

    def finish(
        answer: str,
        state: str = "complete",
        pending: Optional[Dict[str, Any]] = None,
        correction: bool = True,
    ) -> RunResult:
        evidence = ctx.retrieved
        if not evidence:
            evidence = []
        refl = verify(answer, evidence, approved_doc_ids=scope, correct=correction)
        rec.note(
            "decision", "Verification",
            f"Checked {len(refl.checks)} claim(s): "
            f"{sum(1 for c in refl.checks if c.ok)} fully supported, "
            f"support rate {refl.support_rate:.2f}."
            + (f" Withdrew {sum(1 for c in refl.checks if not c.ok)} unsupported claim(s)."
               if correction and refl.issues else ""),
            verified=refl.verified,
            support_rate=refl.support_rate,
            issues=len(refl.issues),
        )
        final = refl.corrected_answer or answer
        if not refl.citations:
            rec.note("limit", "No citable source",
                     "No claim survived verification, so no citation can be offered.")
        out = RunResult(
            mode="agentic_rag",
            provider=llm.name,
            model=llm.model,
            answer=final,
            activity=rec.as_dicts(),
            citations=refl.citations,
            papers=_paper_records(evidence),
            verified=refl.verified,
            support_rate=refl.support_rate,
            state=state,
            pending=pending,
            insufficient_evidence=ctx.insufficient_evidence or not refl.citations,
            metrics=rec.summary()
            | {
                "passages_retrieved": len(evidence),
                "papers_used": len(ctx.papers_seen),
                "claims_checked": len(refl.checks),
                "claims_ok": sum(1 for c in refl.checks if c.ok),
                "issues": len(refl.issues),
                "llm_real": is_real(llm),
            },
            latency_s=time.perf_counter() - t0,
        )
        _persist(session_id, out)
        return out

    # ---- run the loop ---------------------------------------------------
    try:
        res = ex.invoke({"input": question}, config={"callbacks": [rec]})
    except AgentNeedsUser as need:
        rec.note("limit", "Paused for human input", need.question[:300], reason=need.reason)
        out = finish(
            answer=ctx.answer
            or "I paused to ask a clarifying question before answering.",
            state="awaiting_user",
            pending=need.to_dict(),
            correction=False,
        )
        return out
    except ToolBudgetExceeded as exc:
        rec.note("limit", "Tool budget exhausted", str(exc)[:300])
        return finish(
            answer=ctx.answer
            or "I stopped because the tool budget was exhausted before I had enough "
               "evidence to answer responsibly.",
            state="complete",
        )
    except Exception as exc:  # pragma: no cover - defensive
        rec.note("error", "Agent run failed", f"{type(exc).__name__}: {exc}"[:300],
                 status="failed")
        out = finish(answer=f"The agent run failed: {exc}", state="failed", correction=False)
        return out

    steps = res.get("intermediate_steps", [])
    output = (res.get("output") or "").strip()

    if len(steps) >= iters or output == EXHAUSTED_MARKER:
        rec.note(
            "limit", "Reasoning limit reached",
            f"Stopped after {len(steps)} step(s) / {rec.tool_call_count} tool call(s). "
            "Answering from the evidence already gathered rather than continuing.",
            hit=True,
        )
    if rec.tool_call_count >= rec.max_tool_calls:
        rec.note("limit", "Tool budget reached", f"{rec.tool_call_count} tool calls used.")

    answer = ctx.answer or output
    if not answer or answer == EXHAUSTED_MARKER:
        answer = (
            "Insufficient evidence: the agent gathered passages but produced no "
            "citable claim within its reasoning budget."
        )
    return finish(answer=answer)


MODES = ("no_rag", "basic_rag", "agentic_rag")


def run(
    mode: str,
    question: str,
    doc_ids: Optional[List[str]] = None,
    session_id: Optional[str] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> RunResult:
    if mode == "no_rag":
        return run_no_rag(question, session_id, provider, model)
    if mode == "basic_rag":
        return run_basic_rag(question, doc_ids, session_id, provider, model)
    if mode == "agentic_rag":
        return run_agentic(question, doc_ids, session_id, provider, model)
    raise ValueError(f"unknown mode: {mode!r} (expected one of {MODES})")
