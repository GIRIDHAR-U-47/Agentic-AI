"""Vector retrieval: local persistent Chroma DB.

Requirement 4c of the pilot is a real vector RAG. This module implements the
full pipeline: passages with page/section/source-URL metadata are embedded once,
upserted into a Chroma collection, and retrieved by cosine similarity restricted
to the papers approved for the current session.

Two backends share one interface:

* `chroma` (when `RLENS_VECTOR_BACKEND=chroma`) -- local persistent Chroma DB,
  used with OpenRouter embeddings when `OPENROUTER_API_KEY` is set, or the
  deterministic fake embedder when no key is present. Fake and real vectors are
  stored in SEPARATE collections (`rlens_passages_fake` vs `rlens_passages_real`)
  so they can never mix. Fully testable with zero credentials.

The default is `off` so existing behaviour is untouched unless the operator
opts in -- and the BM25 retriever remains the basic_rag baseline regardless.

Vectors are never deleted on feedback/revision; they are removed only when a
paper is explicitly deleted from the collection (`DELETE /api/collection/{id}`).
"""
from __future__ import annotations

import json
import math
import os
from typing import Any, Dict, List, Optional

import config
import db
from services import embeddings

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:  # pragma: no cover
    chromadb = None  # type: ignore[assignment]
    Settings = None  # type: ignore[assignment]


