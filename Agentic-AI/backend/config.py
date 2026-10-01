"""Central configuration for R-Lens, sourced from environment / .env.

No new dependency is used here on purpose: the project already ships
`python-dotenv`, and FastAPI reads plain strings fine. Keeping config in one
place is what makes the multi-provider evaluation harness possible.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

# Load .env from the backend directory (and repo root) if present.
BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_DIR.parent
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(REPO_ROOT / ".env")

DATA_DIR = Path(os.getenv("RLENS_DATA_DIR", BACKEND_DIR / "data")).resolve()
CORPUS_DIR = DATA_DIR / "corpus"
DB_PATH = Path(os.getenv("RLENS_DB_PATH", DATA_DIR / "rlens.sqlite3")).resolve()
EVAL_RESULTS_DIR = Path(
    os.getenv("RLENS_EVAL_RESULTS_DIR", BACKEND_DIR / "eval" / "results")
).resolve()

# --- Hard limits ---------------------------------------------------------
# These bound the agent's reasoning loop so a demo can never run away.
MAX_AGENT_ITERATIONS = int(os.getenv("RLENS_MAX_AGENT_ITERATIONS", "8"))
MAX_TOOL_CALLS = int(os.getenv("RLENS_MAX_TOOL_CALLS", "12"))
MAX_QUERY_REFINEMENTS = int(os.getenv("RLENS_MAX_QUERY_REFINEMENTS", "3"))
MAX_REFLECTION_PASSES = int(os.getenv("RLENS_MAX_REFLECTION_PASSES", "2"))
RETRIEVAL_TOP_K = int(os.getenv("RLENS_RETRIEVAL_TOP_K", "8"))
ARXIV_API_BASE = os.getenv("RLENS_ARXIV_API_BASE", "http://export.arxiv.org/api/query")
ARXIV_TIMEOUT_S = float(os.getenv("RLENS_ARXIV_TIMEOUT_S", "30"))
USER_AGENT = os.getenv(
    "RLENS_USER_AGENT",
    "R-Lens/2.5 (academic research assistant; contact via repo owner)",
)

# --- arXiv discovery -------------------------------------------------------
# How many candidate papers a fresh-topic search should try to return, and the
# lexical floor used to decide whether the first pass "covered" the question.
DISCOVERY_MAX_RESULTS = int(os.getenv("RLENS_DISCOVERY_MAX_RESULTS", "8"))

# --- Vector RAG (Chroma DB) ------------------------------------------------
# The retrieval backend for the agentic loop. "off" keeps the exact BM25
# behaviour the pilot shipped with (the basic_rag baseline is *always* BM25);
# "chroma" uses a local persistent Chroma DB with OpenRouter embeddings.
# See backend/.env.example for the full recipe.
VECTOR_BACKEND = os.getenv("RLENS_VECTOR_BACKEND", "off").strip().lower()

# Chroma persistence directory (created on first use).
CHROMA_PERSIST_DIR = Path(
    os.getenv("RLENS_CHROMA_DIR", DATA_DIR / "chroma")
).resolve()

# Chroma collection name (separate collections for real vs fake embeddings).
CHROMA_COLLECTION_REAL = os.getenv("RLENS_CHROMA_COLLECTION_REAL", "rlens_passages_real")
CHROMA_COLLECTION_FAKE = os.getenv("RLENS_CHROMA_COLLECTION_FAKE", "rlens_passages_fake")

# --- OpenRouter Embeddings -------------------------------------------------
# One documented model via OpenRouter (single OPENROUTER_API_KEY for both LLM
# and embeddings). Without the key the system uses a locally-computed
# deterministic embedder, clearly labelled "fake" everywhere -- fake vectors
# are stored in a separate Chroma collection so they can never mix with real.
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_EMBEDDING_MODEL = os.getenv("OPENROUTER_EMBEDDING_MODEL", "nvidia/nemotron-3-embed-1b:free").strip()
# Embedding dimension: set explicitly to avoid relying on model card claims.
# Will be verified on first real call; default 4096 for Nemotron 3 Embed 1B.
OPENROUTER_EMBEDDING_DIM = int(os.getenv("OPENROUTER_EMBEDDING_DIM", "4096"))
OPENROUTER_EMBEDDING_TIMEOUT_S = float(os.getenv("OPENROUTER_EMBEDDING_TIMEOUT_S", "30"))

# --- LLM Provider Registry -------------------------------------------------
# Two OpenRouter model slots so the eval harness can compare at least two
# OpenRouter models side by side when OPENROUTER_API_KEY is present.
# The offline provider is always available and never requires a key.

@dataclass
class ProviderSpec:
    """A concrete LLM the system can talk to."""

    name: str
    model: str
    api_key_env: Optional[str] = None
    base_url: Optional[str] = None
    # `offline` needs no key and always succeeds, which guarantees the demo,
    # the test-suite and the evaluation harness can always produce real output.
    requires_key: bool = True

    def key_present(self) -> bool:
        if not self.requires_key:
            return True
        if not self.api_key_env:
            return False
        return bool(os.getenv(self.api_key_env, "").strip())


def _specs() -> List[ProviderSpec]:
    return [
        ProviderSpec(
            name="offline",
            model="extractive-v1",
            requires_key=False,
        ),
        # Google Gemini: primary direct LLM provider
        ProviderSpec(
            name="gemini",
            model=os.getenv("RLENS_GEMINI_MODEL", "gemini-2.0-flash"),
            api_key_env="GEMINI_API_KEY",
        ),
        # OpenRouter: one key, many model families. Two model slots are exposed
        # so the evaluation harness can compare at least two OpenRouter models
        # side by side whenever OPENROUTER_API_KEY is present. They are always
        # reported as `openrouter`/`openrouter-strong` and never as `offline`.
        ProviderSpec(
            name="openrouter",
            model=os.getenv("RLENS_OPENROUTER_MODEL", "openai/gpt-4o-mini"),
            api_key_env="OPENROUTER_API_KEY",
            base_url="https://openrouter.ai/api/v1",
        ),
        ProviderSpec(
            name="openrouter-strong",
            model=os.getenv("RLENS_OPENROUTER_MODEL_2", "anthropic/claude-3.5-sonnet"),
            api_key_env="OPENROUTER_API_KEY",
            base_url="https://openrouter.ai/api/v1",
        ),
    ]


PROVIDERS: List[ProviderSpec] = _specs()


def get_provider(name: str) -> Optional[ProviderSpec]:
    for p in PROVIDERS:
        if p.name == name:
            return p
    return None


def available_providers() -> List[ProviderSpec]:
    return [p for p in PROVIDERS if p.key_present()]


def default_provider() -> ProviderSpec:
    """Pick the best provider that actually has credentials.

    Preference order honours RLENS_LLM_PROVIDER when it is usable, then Gemini,
    then any configured OpenRouter provider, then the deterministic offline provider.
    """
    requested = os.getenv("RLENS_LLM_PROVIDER", "").strip()
    if requested:
        spec = get_provider(requested)
        if spec and spec.key_present():
            return spec
    for name in ("gemini", "openrouter", "openrouter-strong"):
        spec = get_provider(name)
        if spec and spec.key_present():
            return spec
    return get_provider("offline")  # type: ignore[return-value]


def llm_status() -> dict:
    """Machine-readable provider status, surfaced at /api/health."""
    return {
        "default": default_provider().name,
        "providers": [
            {
                "name": p.name,
                "model": p.model,
                "requires_key": p.requires_key,
                "key_env": p.api_key_env,
                "available": p.key_present(),
            }
            for p in PROVIDERS
        ],
    }


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)
    EVAL_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    CHROMA_PERSIST_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class Limits:
    max_agent_iterations: int = MAX_AGENT_ITERATIONS
    max_tool_calls: int = MAX_TOOL_CALLS
    max_query_refinements: int = MAX_QUERY_REFINEMENTS
    max_reflection_passes: int = MAX_REFLECTION_PASSES
    retrieval_top_k: int = RETRIEVAL_TOP_K


LIMITS = Limits()