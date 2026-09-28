"""PDF ingestion: real text extraction, section detection, chunking.

This is the teammate's original `PDFRAGService` extraction path, extracted into
its own module so that it can be reused by the corpus fetcher and tested on its
own. The behaviour is preserved deliberately:

* PyMuPDF (`fitz`) is the parser.
* Uploads are de-duplicated by SHA-256 of the file bytes.
* Scanned / image-only PDFs raise a clear error instead of silently indexing
  placeholder text.
* No fabricated content is ever inserted: if text cannot be extracted, the
  upload fails.

Two changes were required:
1. Results are persisted to SQLite instead of an in-memory dict, so a restart
   does not destroy the corpus.
2. Authoritative metadata (from the arXiv API) can now override the
   first-page regex heuristics, which are a genuine source of wrong titles.
"""
from __future__ import annotations

import hashlib
import re
from typing import Any, Dict, List, Optional, Tuple

import db

try:  # pragma: no cover - import guard
    # `pymupdf` is the current module name; `fitz` is the legacy alias and now
    # emits a deprecation warning on import. Support both for older installs.
    try:
        import pymupdf as fitz
    except ImportError:
        import fitz  # type: ignore[no-redef]

    PYMUPDF_AVAILABLE = True
except ImportError:  # pragma: no cover
    fitz = None
    PYMUPDF_AVAILABLE = False


# --- Section detection ----------------------------------------------------
SECTION_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"(?i)^\s*abstract\s*$", re.M), "Abstract"),
    (re.compile(r"(?i)^\s*(?:\d\.?\s*)?introduction\s*$", re.M), "1. Introduction"),
    (re.compile(
        r"(?i)^\s*(?:\d\.?\s*)?(?:related work|literature review|background)\s*$", re.M
    ), "2. Related Work"),
    (re.compile(
        r"(?i)^\s*(?:\d\.?\s*)?(?:methodology|proposed method|method|model|framework|"
        r"approach|system design|architecture|our approach)\s*$", re.M
    ), "3. Methodology"),
    (re.compile(
        r"(?i)^\s*(?:\d\.?\s*)?(?:experiment|experimental setup|experiments|implementation|"
        r"dataset|datasets|benchmark|evaluation)\s*$", re.M
    ), "4. Experiments & Setup"),
    (re.compile(
        r"(?i)^\s*(?:\d\.?\s*)?(?:result|results|performance|empirical|discussion|"
        r"analysis|experiments and results)\s*$", re.M
    ), "5. Results & Discussion"),
    (re.compile(
        r"(?i)^\s*(?:\d\.?\s*)?(?:limitation|limitations|threat|constraint|future work|"
        r"research gap|discussion and conclusion)\s*$", re.M
    ), "6. Limitations & Gaps"),
    (re.compile(
        r"(?i)^\s*(?:\d\.?\s*)?(?:conclusion|conclusions|summary|concluding|"
        r"conclusion and future work)\s*$", re.M
    ), "7. Conclusion"),
    (re.compile(r"(?i)^\s*(?:references|bibliography)\s*$", re.M), "References"),
]

# Boilerplate that shows up on page 1 and must never become the paper title.
_TITLE_BOILERPLATE = re.compile(
    r"(?i)\b(arxiv|preprint|under review|proceedings|conference|workshop|"
    r"copyright|license|doi|abstract|introduction|submitted|published|"
    r"ieee|acm|springer|elsevier|neurips|iclr|icml|aaai|issn|isbn)\b"
)


def _clean(text: str) -> str:
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text or "").strip()


def extract_pages(file_bytes: bytes, filename: str) -> Tuple[Dict[int, str], int]:
    """Return {page_number: text} plus the page count. Raises ValueError on failure."""
    if not PYMUPDF_AVAILABLE:
        raise ValueError(
            "PyMuPDF (fitz) is not installed. Run: pip install pymupdf"
        )
    pages: Dict[int, str] = {}
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as pdf:
            page_count = len(pdf)
            if page_count == 0:
                raise ValueError(f"'{filename}' is an empty PDF (0 pages).")
            for i in range(page_count):
                txt = _clean(pdf[i].get_text("text"))
                if txt:
                    pages[i + 1] = txt
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Failed to extract text from '{filename}': {exc}") from exc

    if sum(len(t) for t in pages.values()) < 200:
        raise ValueError(
            f"'{filename}' appears to be a scanned or image-only PDF. No machine-readable "
            "text could be extracted. Please OCR the file before uploading."
        )
    return pages, page_count


