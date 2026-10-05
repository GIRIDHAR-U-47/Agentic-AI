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

# --- Hard limits & Token Optimization Defaults -----------------------------
# These bound the agent's reasoning loop and token usage for efficiency.
MAX_AGENT_ITERATIONS = int(os.getenv("RLENS_MAX_AGENT_ITERATIONS", "3"))
MAX_TOOL_CALLS = int(os.getenv("RLENS_MAX_TOOL_CALLS", "6"))
MAX_QUERY_REFINEMENTS = int(os.getenv("RLENS_MAX_QUERY_REFINEMENTS", "1"))
MAX_RETRIEVAL_RETRIES = int(os.getenv("RLENS_MAX_RETRIEVAL_RETRIES", "1"))
MAX_REFLECTION_PASSES = int(os.getenv("RLENS_MAX_REFLECTION_PASSES", "1"))
RETRIEVAL_TOP_K = int(os.getenv("RLENS_RETRIEVAL_TOP_K", "5"))

# Output token budgets per task
GEMINI_MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "1024"))
NORMAL_CHAT_MAX_OUTPUT_TOKENS = int(os.getenv("NORMAL_CHAT_MAX_OUTPUT_TOKENS", "1024"))
RAG_ANSWER_MAX_OUTPUT_TOKENS = int(os.getenv("RAG_ANSWER_MAX_OUTPUT_TOKENS", "1024"))
LITERATURE_SYNTHESIS_MAX_OUTPUT_TOKENS = int(os.getenv("LITERATURE_SYNTHESIS_MAX_OUTPUT_TOKENS", "1536"))
RECENT_MESSAGE_LIMIT = int(os.getenv("RECENT_MESSAGE_LIMIT", "6"))

ARXIV_API_BASE = os.getenv("RLENS_ARXIV_API_BASE", "http://export.arxiv.org/api/query")
ARXIV_TIMEOUT_S = float(os.getenv("RLENS_ARXIV_TIMEOUT_S", "30"))
USER_AGENT = os.getenv(
    "RLENS_USER_AGENT",
    "R-Lens/2.5 (academic research assistant; contact via repo owner)",
)

# --- arXiv discovery -------------------------------------------------------
DISCOVERY_MAX_RESULTS = int(os.getenv("RLENS_DISCOVERY_MAX_RESULTS", "6"))

# --- Vector RAG (Chroma DB) ------------------------------------------------
VECTOR_BACKEND = os.getenv("RLENS_VECTOR_BACKEND", "off").strip().lower()

# Chroma persistence directory (created on first use).
CHROMA_PERSIST_DIR = Path(
    os.getenv("RLENS_CHROMA_DIR", DATA_DIR / "chroma")
).resolve()

# Chroma collection name (separate collections for real vs fake embeddings).
CHROMA_COLLECTION_REAL = os.getenv("RLENS_CHROMA_COLLECTION_REAL", "rlens_passages_real")
CHROMA_COLLECTION_FAKE = os.getenv("RLENS_CHROMA_COLLECTION_FAKE", "rlens_passages_fake")

# --- OpenRouter Embeddings -------------------------------------------------
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_EMBEDDING_MODEL = os.getenv("OPENROUTER_EMBEDDING_MODEL", "nvidia/nemotron-3-embed-1b:free").strip()
OPENROUTER_EMBEDDING_DIM = int(os.getenv("OPENROUTER_EMBEDDING_DIM", "4096"))
OPENROUTER_EMBEDDING_TIMEOUT_S = float(os.getenv("OPENROUTER_EMBEDDING_TIMEOUT_S", "30"))

# --- LLM Provider Registry -------------------------------------------------

@dataclass
class ProviderSpec:
    """A concrete LLM the system can talk to."""

    name: str
    model: str
    api_key_env: Optional[str] = None
    base_url: Optional[str] = None
    requires_key: bool = True

    def key_present(self) -> bool:
        if not self.requires_key:
            return True
        if self.name == "gemini":
            return bool(
                os.getenv("GEMINI_API_KEY", "").strip()
                or os.getenv("GOOGLE_API_KEY", "").strip()
            )
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
        # Google Gemini: primary active LLM provider
        ProviderSpec(
            name="gemini",
            model=os.getenv("RLENS_GEMINI_MODEL", os.getenv("GEMINI_MODEL", "gemini-3.8-flash")),
            api_key_env="GEMINI_API_KEY",
        ),
        # OpenRouter preserved as alternative provider
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
    """Pick the active provider.

    Explicit preference order:
    1. LLM_PROVIDER or RLENS_LLM_PROVIDER environment setting
    2. Gemini (primary default provider)
    3. OpenRouter (if credentials exist)
    4. Offline extractive provider
    """
    requested = (
        os.getenv("LLM_PROVIDER", "").strip().lower()
        or os.getenv("RLENS_LLM_PROVIDER", "").strip().lower()
    )
    if requested:
        spec = get_provider(requested)
        if spec:
            return spec

    # Default provider is Gemini
    gemini_spec = get_provider("gemini")
    if gemini_spec and gemini_spec.key_present():
        return gemini_spec

    # Fallback to other configured providers
    for name in ("openrouter", "openrouter-strong"):
        spec = get_provider(name)
        if spec and spec.key_present():
            return spec

    return gemini_spec or get_provider("offline")  # type: ignore[return-value]


def llm_status() -> dict:
    """Machine-readable provider status, surfaced at /api/health."""
    active = default_provider()
    return {
        "default": active.name,
        "active_model": active.model,
        "token_limits": {
            "gemini_max_output_tokens": GEMINI_MAX_OUTPUT_TOKENS,
            "normal_chat_max_output_tokens": NORMAL_CHAT_MAX_OUTPUT_TOKENS,
            "rag_answer_max_output_tokens": RAG_ANSWER_MAX_OUTPUT_TOKENS,
            "literature_synthesis_max_output_tokens": LITERATURE_SYNTHESIS_MAX_OUTPUT_TOKENS,
            "recent_message_limit": RECENT_MESSAGE_LIMIT,
            "max_agent_iterations": MAX_AGENT_ITERATIONS,
            "max_query_refinements": MAX_QUERY_REFINEMENTS,
            "retrieval_top_k": RETRIEVAL_TOP_K,
        },
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