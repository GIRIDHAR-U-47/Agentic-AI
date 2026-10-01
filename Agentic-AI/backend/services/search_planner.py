"""Search Planning Agent for Academic Discovery.

When a research topic is submitted, this agent:
1. Decomposes the topic into core domain, model families, datasets, and methods.
2. Formulates 3 to 5 targeted search queries covering different angles.
3. Produces a structured plan without exposing internal chain-of-thought.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from services.llm import build_llm


class ResearchPlan(BaseModel):
    topic: str
    domain: str = ""
    model_families: List[str] = Field(default_factory=list)
    methods: List[str] = Field(default_factory=list)
    datasets: List[str] = Field(default_factory=list)
    search_queries: List[str] = Field(default_factory=list)
    summary: str = ""


PLANNER_SYSTEM_PROMPT = """You are R-Lens Search Planner, an expert academic research strategist.
Given a user's research topic or question:
1. Identify the core domain, relevant model families, research methods, and benchmark datasets.
2. Generate 3 to 5 specific, high-recall search queries suitable for academic search engines (OpenAlex, Semantic Scholar, Crossref, arXiv).
3. Provide a single concise user-facing summary sentence (e.g., "Created 5 search queries covering forecasting models, explainability and electricity-load datasets.").
4. Do NOT expose internal reasoning or chain-of-thought.

You MUST reply with ONLY valid JSON matching this schema:
{
  "topic": "The user topic",
  "domain": "e.g. Energy Analytics & Time Series Forecasting",
  "model_families": ["Transformer", "LSTM", "PatchTST", "XAI"],
  "methods": ["Explainable AI", "Metaheuristics", "Attention Mechanisms"],
  "datasets": ["EPEX SPOT", "PJM Interconnection", "Electricity Load"],
  "search_queries": [
    "explainable deep learning electricity load forecasting",
    "short term load forecasting transformer XAI",
    "metaheuristic optimization energy time series forecasting",
    "deep learning interpretability power grid demand"
  ],
  "summary": "Created 4 search queries covering forecasting models, explainability, and power telemetry datasets."
}
"""


def plan_research_search(topic: str, llm=None) -> ResearchPlan:
    """Generate a structured search plan for a research topic."""
    topic = (topic or "").strip()
    if not topic:
        return ResearchPlan(
            topic="",
            summary="Empty research topic.",
            search_queries=[],
        )

    llm = llm or build_llm()
    prompt = f"Research Topic: {topic}\n\nGenerate structured search plan JSON:"

    try:
        res = llm.generate(prompt, system=PLANNER_SYSTEM_PROMPT, max_tokens=600)
        text = res.text.strip()
        # Extract JSON block if surrounded by markdown fences
        if "```" in text:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()
        
        data = json.loads(text)
        queries = [q.strip() for q in data.get("search_queries", []) if q.strip()]
        if not queries:
            queries = [topic]

        return ResearchPlan(
            topic=topic,
            domain=data.get("domain", "Academic Research"),
            model_families=data.get("model_families", []),
            methods=data.get("methods", []),
            datasets=data.get("datasets", []),
            search_queries=queries[:5],
            summary=data.get("summary", f"Created {len(queries[:5])} search queries for '{topic[:40]}'."),
        )
    except Exception:
        # Robust rule-based fallback
        clean_q = re.sub(r"[^\w\s]", " ", topic)
        words = [w for w in clean_q.split() if len(w) > 2]
        fallback_queries = [
            topic,
            f"{' '.join(words[:4])} deep learning",
            f"{' '.join(words[:3])} empirical benchmark",
        ]
        return ResearchPlan(
            topic=topic,
            domain="Academic Research",
            model_families=[],
            methods=[],
            datasets=[],
            search_queries=list(dict.fromkeys(fallback_queries)),
            summary=f"Created {len(fallback_queries)} search directions covering core concepts in '{topic[:35]}...'",
        )
