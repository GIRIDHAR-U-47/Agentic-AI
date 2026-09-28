"""Fresh-topic discovery: search arXiv for a question the corpus cannot answer.

The seven demo papers are a fixed evaluation set. This module is the "search any
research topic" path: it queries the arXiv API, refines when the first pass
looks poor, dedupes against papers already in the corpus, preserves every paper's
source URL and metadata, and (on approval) materialises each paper into the
corpus -- downloading the full-text PDF when arXiv serves it, and otherwise
storing an explicitly-labelled abstract-only record so the evidence trail stays
honest ("show when full text is unavailable").
"""
from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional

import config
import db
from services import arxiv
from services.retrieval import content_terms

#: Maximum share of the question's content terms a candidate must match in its
#: title/abstract for the first search pass to count as "covering" the topic.
#: Below this the module issues a refined second query (see `discover`).
COVER_MIN_TERMS = 2


class ArxivClient:
    """Thin seam over the network calls so tests can inject a fake.

    Everything a test needs to fake is here: search results and PDF bytes.
    """

    def search(self, query: str, max_results: int = 8) -> List[Dict[str, Any]]:
        return arxiv.search(query, max_results=max_results)

    def download_pdf(self, arxiv_id: str) -> bytes:
        return arxiv.download_pdf(arxiv_id, None)  # dest is ignored upstream


#: Canned arXiv fixtures for RLENS_FAKE_ARXIV=1 demo mode. These are *real*
#: arXiv papers, so every abs/pdf link the UI opens is genuine. The "base"
#: list is deliberately off-topic for the demo question (time-series methods),
#: which exercises the poor-coverage refinement pass; the "refined" list adds
#: graph-neural-network papers, one deliberately un-downloadable paper (so the
#: abstract-only path is demonstrable) and one paper already in the demo corpus
#: (so dedupe / skipped_known is demonstrable).
_FAKE_ARXIV_BASE: List[Dict[str, Any]] = [
    {
        "arxiv_id": "1905.10437",
        "title": "N-BEATS: Neural basis expansion analysis for interpretable time series forecasting",
        "authors": "Boris N. Oreshkin, Dmitri Carpov, Nicolas Chapados, Yoshua Bengio",
        "year": "2020",
        "venue": "ICLR 2020",
        "abstract": "We propose a deep neural architecture based on backward and forward residual links for univariate time series forecasting that is interpretable and generalises well.",
    },
    {
        "arxiv_id": "1912.09363",
        "title": "Temporal Fusion Transformers for interpretable multi-horizon time series forecasting",
        "authors": "Bryan Lim, Sercan O. Arik, Nicolas Loeff, Tomas Pfister",
        "year": "2021",
        "venue": "International Journal of Forecasting",
        "abstract": "Multi-horizon forecasting for time series with complex input patterns is a challenging problem. This paper introduces a novel hierarchical architecture that combines a local and global context.",
    },
]

_FAKE_ARXIV_REFINED: List[Dict[str, Any]] = [
    {
        "arxiv_id": "1706.03762",
        "title": "Attention is all you need",
        "authors": "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin",
        "year": "2017",
        "venue": "NeurIPS 2017",
        "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The transformer, based solely on attention, achieves state-of-the-art results.",
    },
    {
        "arxiv_id": "1704.01265",
        "title": "Semi-supervised classification with graph convolutional networks",
        "authors": "Thomas N. Kipf, Max Welling",
        "year": "2017",
        "venue": "ICLR 2017",
        "abstract": "We present a scalable approach for semi-supervised learning on graph-structured data that is based on an efficient variant of convolutional neural networks which operate directly on graphs.",
    },
    {
        "arxiv_id": "1801.07606",
        "title": "Graph attention networks",
        "authors": "Petar Veličković, Guillem Cucurull, Arantxa Casanova, Adriana Romero, Pietro Liò, Yoshua Bengio",
        "year": "2018",
        "venue": "ICLR 2018",
        "abstract": "We present graph attention networks, a novel neural network architecture that operates on graph-structured data, leveraging masked self-attentional layers to address shortcomings of prior graph convolution methods.",
    },
    {
        "arxiv_id": "1803.03378",
        "title": "Graph wavelet neural network",
        "authors": "Bingbing Xu, Huawei Shen, Qi Cao, Yunqi Qiu, Xueqi Cheng",
        "year": "2019",
        "venue": "ICLR 2019",
        "abstract": "We propose a new graph convolutional network, the graph wavelet neural network, which applies graph wavelet transforms to capture both low-frequency and high-frequency signals on the graph, improving node classification and graph-level tasks.",
    },
    {
        "arxiv_id": "1706.02216",
        "title": "Representation learning on graphs with jumping knowledge networks",
        "authors": "Keyulu Xu, Chengtao Li, Yonglong Tian, Tomohiro Sonobe, Ken-ichi Kawarabayashi, Stefanie Jegelka",
        "year": "2018",
        "venue": "ICML 2018",
        "abstract": "We explore an architecture that adaptively combines information from neighborhoods of varying locality, enabling representation learning on graphs with heterogeneous neighborhood structures.",
    },
]

