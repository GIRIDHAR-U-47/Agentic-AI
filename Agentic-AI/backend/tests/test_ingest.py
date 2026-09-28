"""Ingestion tests: extraction, running-head removal, dedup, and prose scoring."""
from __future__ import annotations

import pytest

import db
from services import ingest


# --- running heads -------------------------------------------------------
def test_running_heads_only_matches_page_edges():
    """The bug this guards against is destructive.

    Scanning every line of every page matched recurring table cells and deleted
    100 real benchmark values (`0.249`, `ETTh2`, `192`) from the results tables.
    Running heads live at the top and bottom of a page; table cells do not.
    """
    body = "A real sentence of prose that carries a value like 0.249 for ETTh2."
    pages = {
        1: "Published as a conference paper at ICLR 2023\n" + body,
        2: "Published as a conference paper at ICLR 2023\n" + body,
        3: "Published as a conference paper at ICLR 2023\n" + body,
    }
    heads = ingest.find_running_heads(pages)
    assert "Published as a conference paper at ICLR 2023" in heads
    assert not any("0.249" in h for h in heads)
    assert not any("ETTh2" in h for h in heads)


def test_running_heads_ignore_sentences():
    pages = {p: "This is a complete sentence.\n" for p in range(1, 6)}
    assert ingest.find_running_heads(pages) == set()


def test_bare_page_numbers_are_caught():
    """A repeated bare page number at a page edge is a running head."""
    pages = {p: "- 3 -\nBody of the page with plenty of words in it." for p in range(1, 8)}
    assert "- 3 -" in ingest.find_running_heads(pages)


def test_unique_page_numbers_are_not_treated_as_running_heads():
    """Each page number appears once, so none of them is a *running* head.

    Getting this wrong would strip legitimate content from every page.
    """
    pages = {p: f"{p}\nBody of the page with plenty of words in it." for p in range(1, 8)}
    assert ingest.find_running_heads(pages) == set()


def test_short_document_is_left_alone():
    assert ingest.find_running_heads({1: "a", 2: "b"}) == set()


# --- section assignment --------------------------------------------------
def test_section_is_the_earliest_heading_on_the_page():
    """Pattern-list order used to win, so a page that merely *mentions*
    "5. Results" in its body was tagged Results and drew the wrong boost."""
    pages = {
        1: (
            "1 Introduction\n"
            "Some introductory text long enough to become a real chunk here.\n\n"
            "5 Results\n"
            "We compare against strong baselines on eight datasets over the "
            "standard long-horizon forecasting protocol used in the literature."
        ),
    }
    _, chunks = ingest.build_sections_and_chunks(pages, "doc_x")
    assert chunks
    assert chunks[0]["section"] == "1. Introduction", chunks[0]["section"]


# --- prose scoring -------------------------------------------------------
def test_prose_score_separates_prose_from_debris():
    prose = (
        "We decompose the time series into patches and project each patch into "
        "a token, which reduces the effective sequence length seen by attention."
    )
    debris = "0.249 0.238 0.302 0.379 0.397 ETTh2 96 720 Models"
    assert ingest.prose_score(prose) > 0.8
    assert ingest.prose_score(debris) < 0.3


def test_prose_score_is_bounded():
    for text in ("", "x", "a b c", "1 2 3 4 5"):
        assert 0.0 <= ingest.prose_score(text) <= 1.0


# --- dedup ---------------------------------------------------------------
def test_same_bytes_ingest_once(real_corpus):
    import config

    before = len(db.list_documents())
    again = ingest.ingest_pdf(
        (config.CORPUS_DIR / "2211.14730.pdf").read_bytes(),
        "2211.14730.pdf",
        source="arxiv",
        metadata={"arxiv_id": "2211.14730"},
    )
    assert len(db.list_documents()) == before, "re-ingesting identical bytes must be a no-op"
    assert again["duplicate"] is True


def test_different_papers_get_different_ids(real_corpus):
    ids = {d["id"] for d in real_corpus}
    assert len(ids) == len(real_corpus)


# --- real corpus shape ---------------------------------------------------
def test_ingest_produces_usable_chunks(real_corpus):
    assert len(real_corpus) >= 1
    for d in real_corpus:
        chunks = db.get_chunks([d["id"]])
        assert chunks, f"{d['id']} produced no chunks"
        assert all(len(c["text"]) >= 50 for c in chunks)
        assert all(c["page"] is not None for c in chunks)


def test_ingest_rejects_non_pdf():
    with pytest.raises(ValueError):
        ingest.ingest_pdf(b"not a pdf", "paper.txt")


def test_scanned_pdf_raises_rather_than_indexing_blanks():
    with pytest.raises(ValueError) as exc:
        ingest.ingest_pdf(b"%PDF-1.4\n" + b"\x00" * 4000, "scan.pdf")
    assert "text" in str(exc.value).lower() or "scan" in str(exc.value).lower()


def test_metadata_overrides_extracted_title(real_corpus):
    """Authoritative metadata must win over whatever the PDF header guessed.

    The bundled PatchTST PDF yields a title of `A TIME SERIES IS WORTH 64 WORDS:`
    from the text layer; the arXiv title is the authoritative one.
    """
    doc = db.get_document("arxiv_2211_14730")
    assert doc is not None
    assert "64 WORDS" in (doc["title"] or "").upper()
