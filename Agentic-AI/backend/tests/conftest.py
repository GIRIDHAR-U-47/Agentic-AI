"""Shared pytest fixtures.

Every test runs against a **temporary database and data directory**, so the
suite never touches the developer's real corpus or sessions. The corpus itself
is not re-downloaded: tests that need real papers use the PDFs already cached in
`backend/data/corpus/`, and skip cleanly with an explicit reason if the cache is
absent, rather than silently passing on an empty fixture.
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parent.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

# Redirect config's paths *before* importing anything that reads them.
_TMP = tempfile.mkdtemp(prefix="rlens-test-")
os.environ["RLENS_DATA_DIR"] = _TMP
os.environ["RLENS_DB_PATH"] = str(Path(_TMP) / "test.sqlite3")
os.environ["RLENS_EVAL_RESULTS_DIR"] = str(Path(_TMP) / "eval")
os.environ["RLENS_VECTOR_BACKEND"] = "chroma"
os.environ["OPENROUTER_API_KEY"] = ""  # force fake embedder for tests
os.environ["RLENS_LLM_PROVIDER"] = "offline"  # force offline LLM for tests

import config  # noqa: E402
import db  # noqa: E402

config.DATA_DIR = Path(_TMP)
config.CORPUS_DIR = BACKEND / "data" / "corpus"  # read-only reuse of real PDFs
config.DB_PATH = Path(_TMP) / "test.sqlite3"
config.CHROMA_PERSIST_DIR = Path(_TMP) / "chroma"
config.ensure_dirs()

from services import ingest  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _schema() -> None:
    db.reset_db()


@pytest.fixture(autouse=True)
def _corpus_restorer(real_corpus):
    """Re-materialise the real corpus rows after any test that wiped them.

    `real_corpus` is session-scoped (ingested once), but several suites reset
    the database per-test (clean_db / seeded_corpus). Without a restorer, a
    resetting test that runs before a `real_corpus` test leaves that test with
    an empty database and spurious failures. This autouse fixture guarantees
    the corpus rows exist again after every test.
    """
    yield
    present = {d["id"] for d in db.list_documents()}
    for d in real_corpus:
        if d["id"] in present:
            continue
        pdf = config.CORPUS_DIR / f"{d.get('arxiv_id')}.pdf"
        if not pdf.exists():
            continue
        ingest.ingest_pdf(
            pdf.read_bytes(), pdf.name, source="arxiv",
            metadata={"id": d["id"], "arxiv_id": d.get("arxiv_id")},
        )


@pytest.fixture
def clean_db():
    """A database with the schema in place and no rows."""
    db.reset_db()
    yield db
    db.reset_db()


@pytest.fixture(scope="session")
def real_corpus() -> list:
    """Ingest the cached real papers once per session."""
    db.reset_db()
    pdfs = sorted(config.CORPUS_DIR.glob("*.pdf"))
    docs = []
    for p in pdfs:
        try:
            docs.append(
                ingest.ingest_pdf(p.read_bytes(), p.name, source="arxiv",
                                  metadata={"id": f"arxiv_{p.stem.replace('.', '_')}",
                                            "arxiv_id": p.stem})
            )
        except ValueError as exc:  # pragma: no cover
            pytest.fail(f"could not ingest cached corpus PDF {p.name}: {exc}")
    if not docs:
        pytest.skip(
            "No cached corpus PDFs. Run: python scripts/fetch_corpus.py"
        )
    return docs


@pytest.fixture
def seeded_corpus(clean_db):
    """Real corpus rows present in *this* test's database.

    Unlike the session-scoped `real_corpus`, this fixture re-seeds the rows
    after any `clean_db` reset, so it is safe to combine with tests that wipe
    the database (each function-scoped seed is self-healing).
    """
    pdfs = sorted(config.CORPUS_DIR.glob("*.pdf"))
    docs = []
    for p in pdfs:
        try:
            docs.append(
                ingest.ingest_pdf(p.read_bytes(), p.name, source="arxiv",
                                  metadata={"id": f"arxiv_{p.stem.replace('.', '_')}",
                                            "arxiv_id": p.stem})
            )
        except ValueError as exc:  # pragma: no cover
            pytest.fail(f"could not ingest cached corpus PDF {p.name}: {exc}")
    if not docs:
        pytest.skip(
            "No cached corpus PDFs. Run: python scripts/fetch_corpus.py"
        )
    return docs


@pytest.fixture
def corpus(real_corpus):
    """Read-only view of the ingested real corpus."""
    return real_corpus


@pytest.fixture
def chunks(real_corpus):
    return db.get_chunks([d["id"] for d in real_corpus])
