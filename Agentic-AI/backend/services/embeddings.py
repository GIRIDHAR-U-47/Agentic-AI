"""Embeddings: one documented model via OpenRouter, honest fallback.

The documented model is NVIDIA Nemotron 3 Embed 1B (free) via OpenRouter
(4096 dims, 32K context). The key is read from `OPENROUTER_API_KEY` --
backend environment only. With no key the system uses a locally-computed
deterministic embedder that is *always labelled fake* wherever it is surfaced,
so a demo or test run can exercise the full vector pipeline without ever
pretending a real embedding model produced the vectors.

Fake and real embeddings are stored in SEPARATE Chroma collections
(`rlens_passages_fake` vs `rlens_passages_real`) so they can never mix.
"""
from __future__ import annotations

import hashlib
import os
import re
import time
from typing import List, Optional

import config


class Embedder:
    """A text -> vector function with an honest identity."""

    name = "base"
    model = "base"
    real = False
    dim = 64

    def embed(self, text: str) -> List[float]:  # pragma: no cover - interface
        raise NotImplementedError

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Default batch implementation (sequential). Subclasses can optimize."""
        return [self.embed(t) for t in texts]

    def label(self) -> dict:
        return {
            "name": self.name,
            "model": self.model,
            "real": self.real,
            "dim": self.dim,
            "provider": getattr(self, "provider", "unknown"),
        }


class FakeEmbedder(Embedder):
    """Deterministic, hashing-based, offline. Test/demo only -- never real."""

    name = "fake-deterministic"
    model = "hash-v1"
    real = False
    dim = 64
    provider = "fake"

    def embed(self, text: str) -> List[float]:
        vec = [0.0] * self.dim
        tokens = re.findall(r"[a-z0-9]+", (text or "").lower())
        for tok in tokens:
            h = hashlib.sha256(tok.encode("utf-8")).digest()
            idx = int.from_bytes(h[:2], "big") % self.dim
            sign = 1.0 if h[2] % 2 == 0 else -1.0
            vec[idx] += sign
        norm = (sum(v * v for v in vec) ** 0.5) or 1.0
        return [v / norm for v in vec]


class OpenRouterEmbedder(Embedder):
    """OpenRouter embeddings via the OpenAI-compatible embeddings endpoint.
    Requires OPENROUTER_API_KEY. Uses a single configured model for both
    passages and queries.
    """

    name = "openrouter"
    real = True
    provider = "openrouter"

    def __init__(self, model: Optional[str] = None):
        self.model = model or config.OPENROUTER_EMBEDDING_MODEL
        self.dim = config.OPENROUTER_EMBEDDING_DIM
        self._verified_dim: Optional[int] = None
        import openai  # guarded by build_embedder

        self._client = openai.OpenAI(
            api_key=config.OPENROUTER_API_KEY or None,
            base_url="https://openrouter.ai/api/v1",
            timeout=config.OPENROUTER_EMBEDDING_TIMEOUT_S,
        )

    def embed(self, text: str) -> List[float]:
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Batch embed via OpenRouter's OpenAI-compatible endpoint."""
        if not texts:
            return []

        # Filter empty strings but keep track of positions
        non_empty = [(i, t) for i, t in enumerate(texts) if t and t.strip()]
        if not non_empty:
            return [[0.0] * self.dim] * len(texts)

        indices, clean_texts = zip(*non_empty)

        # OpenRouter embeddings endpoint (OpenAI-compatible)
        resp = self._client.embeddings.create(
            model=self.model,
            input=list(clean_texts),
            encoding_format="float",
        )

        embeddings = [d.embedding for d in resp.data]

        # Verify dimension on first real call
        if self._verified_dim is None and embeddings:
            actual_dim = len(embeddings[0])
            if actual_dim != self.dim:
                # Log the discrepancy but continue with actual dimension
                # This ensures we never have dimension mismatches in Chroma
                import warnings
                warnings.warn(
                    f"OpenRouter embedding dimension mismatch: "
                    f"configured {self.dim}, actual {actual_dim} for model {self.model}. "
                    f"Using actual dimension. Set OPENROUTER_EMBEDDING_DIM={actual_dim} "
                    f"to silence this warning.",
                    UserWarning,
                )
                self._verified_dim = actual_dim
            else:
                self._verified_dim = actual_dim

        # Reconstruct results in original order
        results = [[0.0] * (self._verified_dim or self.dim) for _ in texts]
        for idx, emb in zip(indices, embeddings):
            results[idx] = emb

        return results

    def label(self) -> dict:
        base = super().label()
        base.update({
            "model": self.model,
            "dim": self._verified_dim or self.dim,
            "verified_dim": self._verified_dim is not None,
        })
        return base


def build_embedder() -> Embedder:
    """Return the real embedder when OPENROUTER_API_KEY exists, else the fake one."""
    if config.OPENROUTER_API_KEY:
        try:
            return OpenRouterEmbedder()
        except Exception:  # pragma: no cover - import/limit errors degrade
            pass
    return FakeEmbedder()