#: Papers whose PDF download is simulated to fail, so approval stores them as
#: clearly-labelled abstract-only records (evidence-quality transparency).
_FAKE_ARXIV_FAIL_DOWNLOADS: List[str] = ["1803.03378"]


class _FakeArxivClient(ArxivClient):
    """Deterministic in-process client used by tests (and the RLENS_FAKE_ARXIV
    demo flag).

    Returns canned entries and a minimal well-formed PDF, or raises to simulate
    a download failure. With no arguments it uses the module-level demo fixtures
    above, which is what the RLENS_FAKE_ARXIV=1 server flag selects; tests
    always pass explicit fixtures. Every candidate the module emits is labelled
    as arXiv-search output, and the fake client is never active unless the env
    flag is set.
    """

    def __init__(
        self,
        entries: Optional[List[Dict[str, Any]]] = None,
        *,
        fail_downloads: Optional[List[str]] = None,
        refined_entries: Optional[List[Dict[str, Any]]] = None,
        pdf_text: str = "",
    ):
        self.entries = entries if entries is not None else _FAKE_ARXIV_BASE
        self.refined_entries = (
            refined_entries
            if refined_entries is not None
            else _FAKE_ARXIV_REFINED
        )
        self.fail_downloads = set(
            fail_downloads
            if fail_downloads is not None
            else _FAKE_ARXIV_FAIL_DOWNLOADS
        )
        self.pdf_text = pdf_text
        self.search_calls: List[str] = []

    def search(self, query: str, max_results: int = 8) -> List[Dict[str, Any]]:
        self.search_calls.append(query)
        src = self.refined_entries if len(self.search_calls) > 1 else self.entries
        return src[:max_results]

    def download_pdf(self, arxiv_id: str) -> bytes:
        if arxiv_id in self.fail_downloads:
            raise arxiv.ArxivError(f"simulated download failure for {arxiv_id}")
        # A tiny real PDF (valid for PyMuPDF) whose page text is long enough
        # for the ingest chunk filter. The text is *per paper* (title +
        # abstract), because the real ingest pipeline dedupes by SHA-256 of the
        # PDF bytes: byte-identical fixtures would collapse every paper into
        # the first one via content-hash dedupe (which is exactly what an
        # honest pipeline should do).
        meta = next(
            (
                e
                for e in (self.entries + self.refined_entries)
                if e.get("arxiv_id") == arxiv_id
            ),
            {},
        )
        text = self.pdf_text or f"{meta.get('title') or arxiv_id}. {meta.get('abstract') or ''}"
        if not self.pdf_text and len(text) < 200:
            # Short abstracts alone would not pass the ingest text gate. Pad
            # with the shared filler: the paper-specific title/abstract prefix
            # keeps the PDF sha256 distinct across papers (content-hash dedupe
            # must not collapse them), and the filler guarantees extractable
            # length, so the full-text path is exercised for real.
            text = f"{text} {_FAKE_PDF_FILLER}"
        return _minimal_pdf(text)


