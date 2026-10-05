"""Centralized LLM Context Builder and Token Budgeting for R-Lens.

Optimizes prompts sent to Gemini and other providers by:
- Deduplicating retrieved text chunks
- Limiting conversation history to the most recent relevant turns (default 6)
- Generating compact summaries for older conversation turns
- Truncating oversized messages safely
- Restricting RAG evidence to top-K most relevant chunks (default 4 to 6)
- Preserving page numbers, section titles, and source markers
- Providing safe debugging logs without exposing secrets or keys
"""
from __future__ import annotations

import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import config

logger = logging.getLogger("rlens.llm.context")


def _clean_text(text: str) -> str:
    """Normalize whitespace and remove excessive blank lines."""
    if not text:
        return ""
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def compact_conversation_summary(
    messages: List[Dict[str, Any]],
    current_topic: str = "",
    max_turns: int = 12,
) -> str:
    """Deterministically extract a compact summary from older conversation history.

    Contains:
    - Research topic & objective
    - Key papers discussed
    - Important conclusions or findings
    - Open questions
    """
    if not messages:
        return ""

    user_turns = []
    assistant_turns = []
    papers_mentioned = set()

    # Scan messages for topics, questions, and paper titles
    for m in messages[:max_turns]:
        role = m.get("role", "")
        content = m.get("content", "").strip()
        if not content:
            continue

        if role == "user":
            user_turns.append(content)
        elif role == "assistant":
            # Extract bullet points or key claims
            lines = [l.strip() for l in content.split("\n") if l.strip()]
            for l in lines:
                if l.startswith(("-", "*", "1.", "2.", "3.", "###")):
                    cleaned = l.lstrip("-*# 1234567890.").strip()
                    if len(cleaned) > 20:
                        assistant_turns.append(cleaned[:120])
                        if len(assistant_turns) >= 5:
                            break

        # Check metadata for sources
        meta = m.get("metadata") or {}
        sources = meta.get("sources") or []
        for s in sources:
            t = s.get("doc_title") or s.get("filename")
            if t:
                papers_mentioned.add(t)

    summary_parts = []
    topic = current_topic or (user_turns[0][:100] if user_turns else "Academic Research")
    summary_parts.append(f"Research Topic: {topic}")

    if papers_mentioned:
        summary_parts.append(f"Papers Examined: {', '.join(list(papers_mentioned)[:4])}")

    if assistant_turns:
        summary_parts.append("Prior Key Insights: " + " | ".join(assistant_turns[:4]))

    if len(user_turns) > 1:
        summary_parts.append(f"Recent User Objective: {user_turns[-1][:120]}")

    return "\n".join(summary_parts)


def build_llm_context(
    current_question: str,
    recent_messages: Optional[List[Dict[str, Any]]] = None,
    conversation_summary: Optional[str] = None,
    retrieved_chunks: Optional[List[Dict[str, Any]]] = None,
    paper_context: Optional[str] = None,
    research_context: Optional[str] = None,
    max_chunks: int = 5,
    max_chunk_chars: int = 700,
    max_history_turns: int = 6,
) -> Dict[str, Any]:
    """Centralized prompt and context construction layer.

    Ensures no unnecessary token bloat is sent to Gemini while preserving
    strict academic citations and factual grounding.
    """
    current_q = _clean_text(current_question)

    # 1. Process and deduplicate retrieved RAG chunks
    evidence_blocks: List[str] = []
    seen_texts = set()
    used_chunks: List[Dict[str, Any]] = []

    if retrieved_chunks:
        for c in retrieved_chunks:
            raw_text = c.get("text", "") or c.get("quote", "")
            cleaned_body = _clean_text(raw_text)
            if not cleaned_body:
                continue

            # Deduplication fingerprint
            fingerprint = cleaned_body[:100].lower()
            if fingerprint in seen_texts:
                continue
            seen_texts.add(fingerprint)

            # Truncate oversized chunk content
            if len(cleaned_body) > max_chunk_chars:
                cleaned_body = cleaned_body[:max_chunk_chars] + "..."

            marker = c.get("marker") or f"S{len(used_chunks) + 1}"
            title = c.get("doc_title") or c.get("doc_filename") or c.get("filename") or "Document"
            page = c.get("page", 1)
            section = c.get("section", "Body")

            evidence_blocks.append(
                f"[EVIDENCE {marker}] Paper: {title} | Page {page} | Section: {section}\n{cleaned_body}"
            )
            used_chunks.append(c)

            if len(used_chunks) >= max_chunks:
                break

    evidence_str = "\n\n---\n\n".join(evidence_blocks)

    # 2. Process conversation history (limited to last N turns)
    history_lines: List[str] = []
    if recent_messages:
        relevant = [m for m in recent_messages if m.get("role") in ("user", "assistant")]
        # Slice to last N turns
        turns = relevant[-max_history_turns:]
        for m in turns:
            role = m.get("role", "")
            prefix = "Researcher" if role == "user" else "R-Lens"
            content = _clean_text(m.get("content", ""))
            # Truncate older history items to 400 chars max
            if len(content) > 400:
                content = content[:400] + "..."
            if content:
                history_lines.append(f"{prefix}: {content}")

    history_str = "\n".join(history_lines)

    # 3. Assemble sections into structured prompt
    prompt_sections: List[str] = []

    if paper_context:
        prompt_sections.append(f"=== SELECTED PAPER METADATA ===\n{_clean_text(paper_context)}")

    if research_context:
        prompt_sections.append(f"=== RESEARCH WORKSPACE CONTEXT ===\n{_clean_text(research_context)}")

    if conversation_summary:
        prompt_sections.append(f"=== CONVERSATION CONTEXT SUMMARY ===\n{_clean_text(conversation_summary)}")

    if evidence_str:
        prompt_sections.append(f"=== RETRIEVED EVIDENCE PASSAGES ===\n\n{evidence_str}")

    if history_str:
        prompt_sections.append(f"=== RECENT CONVERSATION ===\n{history_str}")

    prompt_sections.append(f"=== CURRENT USER QUESTION ===\n{current_q}")
    prompt_sections.append("=== GROUNDED RESPONSE (with evidence citations) ===")

    final_prompt = "\n\n".join(prompt_sections)

    stats = {
        "message_count": len(history_lines),
        "chunk_count": len(used_chunks),
        "input_chars": len(final_prompt),
        "has_summary": bool(conversation_summary),
        "has_evidence": bool(evidence_str),
    }

    return {
        "prompt": final_prompt,
        "evidence_str": evidence_str,
        "used_chunks": used_chunks,
        "stats": stats,
    }


def safe_log_llm_call(
    provider: str,
    model: str,
    stats: Dict[str, Any],
    max_tokens: int,
    agent_step: Optional[str] = None,
) -> None:
    """Log LLM invocation metadata safely without logging credentials or prompts."""
    step_info = f" | Step: {agent_step}" if agent_step else ""
    logger.info(
        "[LLM] Provider: %s | Model: %s | Messages: %s | Chunks: %s | Approx size: %d chars | Max tokens: %d%s",
        provider,
        model,
        stats.get("message_count", 0),
        stats.get("chunk_count", 0),
        stats.get("input_chars", 0),
        max_tokens,
        step_info,
    )
