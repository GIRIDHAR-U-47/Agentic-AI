"""SQLite persistence for R-Lens (stdlib `sqlite3` only, no ORM).

Why this exists
---------------
The original service kept every uploaded paper in a plain Python dict
(`pdf_rag_service.py: self.documents = {}`), so a server restart destroyed the
corpus and any in-progress review. The mini-project brief requires session
state and user decisions to be *resumable*, so state has to outlive the
process. `sqlite3` ships with Python, which keeps the dependency footprint
unchanged.

Design notes
------------
* One connection per operation, opened in WAL mode. FastAPI runs sync
  endpoints in a threadpool, so a module-level connection would be unsafe.
* Chunks store their own FTS-free text; ranking happens in `retrieval.py`
  so it stays deterministic and unit-testable.
* JSON columns hold the activity log, plan and assembled review. They are
  append-mostly blobs that are always read and rewritten as a whole, so a
  normalised child table would buy nothing here.
"""
from __future__ import annotations

import json
import re
import sqlite3
import threading
import time
import uuid
from contextlib import contextmanager
from typing import Any, Dict, Iterable, Iterator, List, Optional

import config

_INIT_LOCK = threading.Lock()
_INITIALISED = False

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id            TEXT PRIMARY KEY,
    source        TEXT NOT NULL,              -- 'upload' | 'arxiv'
    filename      TEXT NOT NULL,
    title         TEXT NOT NULL DEFAULT '',
    authors       TEXT NOT NULL DEFAULT '',
    year          TEXT,
    venue         TEXT NOT NULL DEFAULT '',
    doi           TEXT NOT NULL DEFAULT '',
    arxiv_id      TEXT,
    page_count    INTEGER NOT NULL DEFAULT 0,
    sha256        TEXT,
    text_chars    INTEGER NOT NULL DEFAULT 0,
    abstract      TEXT NOT NULL DEFAULT '',
    source_url    TEXT NOT NULL DEFAULT '',
    full_text_available INTEGER NOT NULL DEFAULT 1,
    added_at      REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
    id       TEXT PRIMARY KEY,
    doc_id   TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page     INTEGER NOT NULL,
    section  TEXT NOT NULL DEFAULT 'Document Body',
    ordinal  INTEGER NOT NULL DEFAULT 0,
    prose    REAL NOT NULL DEFAULT 1.0,
    text     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);

CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL DEFAULT '',
    question      TEXT NOT NULL,
    mode          TEXT NOT NULL DEFAULT 'agentic',
    provider      TEXT NOT NULL DEFAULT 'offline',
    model         TEXT NOT NULL DEFAULT '',
    state         TEXT NOT NULL DEFAULT 'created',
    plan          TEXT NOT NULL DEFAULT '[]',
    activity      TEXT NOT NULL DEFAULT '[]',
    review        TEXT,
    pending       TEXT,
    metrics       TEXT NOT NULL DEFAULT '{}',
    revisions     TEXT NOT NULL DEFAULT '[]',
    discovery     TEXT NOT NULL DEFAULT '[]',
    error         TEXT,
    created_at    REAL NOT NULL,
    updated_at    REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS discovery_cache (
    question      TEXT PRIMARY KEY,
    payload       TEXT NOT NULL,               -- JSON list of candidate papers
    refined       INTEGER NOT NULL DEFAULT 0,
    search_events TEXT NOT NULL DEFAULT '[]',  -- JSON: per-pass search/refine events
    skipped_known INTEGER NOT NULL DEFAULT 0,  -- deduped against the corpus
    searched_at   REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    doc_id      TEXT NOT NULL,
    decision    TEXT NOT NULL,               -- 'approved' | 'rejected'
    note        TEXT NOT NULL DEFAULT '',
    actor       TEXT NOT NULL DEFAULT 'user',
    created_at  REAL NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_approval_unique
    ON approvals(session_id, doc_id, actor);

CREATE TABLE IF NOT EXISTS citations (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    marker      TEXT NOT NULL,               -- e.g. '[S1]'
    doc_id      TEXT NOT NULL,
    chunk_id    TEXT,
    page        INTEGER,
    section     TEXT,
    quote       TEXT NOT NULL,
    verified    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_citations_session ON citations(session_id);

CREATE TABLE IF NOT EXISTS eval_runs (
    id          TEXT PRIMARY KEY,
    created_at  REAL NOT NULL,
    mode        TEXT NOT NULL,
    provider    TEXT NOT NULL,
    model       TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question    TEXT NOT NULL,
    status      TEXT NOT NULL,               -- 'ok' | 'pending' | 'error'
    answer      TEXT,
    metrics     TEXT NOT NULL DEFAULT '{}',
    note        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_eval_qid ON eval_runs(question_id);

CREATE TABLE IF NOT EXISTS conversations (
    id                  TEXT PRIMARY KEY,
    title               TEXT NOT NULL DEFAULT '',
    mode                TEXT NOT NULL DEFAULT 'research', -- 'research' | 'chat_with_paper' | 'literature_review' | 'general_research'
    status              TEXT NOT NULL DEFAULT 'active',
    user_id             TEXT NOT NULL DEFAULT 'user',
    research_topic      TEXT NOT NULL DEFAULT '',
    selected_paper_ids  TEXT NOT NULL DEFAULT '[]',
    metadata            TEXT NOT NULL DEFAULT '{}',
    created_at          REAL NOT NULL,
    updated_at          REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id                  TEXT PRIMARY KEY,
    conversation_id     TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role                TEXT NOT NULL,                     -- 'user' | 'assistant' | 'agent-activity'
    content             TEXT NOT NULL DEFAULT '',
    sequence            INTEGER NOT NULL DEFAULT 0,
    metadata            TEXT NOT NULL DEFAULT '{}',
    created_at          REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, sequence ASC);
"""


def _connect() -> sqlite3.Connection:
    config.ensure_dirs()
    conn = sqlite3.connect(str(config.DB_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def cursor() -> Iterator[sqlite3.Cursor]:
    conn = _connect()
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def transaction() -> Iterator[sqlite3.Connection]:
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    global _INITIALISED
    with _INIT_LOCK:
        if _INITIALISED:
            return
        with transaction() as conn:
            conn.executescript(SCHEMA)
            _migrate(conn)
        _INITIALISED = True


# Columns added after the first release. `CREATE TABLE IF NOT EXISTS` will not
# add these to an already-created table, so existing databases are upgraded
# in place rather than forcing contributors to delete the file.
_MIGRATIONS = (
    ("chunks", "prose", "REAL NOT NULL DEFAULT 1.0"),
    ("documents", "abstract", "TEXT NOT NULL DEFAULT ''"),
    ("documents", "source_url", "TEXT NOT NULL DEFAULT ''"),
    ("documents", "full_text_available", "INTEGER NOT NULL DEFAULT 1"),
    ("sessions", "revisions", "TEXT NOT NULL DEFAULT '[]'"),
    ("sessions", "discovery", "TEXT NOT NULL DEFAULT '[]'"),
    ("sessions", "discovery_meta", "TEXT NOT NULL DEFAULT '{}'"),
    ("discovery_cache", "search_events", "TEXT NOT NULL DEFAULT '[]'"),
    ("discovery_cache", "skipped_known", "INTEGER NOT NULL DEFAULT 0"),
)


def _migrate(conn: sqlite3.Connection) -> None:
    # Ensure tables from newest schema exist
    conn.executescript(SCHEMA)
    for table, column, decl in _MIGRATIONS:
        cols = {r["name"] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}
        if column not in cols:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")


def reset_db() -> None:
    """Drop and rebuild every table. Used by the test-suite and `eval --reset`."""
    global _INITIALISED
    with _INIT_LOCK:
        with transaction() as conn:
            rows = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ).fetchall()
            for r in rows:
                conn.execute(f"DROP TABLE IF EXISTS {r['name']}")
        _INITIALISED = False
    init_db()


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def now() -> float:
    return time.time()


def _dumps(v: Any) -> str:
    return json.dumps(v, ensure_ascii=False)


def _loads(v: Optional[str], fallback: Any) -> Any:
    if not v:
        return fallback
    try:
        return json.loads(v)
    except (ValueError, TypeError):
        return fallback


# --------------------------------------------------------------------------
# Documents
# --------------------------------------------------------------------------
def upsert_document(doc: Dict[str, Any], chunks: Iterable[Dict[str, Any]]) -> str:
    init_db()
    doc_id = doc["id"]
    with transaction() as conn:
        conn.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))
        conn.execute(
            """
            INSERT INTO documents
                (id, source, filename, title, authors, year, venue, doi, arxiv_id,
                 page_count, sha256, text_chars, abstract, source_url,
                 full_text_available, added_at)
            VALUES
                (:id, :source, :filename, :title, :authors, :year, :venue, :doi, :arxiv_id,
                 :page_count, :sha256, :text_chars, :abstract, :source_url,
                 :full_text_available, :added_at)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title, authors=excluded.authors, year=excluded.year,
                venue=excluded.venue, doi=excluded.doi, arxiv_id=excluded.arxiv_id,
                page_count=excluded.page_count, sha256=excluded.sha256,
                text_chars=excluded.text_chars, abstract=excluded.abstract,
                source_url=excluded.source_url,
                full_text_available=excluded.full_text_available
            """,
            {
                "id": doc_id,
                "source": doc.get("source", "upload"),
                "filename": doc.get("filename", ""),
                "title": doc.get("title", ""),
                "authors": doc.get("authors", ""),
                "year": doc.get("year"),
                "venue": doc.get("venue", ""),
                "doi": doc.get("doi", ""),
                "arxiv_id": doc.get("arxiv_id"),
                "page_count": int(doc.get("page_count", 0)),
                "sha256": doc.get("sha256"),
                "text_chars": int(doc.get("text_chars", 0)),
                "abstract": doc.get("abstract", ""),
                "source_url": doc.get("source_url", ""),
                "full_text_available": int(doc.get("full_text_available", 1)),
                "added_at": doc.get("added_at", now()),
            },
        )
        conn.executemany(
            "INSERT INTO chunks (id, doc_id, page, section, ordinal, prose, text)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                (
                    c["id"],
                    doc_id,
                    int(c.get("page", 0)),
                    c.get("section", "Document Body"),
                    int(c.get("ordinal", 0)),
                    float(c.get("prose", 1.0)),
                    c["text"],
                )
                for c in chunks
            ],
        )
    return doc_id


def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with cursor() as cur:
        cur.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cur.fetchone()
    return dict(row) if row else None


def list_documents(source: Optional[str] = None) -> List[Dict[str, Any]]:
    init_db()
    q = "SELECT * FROM documents"
    args: List[Any] = []
    if source:
        q += " WHERE source = ?"
        args.append(source)
    q += " ORDER BY added_at ASC"
    with cursor() as cur:
        cur.execute(q, args)
        return [dict(r) for r in cur.fetchall()]


def delete_document(doc_id: str) -> bool:
    init_db()
    with transaction() as conn:
        cur = conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))
    return cur.rowcount > 0


def get_chunks(doc_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    init_db()
    q = (
        "SELECT c.*, d.title AS doc_title, d.filename AS doc_filename, "
        "d.source AS doc_source, d.authors AS doc_authors, d.year AS doc_year, "
        "d.venue AS doc_venue, d.doi AS doc_doi, d.arxiv_id AS doc_arxiv_id, "
        "d.source_url AS doc_source_url, d.full_text_available AS doc_full_text_available "
        "FROM chunks c JOIN documents d ON d.id = c.doc_id"
    )
    args: List[Any] = []
    if doc_ids:
        if not doc_ids:
            return []
        q += f" WHERE c.doc_id IN ({','.join('?' * len(doc_ids))})"
        args.extend(doc_ids)
    q += " ORDER BY c.doc_id, c.ordinal"
    with cursor() as cur:
        cur.execute(q, args)
        return [dict(r) for r in cur.fetchall()]


def get_chunk(chunk_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with cursor() as cur:
        cur.execute(
            "SELECT c.*, d.title AS doc_title, d.filename AS doc_filename,"
            " d.source AS doc_source, d.authors AS doc_authors, d.year AS doc_year,"
            " d.venue AS doc_venue, d.doi AS doc_doi, d.arxiv_id AS doc_arxiv_id,"
            " d.source_url AS doc_source_url, d.full_text_available AS doc_full_text_available"
            " FROM chunks c JOIN documents d ON d.id = c.doc_id WHERE c.id = ?",
            (chunk_id,),
        )
        row = cur.fetchone()
    return dict(row) if row else None


def corpus_stats() -> Dict[str, int]:
    init_db()
    with cursor() as cur:
        docs = cur.execute("SELECT COUNT(*) c FROM documents").fetchone()["c"]
        chunks = cur.execute("SELECT COUNT(*) c FROM chunks").fetchone()["c"]
        chars = cur.execute(
            "SELECT COALESCE(SUM(LENGTH(text)),0) c FROM chunks"
        ).fetchone()["c"]
    return {"documents": docs, "chunks": chunks, "chunk_chars": int(chars)}


# --------------------------------------------------------------------------
# Sessions
# --------------------------------------------------------------------------
SESSION_STATES = (
    "created",
    "planning",
    "awaiting_approval",
    "awaiting_user",
    "synthesising",
    "reflecting",
    "complete",
    "failed",
)


def create_session(
    question: str,
    mode: str = "agentic",
    provider: str = "offline",
    model: str = "",
    title: str = "",
) -> str:
    init_db()
    sid = new_id("ses")
    ts = now()
    with transaction() as conn:
        conn.execute(
            "INSERT INTO sessions (id, title, question, mode, provider, model, state,"
            " created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
            (sid, title or question[:120], question, mode, provider, model, "created", ts, ts),
        )
    return sid


#: `sessions` columns that hold JSON documents. SQLite cannot distinguish these
#: from plain TEXT, so they are declared here and validated against the live
#: schema on every write. This used to be a bare literal
#: (`{"plan", "activity", "pending", "metrics"}`) with `review` missing, so every
#: attempt to persist an assembled review raised
#: `sqlite3.InterfaceError: Error binding parameter 0` -- the review feature's
#: entire persistence path was broken while every unrelated test still passed.
_JSON_SESSION_COLUMNS = ("plan", "activity", "review", "pending", "metrics", "revisions", "discovery", "discovery_meta")


def _sessions_json_columns() -> set:
    """The declared JSON columns, checked against the live table definition.

    Validating on every write means renaming or dropping a column fails loudly
    at the point of use instead of silently losing data.
    """
    with cursor() as cur:
        present = {r["name"] for r in cur.execute("PRAGMA table_info(sessions)")}
    missing = set(_JSON_SESSION_COLUMNS) - present
    if missing:
        raise RuntimeError(
            f"db.update_session: declared JSON columns absent from `sessions`: "
            f"{sorted(missing)}. Fix the schema or _JSON_SESSION_COLUMNS."
        )
    return set(_JSON_SESSION_COLUMNS)


def update_session(session_id: str, **fields: Any) -> None:
    if not fields:
        return
    init_db()
    json_fields = _sessions_json_columns()
    cols, vals = [], []
    for k, v in fields.items():
        cols.append(f"{k} = ?")
        # Serialise anything structured, whether or not it is a known JSON
        # column: a dict or list bound straight to sqlite3 always raises.
        if k in json_fields or isinstance(v, (dict, list)):
            vals.append(_dumps(v))
        else:
            vals.append(v)
    cols.append("updated_at = ?")
    vals.append(now())
    vals.append(session_id)
    with transaction() as conn:
        conn.execute(f"UPDATE sessions SET {', '.join(cols)} WHERE id = ?", vals)


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with cursor() as cur:
        cur.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cur.fetchone()
    if not row:
        return None
    d = dict(row)
    d["plan"] = _loads(d.get("plan"), [])
    d["activity"] = _loads(d.get("activity"), [])
    d["review"] = _loads(d.get("review"), None)
    d["pending"] = _loads(d.get("pending"), None)
    d["metrics"] = _loads(d.get("metrics"), {})
    d["revisions"] = _loads(d.get("revisions"), [])
    d["discovery"] = _loads(d.get("discovery"), [])
    d["discovery_meta"] = _loads(d.get("discovery_meta"), {})
    return d


def list_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    init_db()
    with cursor() as cur:
        cur.execute(
            "SELECT id, title, question, mode, provider, model, state, created_at, updated_at"
            " FROM sessions ORDER BY updated_at DESC LIMIT ?",
            (limit,),
        )
        return [dict(r) for r in cur.fetchall()]


def delete_session(session_id: str) -> bool:
    init_db()
    with transaction() as conn:
        cur = conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    return cur.rowcount > 0


# --------------------------------------------------------------------------
# Approvals
# --------------------------------------------------------------------------
def set_approval(
    session_id: str, doc_id: str, decision: str, note: str = "", actor: str = "user"
) -> Dict[str, Any]:
    init_db()
    if decision not in ("approved", "rejected"):
        raise ValueError("decision must be 'approved' or 'rejected'")
    aid = new_id("apv")
    ts = now()
    with transaction() as conn:
        conn.execute(
            "INSERT INTO approvals (id, session_id, doc_id, decision, note, actor, created_at)"
            " VALUES (?,?,?,?,?,?,?)"
            " ON CONFLICT(session_id, doc_id, actor) DO UPDATE SET"
            "   decision=excluded.decision, note=excluded.note, created_at=excluded.created_at",
            (aid, session_id, doc_id, decision, note, actor, ts),
        )
    return {
        "id": aid,
        "session_id": session_id,
        "doc_id": doc_id,
        "decision": decision,
        "note": note,
        "actor": actor,
        "created_at": ts,
    }


def clear_actor_approvals(session_id: str, actor: str) -> None:
    init_db()
    with transaction() as conn:
        conn.execute(
            "DELETE FROM approvals WHERE session_id = ? AND actor = ?", (session_id, actor)
        )


def get_approvals(session_id: str) -> List[Dict[str, Any]]:
    init_db()
    with cursor() as cur:
        cur.execute(
            "SELECT * FROM approvals WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,),
        )
        return [dict(r) for r in cur.fetchall()]


def approved_doc_ids(session_id: str) -> List[str]:
    return [a["doc_id"] for a in get_approvals(session_id) if a["decision"] == "approved"]


def rejected_doc_ids(session_id: str) -> List[str]:
    return [a["doc_id"] for a in get_approvals(session_id) if a["decision"] == "rejected"]


# --------------------------------------------------------------------------
# Citations
# --------------------------------------------------------------------------
def replace_citations(session_id: str, citations: List[Dict[str, Any]]) -> None:
    init_db()
    with transaction() as conn:
        conn.execute("DELETE FROM citations WHERE session_id = ?", (session_id,))
        conn.executemany(
            "INSERT INTO citations (id, session_id, marker, doc_id, chunk_id, page, section,"
            " quote, verified) VALUES (?,?,?,?,?,?,?,?,?)",
            [
                (
                    c.get("id") or new_id("cit"),
                    session_id,
                    c["marker"],
                    c["doc_id"],
                    c.get("chunk_id"),
                    c.get("page"),
                    c.get("section"),
                    c["quote"],
                    1 if c.get("verified") else 0,
                )
                for c in citations
            ],
        )


def get_citations(session_id: str) -> List[Dict[str, Any]]:
    init_db()
    with cursor() as cur:
        cur.execute(
            "SELECT c.*, d.title AS doc_title, d.arxiv_id AS arxiv_id,"
            " d.source_url AS source_url,"
            " d.full_text_available AS full_text_available"
            " FROM citations c LEFT JOIN documents d ON d.id = c.doc_id"
            " WHERE c.session_id = ? ORDER BY c.marker, c.page",
            (session_id,),
        )
        return [dict(r) for r in cur.fetchall()]


# --------------------------------------------------------------------------
# Evaluation runs
# --------------------------------------------------------------------------
def record_eval_run(
    question_id: str,
    question: str,
    mode: str,
    provider: str,
    model: str,
    status: str,
    metrics: Dict[str, Any],
    answer: Optional[str] = None,
    note: str = "",
) -> str:
    init_db()
    rid = new_id("ev")
    with transaction() as conn:
        conn.execute(
            "INSERT INTO eval_runs (id, created_at, mode, provider, model, question_id,"
            " question, status, answer, metrics, note) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (
                rid,
                now(),
                mode,
                provider,
                model,
                question_id,
                question,
                status,
                answer,
                _dumps(metrics),
                note,
            ),
        )
    return rid


def list_eval_runs(limit: int = 500) -> List[Dict[str, Any]]:
    init_db()
    with cursor() as cur:
        cur.execute("SELECT * FROM eval_runs ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cur.fetchall()]
    for r in rows:
        r["metrics"] = _loads(r.get("metrics"), {})
    return rows


# --------------------------------------------------------------------------
# Discovery cache (arXiv topic search)
# --------------------------------------------------------------------------
def cache_discovery(
    question: str,
    candidates: List[Dict[str, Any]],
    refined: bool = False,
    search_events: Optional[List[Dict[str, Any]]] = None,
    skipped_known: int = 0,
) -> None:
    """Store a fresh-topic search result so re-opening a session does not
    re-hit arXiv. The question is normalised (lowercased, collapsed) so the
    same search from the UI and the API share one cache row. Per-pass search
    events and corpus-dedupe counts are cached too: the refined/refused trail
    must survive a cache hit, or the UI would show a search that never happened.
    """
    init_db()
    key = " ".join((question or "").lower().split())
    with transaction() as conn:
        conn.execute(
            "INSERT INTO discovery_cache"
            " (question, payload, refined, search_events, skipped_known, searched_at)"
            " VALUES (?,?,?,?,?,?)"
            " ON CONFLICT(question) DO UPDATE SET"
            "   payload=excluded.payload, refined=excluded.refined,"
            "   search_events=excluded.search_events,"
            "   skipped_known=excluded.skipped_known,"
            "   searched_at=excluded.searched_at",
            (
                key,
                _dumps(candidates),
                1 if refined else 0,
                _dumps(search_events or []),
                int(skipped_known or 0),
                now(),
            ),
        )


def get_discovery_cache(question: str) -> Optional[Dict[str, Any]]:
    init_db()
    key = " ".join((question or "").lower().split())
    with cursor() as cur:
        cur.execute(
            "SELECT payload, refined, search_events, skipped_known, searched_at"
            " FROM discovery_cache WHERE question = ?",
            (key,),
        )
        row = cur.fetchone()
    if not row:
        return None
    return {
        "payload": _loads(row["payload"], []),
        "refined": bool(row["refined"]),
        "search_events": _loads(row["search_events"], []),
        "skipped_known": int(row["skipped_known"] or 0),
        "searched_at": row["searched_at"],
    }


# --------------------------------------------------------------------------
# Persistent Conversations & Messages (ChatGPT-Style Architecture)
# --------------------------------------------------------------------------

_JSON_CONV_COLUMNS = {"selected_paper_ids", "metadata"}
_JSON_MSG_COLUMNS = {"metadata"}


def generate_conversation_title(text: str) -> str:
    """Generate a clean 40-60 character conversation title locally without LLM tokens."""
    cleaned = (text or "").strip()
    if not cleaned:
        return "New Research"
    
    # Strip common conversational question prefixes
    patterns = [
        r"^(can you\s+)?(please\s+)?(help me\s+)?(to\s+)?(find|search|explore|investigate|analyze|compare|review|summarize|explain)\s+(papers\s+on|about|the)?\s*",
        r"^(what|how|why|which|where|when|is|are|does|do|can|could|would)\s+(is|are|the|a|an|to|can|could)?\s*",
        r"^(literature review\s+(on|for|of)?\s*)",
    ]
    t = cleaned
    for p in patterns:
        t = re.sub(p, "", t, flags=re.IGNORECASE).strip()
    
    t = t.rstrip("?.! ")
    if not t:
        t = cleaned[:50]
    
    # Truncate neatly at word boundary around 45-55 chars
    if len(t) > 55:
        sub = t[:52]
        last_space = sub.rfind(" ")
        if last_space > 25:
            t = sub[:last_space] + "..."
        else:
            t = sub + "..."
            
    # Capitalize appropriately
    words = t.split()
    if words:
        capitalized = []
        for i, w in enumerate(words):
            if i == 0 or w.lower() not in {"a", "an", "the", "in", "on", "at", "for", "to", "of", "and", "or", "via", "with", "by", "vs"}:
                capitalized.append(w.capitalize() if not w.isupper() and not any(c.isupper() for c in w[1:]) else w)
            else:
                capitalized.append(w.lower())
        return " ".join(capitalized)
    return "New Research"


def create_conversation(
    title: str = "",
    mode: str = "research",
    user_id: str = "user",
    research_topic: str = "",
    selected_paper_ids: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    conv_id: Optional[str] = None,
) -> Dict[str, Any]:
    init_db()
    cid = conv_id or new_id("conv")
    ts = now()
    final_title = (title or "").strip() or (generate_conversation_title(research_topic) if research_topic else "New Research")
    
    selected_papers = selected_paper_ids or []
    meta = metadata or {}
    
    with transaction() as conn:
        conn.execute(
            """
            INSERT INTO conversations
                (id, title, mode, status, user_id, research_topic, selected_paper_ids, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cid,
                final_title,
                mode,
                "active",
                user_id,
                research_topic,
                _dumps(selected_papers),
                _dumps(meta),
                ts,
                ts,
            ),
        )
    return {
        "id": cid,
        "title": final_title,
        "mode": mode,
        "status": "active",
        "user_id": user_id,
        "research_topic": research_topic,
        "selected_paper_ids": selected_papers,
        "metadata": meta,
        "created_at": ts,
        "updated_at": ts,
        "message_count": 0,
    }


def get_conversation(conv_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with cursor() as cur:
        cur.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
        row = cur.fetchone()
    if not row:
        return None
    d = dict(row)
    d["selected_paper_ids"] = _loads(d.get("selected_paper_ids"), [])
    d["metadata"] = _loads(d.get("metadata"), {})
    # Get message count
    with cursor() as cur:
        count = cur.execute("SELECT COUNT(*) c FROM messages WHERE conversation_id = ?", (conv_id,)).fetchone()["c"]
        d["message_count"] = count
    return d


def list_conversations(mode: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    init_db()
    q = (
        "SELECT c.*, (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count "
        "FROM conversations c"
    )
    args: List[Any] = []
    if mode:
        q += " WHERE c.mode = ?"
        args.append(mode)
    q += " ORDER BY c.updated_at DESC LIMIT ?"
    args.append(limit)
    
    with cursor() as cur:
        cur.execute(q, args)
        rows = cur.fetchall()
        
    out = []
    for r in rows:
        d = dict(r)
        d["selected_paper_ids"] = _loads(d.get("selected_paper_ids"), [])
        d["metadata"] = _loads(d.get("metadata"), {})
        out.append(d)
    return out


def update_conversation(conv_id: str, **fields: Any) -> Optional[Dict[str, Any]]:
    if not fields:
        return get_conversation(conv_id)
    init_db()
    cols, vals = [], []
    for k, v in fields.items():
        if k in ("id", "created_at"):
            continue
        cols.append(f"{k} = ?")
        if k in _JSON_CONV_COLUMNS or isinstance(v, (dict, list)):
            vals.append(_dumps(v))
        else:
            vals.append(v)
    cols.append("updated_at = ?")
    vals.append(now())
    vals.append(conv_id)
    
    with transaction() as conn:
        conn.execute(f"UPDATE conversations SET {', '.join(cols)} WHERE id = ?", vals)
    return get_conversation(conv_id)


def delete_conversation(conv_id: str) -> bool:
    init_db()
    with transaction() as conn:
        conn.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
        cur = conn.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
    return cur.rowcount > 0


def add_message(
    conv_id: str,
    role: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
    message_id: Optional[str] = None,
    sequence: Optional[int] = None,
) -> Dict[str, Any]:
    init_db()
    mid = message_id or new_id("msg")
    ts = now()
    meta = metadata or {}
    
    with transaction() as conn:
        # Determine sequence if not explicitly provided
        if sequence is None:
            cur = conn.execute(
                "SELECT COALESCE(MAX(sequence), -1) + 1 AS next_seq FROM messages WHERE conversation_id = ?",
                (conv_id,),
            )
            seq = int(cur.fetchone()["next_seq"])
        else:
            seq = int(sequence)
            
        conn.execute(
            """
            INSERT INTO messages (id, conversation_id, role, content, sequence, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                content=excluded.content, metadata=excluded.metadata
            """,
            (mid, conv_id, role, content, seq, _dumps(meta), ts),
        )
        # Touch conversation updated_at
        conn.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (ts, conv_id))
        
    return {
        "id": mid,
        "conversation_id": conv_id,
        "role": role,
        "content": content,
        "sequence": seq,
        "metadata": meta,
        "created_at": ts,
    }


def get_messages(conv_id: str) -> List[Dict[str, Any]]:
    init_db()
    with cursor() as cur:
        cur.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY sequence ASC, created_at ASC",
            (conv_id,),
        )
        rows = cur.fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["metadata"] = _loads(d.get("metadata"), {})
        out.append(d)
    return out


def delete_message(message_id: str) -> bool:
    init_db()
    with transaction() as conn:
        cur = conn.execute("DELETE FROM messages WHERE id = ?", (message_id,))
    return cur.rowcount > 0