# --- Metadata heuristics (used only when no authoritative metadata exists) --
def guess_title(first_page: str, filename: str) -> str:
    fallback = re.sub(r"\.pdf$", "", filename, flags=re.I).replace("_", " ").strip()
    if not first_page:
        return fallback or "Untitled document"
    lines = [l.strip() for l in first_page.split("\n") if len(l.strip()) > 3]
    cands: List[str] = []
    # Try the first few non-boilerplate lines, preferring longer title-like text.
    for line in lines[:12]:
        if _TITLE_BOILERPLATE.search(line) and len(line) < 80:
            continue
        if re.fullmatch(r"[\d\s.,:;()\[\]/-]+", line):
            continue
        cands.append(line)
    if not cands:
        return fallback or "Untitled document"
    # The title is usually the longest early line that is not an author list.
    for c in cands[:6]:
        if 20 <= len(c) <= 220 and not re.match(r"(?i)^(by\s|authors?\s)", c):
            return c[:220]
    best = max(cands[:6], key=len)
    return (best[:220] + "...") if len(best) > 220 else best


def guess_authors(first_page: str) -> str:
    """Best-effort author line, or `""` when the PDF does not make it obvious.

    An empty string, not a placeholder word: `"Unavailable"` stored in the
    documents table reads like an author name three layers downstream, where it
    ends up in a BibTeX entry or a comparison table as if it were metadata.
    """
    if not first_page:
        return ""
    lines = [l.strip() for l in first_page.split("\n") if 3 < len(l.strip()) < 250]
    for line in lines[:14]:
        if re.search(
            r"(?i)\b(abstract|introduction|doi|journal|ieee|acm|arxiv|springer|copyright|"
            r"all rights|preprint|keywords|index terms)\b",
            line,
        ):
            continue
        # An author list has commas, 'and', or capitalised full names.
        if re.search(r",|\band\b|[A-Z][a-z]+\s+[A-Z]", line) and not line.endswith(":"):
            return line[:250]
    return ""


def guess_year(first_page: str) -> str:
    """Publication year, or `""` when absent. Never guessed from the filename."""
    m = re.search(r"\b(19[89]\d|20[0-4]\d)\b", first_page)
    return m.group(1) if m else ""


def guess_doi(first_page: str) -> str:
    """DOI printed in the PDF, or `""`.

    A PDF usually carries no DOI at all, so this is empty for most of the
    corpus. That is the point: R-Lens records a DOI only when the document
    actually prints one, and never infers one from the title or arXiv id.
    """
    m = re.search(r"\b(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)\b", first_page)
    return m.group(1) if m else ""


def guess_venue(first_page: str) -> str:
    m = re.search(
        r"(?i)\b(IEEE|ACM|Springer|Elsevier|Nature|Science|NeurIPS|ICLR|AAAI|ICML|"
        r"arXiv|KDD|AAAI|IJCAI|Proceedings of [A-Za-z\s]{3,40}|"
        r"Journal of [A-Za-z\s]{3,40}|Transactions on [A-Za-z\s]{3,40})\b",
        first_page,
    )
    return m.group(0).strip() if m else "Uploaded Research Document"


def extract_abstract(pages: Dict[int, str]) -> str:
    """Best-effort abstract capture from the earliest pages."""
    head = " ".join(pages.get(p, "") for p in sorted(pages)[:2])
    m = re.search(
        r"(?is)\babstract\b[\s:.—-]*(.{200,4000}?)(?:\n\s*\n|\bkeywords?\b|\bindex terms\b|"
        r"\b1\.?\s*introduction\b|\bI\.?\s*INTRODUCTION\b)",
        head,
    )
    if m:
        txt = re.sub(r"\s+", " ", m.group(1)).strip()
        if len(txt) > 120:
            return txt[:2500]
    return ""


# --- Section + chunk construction ----------------------------------------
def find_running_heads(pages: Dict[int, str], min_ratio: float = 0.3) -> set:
    """Identify repeating page headers/footers so they can be stripped.

    Every page of PatchTST begins with `Published as a conference paper at ICLR
    2023`, and the AST/PatchTST pages carry the running head on each page. These
    lines are short, so PyMuPDF emits them as standalone blocks, and because
    they are repeated they score *well* on term frequency for queries that share
    their vocabulary ("conference paper", "time series"). Left in place they
    pushed genuine methodology text out of the top-k.

    Position is the key signal, and getting it wrong is destructive. A first
    attempt scanned *every* line of *every* page, which also matched recurring
    table cells -- it stripped 100 real values such as `0.249`, `ETTh2` and
    `192` out of the results tables, destroying the benchmark numbers. Running
    heads live in the first or last couple of lines of a page; table cells do
    not. So only those edge lines are considered, and a candidate must also be
    header-*shaped*: no terminal sentence punctuation, and either a bare page
    number or a short run of words with no verb.
    """
    if len(pages) < 3:
        return set()
    threshold = max(2, int(len(pages) * min_ratio))
    counts: Dict[str, int] = {}
    for text in pages.values():
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in set(lines[:2]) | set(lines[-2:]):
            if not (0 < len(line) <= 120):
                continue
            if re.search(r"[.!?;]$", line):
                continue  # a sentence, not a header
            if re.fullmatch(r"[\d\s\-–—|/.,:]+", line):  # bare page number
                counts[line] = counts.get(line, 0) + 1
                continue
            words = line.split()
            if 1 <= len(words) <= 12 and not re.search(
                r"\b(?:is|are|was|were|we|our|show|shows|propose|use|used|"
                r"consider|considering|results?|figure|table|dataset)\b",
                line,
                re.I,
            ):
                counts[line] = counts.get(line, 0) + 1

    # A lone capitalised word is a table column header, not a running head.
    heads = {line for line, n in counts.items() if n >= threshold}
    return {line for line in heads if not re.fullmatch(r"[A-Z][A-Za-z]{0,14}", line)}