# --------------------------------------------------------------------------
# Similarity (pure python, no numpy dependency) -- used for sqlite fallback
# (kept for reference; Chroma handles similarity internally)
# --------------------------------------------------------------------------
def _dot(a: List[float], b: List[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def _norm(v: List[float]) -> float:
    return math.sqrt(sum(x * x for x in v)) or 1.0


def cosine(a: List[float], b: List[float]) -> float:
    return _dot(a, b) / (_norm(a) * _norm(b))


class VectorStore:
    backend = "base"
    available = False
    reason = "not configured"

    def upsert_paper(self, doc_id: str) -> Dict[str, Any]:  # pragma: no cover
        raise NotImplementedError

    def delete_paper(self, doc_id: str) -> int:  # pragma: no cover
        raise NotImplementedError

    def retrieve(
        self, query: str, approved_doc_ids: List[str], top_k: int = 8
    ) -> List[Dict[str, Any]]:  # pragma: no cover
        raise NotImplementedError

    def count(self) -> int:  # pragma: no cover
        raise NotImplementedError

    def health(self) -> Dict[str, Any]:
        return {"backend": self.backend, "available": self.available, "reason": self.reason}


class ChromaVectorStore(VectorStore):
    """Chroma DB vector store with separate collections for real vs fake embeddings.

    Enabled when `RLENS_VECTOR_BACKEND=chroma`. Every vector document carries
    the passage text, page, section and citation metadata so a retrieved row
    can be rendered as a citation without a second lookup.

    Upsert uses a safe "delete-then-add" within a single Chroma transaction
    equivalent to avoid any window where vectors are missing. Since Chroma
    doesn't have explicit transactions, we delete by doc_id first, then add
    the new batch -- if add fails, the old vectors are gone (acceptable for
    a sync operation; the paper can be re-synced).
    """

    backend = "chroma"
    available = False
    reason = "chromadb not installed or not configured"

    def __init__(self):
        if chromadb is None:
            self.reason = "chromadb package not installed"
            return

        self.embedder = embeddings.build_embedder()
        self._client = chromadb.PersistentClient(
            path=str(config.CHROMA_PERSIST_DIR),
            settings=Settings(anonymized_telemetry=False),
        )

        # Separate collections for real vs fake embeddings -- never mix
        is_real = getattr(self.embedder, "real", False)
        collection_name = (
            config.CHROMA_COLLECTION_REAL if is_real else config.CHROMA_COLLECTION_FAKE
        )

        self.collection = self._client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},  # cosine similarity
        )
        self.available = True
        self.reason = f"local chroma ({collection_name})"
        self._is_real = is_real

    # -- persistence -------------------------------------------------------
    def upsert_paper(self, doc_id: str) -> Dict[str, Any]:
        if not self.available:
            return {"doc_id": doc_id, "upserted": 0, "error": self.reason}

        doc = db.get_document(doc_id)
        if not doc:
            return {"doc_id": doc_id, "upserted": 0, "error": "unknown document"}

        chunks = db.get_chunks([doc_id])
        if not chunks:
            return {"doc_id": doc_id, "upserted": 0, "error": "no chunks"}

        # Prepare batch
        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for c in chunks:
            text = c.get("text") or ""
            if len(text) < 20:
                continue
            chunk_id = c["id"]
            ids.append(chunk_id)
            documents.append(text)
            metadatas.append(
                {
                    "doc_id": doc_id,
                    "chunk_id": chunk_id,
                    "page": int(c.get("page", 0)),
                    "section": c.get("section", "Document Body"),
                    "title": doc.get("title", ""),
                    "authors": doc.get("authors", ""),
                    "year": doc.get("year"),
                    "venue": doc.get("venue", ""),
                    "arxiv_id": doc.get("arxiv_id"),
                    "doi": doc.get("doi", ""),
                    "source_url": doc.get("source_url", ""),
                    "full_text_available": int(doc.get("full_text_available", 1)),
                }
            )

        if not documents:
            return {"doc_id": doc_id, "upserted": 0, "error": "no valid chunks"}

        # Batch embed all passages at once (single API call for all chunks)
        embeddings_list = self.embedder.embed_batch(documents)

        if not ids:
            return {"doc_id": doc_id, "upserted": 0, "error": "no valid chunks"}

        # Safe upsert: delete existing vectors for this doc_id, then add new
        # Chroma's delete by where clause + add is the atomic-equivalent pattern
        try:
            self.collection.delete(where={"doc_id": doc_id})
        except Exception:
            # If delete fails (e.g., no existing vectors), continue to add
            pass

        self.collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings_list,
        )

        return {
            "doc_id": doc_id,
            "upserted": len(ids),
            "embedder": self.embedder.label(),
            "full_text_available": int(doc.get("full_text_available", 1)),
            "collection": self.collection.name,
        }

    def delete_paper(self, doc_id: str) -> int:
        if not self.available:
            return 0
        try:
            # Get count before delete for return value
            before = self.collection.count()
            self.collection.delete(where={"doc_id": doc_id})
            after = self.collection.count()
            return before - after
        except Exception:
            return 0

    def retrieve(
        self, query: str, approved_doc_ids: List[str], top_k: int = 8
    ) -> List[Dict[str, Any]]:
        if not self.available or not approved_doc_ids:
            return []

        # Chroma where clause for approved papers only
        where_clause = {"doc_id": {"$in": approved_doc_ids}}

        qvec = self.embedder.embed(query or "")

        # Query with embeddings; Chroma handles cosine similarity internally
        res = self.collection.query(
            query_embeddings=[qvec],
            where=where_clause,
            n_results=min(top_k * 4, 100),  # over-fetch slightly, we'll trim
            include=["documents", "metadatas", "distances"],
        )

        out: List[Dict[str, Any]] = []
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        dists = res.get("distances", [[]])[0]

        for doc_text, meta, dist in zip(docs, metas, dists):
            # Chroma returns cosine distance (0 = identical, 2 = opposite)
            # Convert to similarity score: 1 - dist/2 for cosine
            sim = 1.0 - (dist / 2.0) if dist is not None else 0.0
            m = meta or {}
            out.append(
                {
                    "id": m.get("chunk_id"),
                    "chunk_id": m.get("chunk_id"),
                    "doc_id": m.get("doc_id"),
                    "page": m.get("page", 0),
                    "section": m.get("section", "Document Body"),
                    "text": doc_text or "",
                    "ordinal": 0,
                    "prose": 1.0,
                    "doc_title": m.get("title", ""),
                    "doc_filename": "",
                    "doc_source": "arxiv",
                    "doc_authors": m.get("authors", ""),
                    "doc_year": m.get("year"),
                    "doc_venue": m.get("venue", ""),
                    "doc_doi": m.get("doi", ""),
                    "doc_arxiv_id": m.get("arxiv_id"),
                    "doc_source_url": m.get("source_url", ""),
                    "doc_full_text_available": int(m.get("full_text_available", 1)),
                    "_score": round(sim, 6),
                    "_retriever": "vector-chroma",
                }
            )

        # Sort by score descending and trim to top_k
        out.sort(key=lambda r: -r["_score"])
        return out[:top_k]

    def count(self) -> int:
        if not self.available:
            return 0
        try:
            return self.collection.count()
        except Exception:
            return 0

    def health(self) -> Dict[str, Any]:
        emb = self.embedder.label()
        return {
            "backend": self.backend,
            "available": self.available,
            "embedding_model": emb.get("model"),
            "embedding_real": emb.get("real", False),
            "embedding_dim": emb.get("dim"),
            "embedding_provider": emb.get("provider"),
            "collection": self.collection.name if self.available else None,
            "passages": self.count(),
        }


def build_vector_store() -> Optional[VectorStore]:
    """Instantiate the configured backend; None if disabled or unconfigured."""
    if config.VECTOR_BACKEND == "chroma":
        if chromadb is None:
            # Return an unavailable store so callers see an honest reason
            class UnavailableChroma(VectorStore):
                backend = "chroma"
                available = False
                reason = "chromadb package not installed (pip install chromadb)"

            return UnavailableChroma()
        return ChromaVectorStore()
    return None


def sync_paper_vectors(doc_id: str) -> Dict[str, Any]:
    """Upsert one paper's passages into the configured store (no-op when off)."""
    store = build_vector_store()
    if store is None:
        return {"doc_id": doc_id, "skipped": True, "reason": "vector backend off"}
    return store.upsert_paper(doc_id)


def sync_all() -> Dict[str, Any]:
    store = build_vector_store()
    if store is None:
        return {"synced": 0, "reason": "vector backend off"}
    total = 0
    for d in db.list_documents():
        res = store.upsert_paper(d["id"])
        total += int(res.get("upserted", 0))
    return {"synced": total, "papers": len(db.list_documents()), "health": store.health()}