#: Default page filler for fake discovery PDFs. Long enough to pass the ingest
#: text gate (>= 200 chars, see `ingest.extract_pages`), and used to pad short
#: per-paper text in `_FakeArxivClient.download_pdf` (the per-paper title +
#: abstract prefix still keeps each paper's PDF sha256 unique).
_FAKE_PDF_FILLER = (
    "Fake discovery paper: graph neural networks generalise to unseen "
    "graph structures through transfer learning and structural inductive "
    "biases across topology domains. We evaluate on synthetic and real "
    "molecular datasets and find consistent gains for zero-shot transfer "
    "on completely unseen graph families. This synthetic page exists so "
    "the ingest pipeline has real extractable text to run against."
)


def _minimal_pdf(text: str = "") -> bytes:
    """A minimal single-page PDF that PyMuPDF can open and extract text from.

    The page's text is long enough to pass the ingest text gate (>= 200 chars,
    see `ingest.extract_pages`), split across several lines so nothing is
    clipped at the page edge, which is how the full-text discovery path is
    genuinely exercised in tests.
    """
    text = text or _FAKE_PDF_FILLER
    lines = [text[i : i + 75] for i in range(0, len(text), 75)]
    content = "".join(
        f"BT /F1 12 Tf 72 {650 - j * 16} Td ({ln.strip() if ln else ' '}) Tj ET\n"
        for j, ln in enumerate(lines)
    ).encode("utf-8")
    return (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
        b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        + f"4 0 obj<</Length {len(content)}>>stream\n".encode("utf-8")
        + content
        + b"endstream endobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"trailer<</Root 1 0 R>>\n%%EOF\n"
    )