def build_sections_and_chunks(
    pages: Dict[int, str], doc_id: str
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    sections: List[Dict[str, Any]] = []
    chunks: List[Dict[str, Any]] = []
    seen_sections: set = set()
    current = "Document Body"
    ordinal = 0

    running_heads = find_running_heads(pages)
    for page in sorted(pages):
        page_text = pages[page]
        if running_heads:
            page_text = "\n".join(
                l for l in page_text.split("\n") if l.strip() not in running_heads
            )
        # Pick the heading that occurs EARLIEST on the page, not the first in
        # SECTION_PATTERNS order. Iterating the pattern list and breaking on the
        # first hit mislabels pages: a page whose body mentions "5. Results"
        # while its actual heading is "3. Methodology" was being tagged as
        # Results, which then attracted the wrong section boost at retrieval.
        best: Optional[Tuple[int, str]] = None
        for pat, name in SECTION_PATTERNS:
            m = pat.search(page_text)
            if m and (best is None or m.start() < best[0]):
                best = (m.start(), name)
        if best:
            current = best[1]
            key = (current, page)
            if key not in seen_sections:
                seen_sections.add(key)
                preview = page_text[:200]
                sections.append(
                    {
                        "id": f"sec-{doc_id}-p{page}-{len(sections) + 1}",
                        "title": current,
                        "page": page,
                        "content_preview": preview + ("..." if len(preview) >= 200 else ""),
                    }
                )

        for para in re.split(r"\n{2,}", page_text):
            para = para.strip()
            if len(para) < 60:
                continue
            if re.fullmatch(r"[\d\s\W]+", para):
                continue
            for sub in split_chunks(para):
                sub = sub.strip()
                if len(sub) < 50:
                    continue
                chunks.append(
                    {
                        "id": f"chk-{doc_id}-{ordinal:05d}",
                        "page": page,
                        "section": current,
                        "ordinal": ordinal,
                        "text": sub,
                        "prose": prose_score(sub),
                    }
                )
                ordinal += 1

    if not sections:
        for page in sorted(pages):
            preview = pages[page][:200]
            sections.append(
                {
                    "id": f"sec-{doc_id}-page{page}",
                    "title": f"Page {page}",
                    "page": page,
                    "content_preview": preview + ("..." if len(preview) >= 200 else ""),
                }
            )
    if not chunks:
        # Last-resort: index whole pages so the document is still retrievable.
        for page in sorted(pages):
            text = pages[page]
            if len(text) < 50:
                continue
            for sub in split_chunks(text):
                chunks.append(
                    {
                        "id": f"chk-{doc_id}-{ordinal:05d}",
                        "page": page,
                        "section": current,
                        "ordinal": ordinal,
                        "text": sub.strip(),
                        "prose": prose_score(sub),
                    }
                )
                ordinal += 1
    return sections, chunks


def prose_score(text: str) -> float:
    """Heuristic 0..1 score for "is this real prose rather than PDF debris".

    Calibrated against the bundled corpus, where 26% of chunks turned out to be
    figure/table layout fragments such as::

        Raw
        Series
        Embedded
        Variate Tokens
        Features
        Variate
        0
        E

    Those are useless as citations, and worse, they are *high* BM25 scores
    because they are dense in exactly the rare query terms. Median line length
    turned out to be the single best discriminator (real wrapped paragraphs
    measure 78-111 chars; table/figure debris measures 3-24), while the
    alphabetic-character ratio barely separates the two classes.
    """
    lines = [l.strip() for l in (text or "").split("\n") if l.strip()]
    if not lines:
        return 0.0

    body = " ".join(lines)
    toks = re.findall(r"[A-Za-z0-9]+", body)
    if len(toks) < 12:
        return 0.0

    lens = sorted(len(l) for l in lines)
    med_line = lens[len(lens) // 2]
    num_ratio = sum(t.isdigit() for t in toks) / len(toks)
    short_ratio = sum(len(t) <= 2 for t in toks) / len(toks)
    alpha = sum(c.isalpha() for c in body)
    nonspace = sum(1 for c in body if not c.isspace())
    alpha_ratio = alpha / max(1, nonspace)

    # Median line length: the dominant signal.
    line_score = min(1.0, med_line / 60.0)
    # Numeric density: tables are number soup.
    num_score = 1.0 if num_ratio <= 0.20 else max(0.0, 1.0 - (num_ratio - 0.20) * 2.5)
    # Very short tokens are table headers / axis labels ("L", "N", "0", "E").
    short_score = 1.0 if short_ratio <= 0.30 else max(0.0, 1.0 - (short_ratio - 0.30) * 2.0)
    # Alphabetic density is a weak but non-zero signal.
    alpha_score = min(1.0, max(0.0, (alpha_ratio - 0.45) / 0.35))

    score = 0.50 * line_score + 0.20 * num_score + 0.15 * short_score + 0.15 * alpha_score

    # Hard rejects for the unambiguous cases.
    if med_line < 12 or num_ratio > 0.45 or short_ratio > 0.55:
        return 0.0
    return round(min(1.0, score), 4)


def split_chunks(text: str, max_chars: int = 900, overlap: int = 120) -> List[str]:
    """Sentence-aware chunking with overlap.

    The original used 500/50 on paragraph breaks. 900/120 with sentence
    boundaries gives longer, more self-contained passages, which measurably
    improves citation quality because a quote is more likely to contain the
    claim it is cited for.
    """
    text = re.sub(r"[ \t]+", " ", text).strip()
    if len(text) <= max_chars:
        return [text]

    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z(\[0-9])", text)
    out: List[str] = []
    buf = ""
    for s in sentences:
        if not buf:
            buf = s
        elif len(buf) + 1 + len(s) <= max_chars:
            buf = f"{buf} {s}"
        else:
            out.append(buf)
            tail = buf[-overlap:] if overlap else ""
            # Avoid stitching mid-word.
            if tail and not tail.startswith(" "):
                cut = tail.find(" ")
                tail = tail[cut:] if cut != -1 else ""
            buf = f"{tail} {s}".strip()
    if buf:
        out.append(buf)
    return [c for c in out if len(c.strip()) >= 50]


# --- Public entry point ---------------------------------------------------
def ingest_pdf(
    file_bytes: bytes,
    filename: str,
    source: str = "upload",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Extract, chunk, persist. Returns the stored document record.

    `metadata` (e.g. authoritative arXiv title/authors) takes precedence over the
    first-page regex heuristics.
    """
    if not file_bytes:
        raise ValueError("The uploaded file is empty")

    sha = hashlib.sha256(file_bytes).hexdigest()
    for d in db.list_documents():
        if d.get("sha256") == sha:
            # De-duplication. The returned shape is the same as a fresh ingest
            # plus an explicit `duplicate` flag, so callers never have to guess
            # whether a missing field means "duplicate" or "not set".
            found = dict(d)
            found["duplicate"] = True
            found["chunk_count"] = len(db.get_chunks([d["id"]]))
            return found

    pages, page_count = extract_pages(file_bytes, filename)
    first = pages.get(1, "")
    meta = metadata or {}

    title = (meta.get("title") or "").strip() or guess_title(first, filename)
    authors = (meta.get("authors") or "").strip() or guess_authors(first)
    year = str(meta.get("year") or "").strip() or guess_year(first)
    venue = (meta.get("venue") or "").strip() or guess_venue(first)
    doi = (meta.get("doi") or "").strip() or guess_doi(first)
    abstract = (meta.get("abstract") or "").strip() or extract_abstract(pages)

    safe_stem = re.sub(r"[^a-zA-Z0-9_-]", "_", re.sub(r"\.pdf$", "", filename, flags=re.I).lower())[:40]
    doc_id = meta.get("id") or f"{safe_stem}_{sha[:8]}"

    sections, chunks = build_sections_and_chunks(pages, doc_id)

    record = {
        "id": doc_id,
        "source": source,
        "filename": filename,
        "title": title,
        "authors": authors,
        "year": year,
        "venue": venue,
        "doi": doi,
        "arxiv_id": meta.get("arxiv_id"),
        "source_url": meta.get("source_url") or "",
        "page_count": page_count,
        "sha256": sha,
        "text_chars": sum(len(t) for t in pages.values()),
        "abstract": abstract,
        "added_at": db.now(),
    }
    db.upsert_document(record, chunks)
    out = dict(record)
    out["duplicate"] = False
    out["section_count"] = len(sections)
    out["chunk_count"] = len(chunks)
    out["sections"] = sections
    return out