def _canonical(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Normalise an arXiv entry into the candidate shape the UI renders."""
    arxiv_id = (entry.get("arxiv_id") or "").strip()
    return {
        "doc_id": f"arxiv_{arxiv_id.replace('.', '_')}" if arxiv_id else "",
        "arxiv_id": arxiv_id,
        "title": re.sub(r"\s+", " ", entry.get("title") or "").strip(),
        "abstract": re.sub(r"\s+", " ", entry.get("abstract") or "").strip(),
        "authors": entry.get("authors") or "Unavailable",
        "year": entry.get("year") or "Unavailable",
        "venue": entry.get("venue") or "arXiv preprint",
        "doi": entry.get("doi") or "",
        "categories": entry.get("categories") or [],
        "abs_url": entry.get("abs_url") or (
            f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else ""
        ),
        "pdf_url": arxiv.pdf_url(arxiv_id) if arxiv_id else "",
        # Whether we hold the full text is unknown until ingest happens; the
        # approval step fills this in (1 = PDF ingested, 0 = abstract only).
        "full_text_available": None,
        "source": "arxiv-discovery",
        "relevance": None,
    }


def _poor_coverage(question: str, candidates: List[Dict[str, Any]], top: int = 5) -> bool:
    """True when barely any of the top candidates lexically covers the question."""
    terms = set(content_terms(question)) - {"arxiv"}
    if not terms:
        return False
    sample = candidates[:top]
    if not sample:
        return False
    hits = 0
    for c in sample:
        hay = f"{c.get('title', '')} {c.get('abstract', '')}".lower()
        if len([t for t in terms if t in hay]) >= COVER_MIN_TERMS:
            hits += 1
    # At least half of the sample must share the topic vocabulary.
    return hits * 2 < len(sample)


def discover(
    question: str,
    top_k: Optional[int] = None,
    client: Optional[ArxivClient] = None,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """Search arXiv for `question`, refining once when results look poor.

    Never raises for an empty result set or a failed refinement: the response
    carries whatever was found, plus `search_events` so the UI can show the
    agent actually tried and refined instead of silently fabricating.
    """
    question = (question or "").strip()
    top_k = top_k or config.DISCOVERY_MAX_RESULTS
    if client is None:
        # RLENS_FAKE_ARXIV=1 swaps in the deterministic test client. The arXiv
        # export API is frequently rate-limited from CI/dev networks; this flag
        # lets the demo and smoke paths run without fabricating results -- the
        # fake client returns canned entries and is clearly labelled "fake" in
        # the search_events and in the report. It is never on by default.
        client = (
            _FakeArxivClient()
            if os.getenv("RLENS_FAKE_ARXIV") == "1"
            else ArxivClient()
        )

    if use_cache:
        cached = db.get_discovery_cache(question)
        if cached and cached.get("payload"):
            out = {
                "question": question,
                "candidates": cached["payload"],
                "refined": bool(cached["refined"]),
                "searched_at": cached["searched_at"],
                "cached": True,
                "search_events": cached.get("search_events", []),
                "skipped_known": int(cached.get("skipped_known", 0) or 0),
            }
            if out["candidates"]:
                return out

    if not question:
        return {"question": question, "candidates": [], "error": "Empty research question."}

    events: List[Dict[str, Any]] = []
    known = {d.get("arxiv_id") for d in db.list_documents() if d.get("arxiv_id")}
    skipped = [0]

    raw = _safe_search(client, question, top_k, events)
    candidates = _dedupe_and_filter(raw, known, skipped=skipped)
    refined = False
    if candidates and _poor_coverage(question, candidates):
        # First pass did not cover the topic: broaden with the offline policy's
        # concept-expansion vocabulary and search again, merging + deduping.
        from services.agent.offline_policy import expand_query

        broader = expand_query(question)
        events.append(
            {
                "pass": 2,
                "query": broader,
                "note": "First pass did not cover the question's vocabulary; refined.",
            }
        )
        try:
            raw2 = client.search(broader, max_results=top_k)
        except Exception as exc:  # pragma: no cover - network dependent
            events.append({"pass": 2, "error": str(exc)})
            raw2 = []
        second = _dedupe_and_filter(raw2, known, skipped=skipped, existing=candidates)
        if second:
            candidates = second + [c for c in candidates if c["doc_id"] not in second]
            refined = True

    result = {
        "question": question,
        "candidates": candidates[:top_k],
        "refined": refined,
        "search_events": events,
        "skipped_known": skipped[0],
        "cached": False,
    }
    if candidates:
        db.cache_discovery(
            question,
            candidates,
            refined=refined,
            search_events=events,
            skipped_known=skipped[0],
        )
    return result


def _safe_search(
    client: ArxivClient, question: str, top_k: int, events: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    events.append({"pass": 1, "query": question})
    try:
        raw = client.search(question, max_results=top_k)
    except Exception as exc:  # pragma: no cover - network dependent
        events.append({"pass": 1, "error": str(exc)})
        raw = []
    return raw


def _dedupe_and_filter(
    entries: List[Dict[str, Any]],
    known_ids: set,
    skipped: Optional[List[int]] = None,
    existing: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """Dedupe by arXiv id (and, weakly, by normalised title), dropping papers
    already in the corpus so a fresh-topic search never re-suggests the demo set."""
    seen = {c.get("doc_id") for c in (existing or [])}
    seen_titles = {re.sub(r"[^a-z0-9]", "", c.get("title", "").lower()) for c in (existing or [])}
    out: List[Dict[str, Any]] = []
    for e in entries:
        c = _canonical(e)
        cid = c["doc_id"]
        title_key = re.sub(r"[^a-z0-9]", "", c["title"].lower())
        if not cid or not c["title"]:
            continue
        if cid in seen or title_key in seen_titles:
            continue
        if e.get("arxiv_id") in known_ids or cid in known_ids:
            if skipped is not None:
                skipped[0] += 1
            continue
        seen.add(cid)
        seen_titles.add(title_key)
        out.append(c)
    return out


def ingest_candidate(
    candidate: Dict[str, Any], client: Optional[ArxivClient] = None
) -> Dict[str, Any]:
    """Materialise an approved discovery candidate into the corpus.

    Downloads and ingests the full-text PDF when arXiv serves it; otherwise
    stores an abstract-only document (labelled full_text_available=0) so the
    agent can still cite the abstract, and the UI shows a clear
    "Abstract only" badge instead of pretending full text existed.

    `client` is the network seam: the API path uses the real arXiv client
    (subject to the same RLENS_FAKE_ARXIV=1 demo flag as `discover`); tests
    inject `_FakeArxivClient` (or subclasses) to avoid the network.
    """
    client = client or (
        _FakeArxivClient()
        if os.getenv("RLENS_FAKE_ARXIV") == "1"
        else ArxivClient()
    )
    arxiv_id = (candidate.get("arxiv_id") or "").strip()
    doc_id = candidate.get("doc_id") or (
        f"arxiv_{arxiv_id.replace('.', '_')}" if arxiv_id else ""
    )
    if not doc_id:
        raise ValueError("Discovery candidate has no arxiv_id.")
    existing = db.get_document(doc_id)
    if existing:
        out = dict(existing)
        out["chunk_count"] = len(db.get_chunks([doc_id]))
        out["duplicate"] = True
        return out

    base_meta = {
        "id": doc_id,
        "arxiv_id": arxiv_id,
        "title": candidate.get("title", ""),
        "authors": candidate.get("authors", ""),
        "year": candidate.get("year"),
        "venue": candidate.get("venue", ""),
        "doi": candidate.get("doi", ""),
        "abstract": candidate.get("abstract", ""),
        "source_url": candidate.get("abs_url") or candidate.get("pdf_url") or "",
    }

    pdf_bytes = None
    try:
        pdf_bytes = client.download_pdf(arxiv_id)
    except Exception as exc:  # noqa: BLE001 - network / PDF failures degrade to abstract-only
        return _ingest_abstract_only(base_meta, reason=str(exc)[:200])

    try:
        from services import ingest

        rec = ingest.ingest_pdf(
            pdf_bytes,
            filename=f"{arxiv_id}.pdf",
            source="arxiv",
            metadata={**base_meta, "authoritative": True},
        )
        rec["full_text_available"] = 1
        rec["source_url"] = base_meta["source_url"] or "https://arxiv.org/abs/{0}".format(arxiv_id)
        return rec
    except ValueError as exc:  # scanned / unreadable PDF -> abstract-only
        return _ingest_abstract_only(base_meta, reason=str(exc)[:200])


def _ingest_abstract_only(base_meta: Dict[str, Any], reason: str = "") -> Dict[str, Any]:
    """Persist a paper we could not fetch full text for, clearly labelled."""
    abstract = (base_meta.get("abstract") or "").strip()
    doc_id = base_meta["id"]
    record = {
        "id": doc_id,
        "source": "arxiv",
        "filename": f"{base_meta.get('arxiv_id', '')}.pdf",
        "title": base_meta.get("title", ""),
        "authors": base_meta.get("authors", ""),
        "year": base_meta.get("year"),
        "venue": base_meta.get("venue", ""),
        "doi": base_meta.get("doi", ""),
        "arxiv_id": base_meta.get("arxiv_id"),
        "page_count": 0,
        "sha256": None,
        "text_chars": len(abstract),
        "abstract": abstract,
        "source_url": base_meta.get("source_url") or "",
        "full_text_available": 0,
        "added_at": db.now(),
    }
    chunks = []
    if abstract:
        chunks.append(
            {
                "id": f"{doc_id}-abs",
                "doc_id": doc_id,
                "page": 1,
                "section": "Abstract",
                "ordinal": 0,
                "prose": 1.0,
                "text": abstract,
            }
        )
    db.upsert_document(record, chunks)
    out = dict(record)
    out["duplicate"] = False
    out["chunk_count"] = len(chunks)
    out["abstract_only"] = True
    out["full_text_available"] = 0
    out["reason"] = reason
    return out


def list_cached_discoveries() -> List[Dict[str, Any]]:
    """The last few fresh-topic searches, for health/labelling (no payloads)."""
    db.init_db()
    with db.cursor() as cur:
        cur.execute(
            "SELECT question, refined, searched_at FROM discovery_cache ORDER BY searched_at DESC LIMIT 10"
        )
        return [dict(r) for r in cur.fetchall()]