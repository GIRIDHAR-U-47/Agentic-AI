"""Multi-source academic search service.

Queries real academic sources in parallel:
1. OpenAlex (https://api.openalex.org) - Open catalog with abstracts & OA links
2. Semantic Scholar (https://api.semanticscholar.org) - Citation graph & OA PDFs
3. Crossref (https://api.crossref.org) - Publisher DOIs & metadata
4. arXiv (export API) - Physics, CS & AI preprints

Uses concurrent multi-threading, fast timeouts, deduplication across sources by
DOI and normalised title, and in-memory TTL caching for instant repeat searches.
Never fabricates papers or metrics.
"""
from __future__ import annotations

import concurrent.futures
import json
import re
import ssl
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional, Set, Tuple

import config


class AcademicSearchError(RuntimeError):
    pass


# Fast in-memory TTL cache for search queries
_SEARCH_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
_CACHE_TTL_SECONDS = 300.0


def _ssl_context() -> ssl.SSLContext:
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        try:
            return ssl.create_default_context()
        except Exception:
            return ssl._create_unverified_context()


def _http_get_json(url: str, timeout: float = 6.0, headers: Optional[Dict[str, str]] = None) -> Any:
    req_headers = {
        "User-Agent": config.USER_AGENT,
        "Accept": "application/json",
    }
    if headers:
        req_headers.update(headers)

    req = urllib.request.Request(url, headers=req_headers)
    ctx = _ssl_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        raw = resp.read().decode(charset, errors="replace")
        return json.loads(raw)


def _reconstruct_openalex_abstract(inverted_index: Optional[Dict[str, List[int]]]) -> str:
    """Rebuild full abstract string from OpenAlex abstract_inverted_index."""
    if not inverted_index or not isinstance(inverted_index, dict):
        return ""
    pos_words: List[Tuple[int, str]] = []
    for word, positions in inverted_index.items():
        if isinstance(positions, list):
            for pos in positions:
                if isinstance(pos, int):
                    pos_words.append((pos, word))
    if not pos_words:
        return ""
    pos_words.sort(key=lambda x: x[0])
    return " ".join(w for _, w in pos_words)


def _normalize_title_for_dedupe(title: str) -> str:
    """Normalise title for cross-source deduplication."""
    return re.sub(r"[^a-z0-9]", "", (title or "").lower())


def _clean_text(text: Optional[str]) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


# ---------------------------------------------------------------------------
# Source 1: OpenAlex
# ---------------------------------------------------------------------------
def search_openalex(query: str, max_results: int = 10, timeout: float = 6.0) -> List[Dict[str, Any]]:
    """Search OpenAlex API for scholarly works."""
    q = urllib.parse.quote(query.strip())
    # OpenAlex polite pool request
    url = f"https://api.openalex.org/works?search={q}&per-page={max(1, min(max_results, 25))}&mailto=research-assistant@rlens.local"
    
    try:
        data = _http_get_json(url, timeout=timeout)
    except Exception as exc:
        raise AcademicSearchError(f"OpenAlex search error: {exc}") from exc

    results: List[Dict[str, Any]] = []
    for item in data.get("results", []):
        title = _clean_text(item.get("title") or item.get("display_name"))
        if not title:
            continue

        # Extract authors
        authors_list = []
        for authorship in item.get("authorships", []):
            author_obj = authorship.get("author", {})
            name = author_obj.get("display_name")
            if name:
                authors_list.append(name)
        authors_str = ", ".join(authors_list) if authors_list else "Unavailable"

        # Abstract
        abstract = _reconstruct_openalex_abstract(item.get("abstract_inverted_index"))

        # Year
        pub_year = str(item.get("publication_year") or "")
        if not pub_year and item.get("publication_date"):
            pub_year = str(item.get("publication_date"))[:4]

        # Venue / Host
        primary_loc = item.get("primary_location") or {}
        source_obj = primary_loc.get("source") or {}
        venue = source_obj.get("display_name") or item.get("host_venue", {}).get("name") or "Academic Venue"

        # DOI & URLs
        doi_raw = item.get("doi") or primary_loc.get("landing_page_url") or ""
        doi = doi_raw.replace("https://doi.org/", "").replace("http://doi.org/", "").strip()
        
        oa_info = item.get("open_access") or {}
        pdf_url = oa_info.get("oa_url") or primary_loc.get("pdf_url") or ""
        is_oa = bool(oa_info.get("is_oa") or pdf_url)
        landing_url = primary_loc.get("landing_page_url") or (f"https://doi.org/{doi}" if doi else item.get("id", ""))

        citation_count = int(item.get("cited_by_count") or 0)
        openalex_id = item.get("id") or ""

        doc_id = f"oa_{openalex_id.rsplit('/', 1)[-1]}" if openalex_id else f"paper_{_normalize_title_for_dedupe(title)[:16]}"

        results.append({
            "doc_id": doc_id,
            "title": title,
            "authors": authors_str,
            "year": pub_year or "Unavailable",
            "venue": venue,
            "doi": doi,
            "abstract": abstract or "Abstract unavailable from OpenAlex index.",
            "url": landing_url,
            "pdf_url": pdf_url if pdf_url and pdf_url.startswith("http") else "",
            "is_open_access": is_oa,
            "citations_count": citation_count,
            "source": "OpenAlex",
            "openalex_id": openalex_id,
        })

    return results


# ---------------------------------------------------------------------------
# Source 2: Semantic Scholar
# ---------------------------------------------------------------------------
def search_semantic_scholar(query: str, max_results: int = 10, timeout: float = 6.0) -> List[Dict[str, Any]]:
    """Search Semantic Scholar Graph API."""
    fields = "title,authors,year,abstract,venue,publicationVenue,openAccessPdf,citationCount,externalIds,url"
    params = {
        "query": query.strip(),
        "limit": str(max(1, min(max_results, 25))),
        "fields": fields,
    }
    url = f"https://api.semanticscholar.org/graph/v1/paper/search?{urllib.parse.urlencode(params)}"

    try:
        data = _http_get_json(url, timeout=timeout)
    except Exception as exc:
        raise AcademicSearchError(f"Semantic Scholar search error: {exc}") from exc

    results: List[Dict[str, Any]] = []
    for item in data.get("data", []):
        title = _clean_text(item.get("title"))
        if not title:
            continue

        authors = [a.get("name") for a in item.get("authors", []) if a.get("name")]
        authors_str = ", ".join(authors) if authors else "Unavailable"

        ext_ids = item.get("externalIds") or {}
        doi = ext_ids.get("DOI") or ""
        arxiv_id = ext_ids.get("ArXiv") or ""

        pub_venue = item.get("publicationVenue") or {}
        venue = pub_venue.get("name") or item.get("venue") or "Academic Venue"

        oa_pdf = item.get("openAccessPdf") or {}
        pdf_url = oa_pdf.get("url") or (f"https://arxiv.org/pdf/{arxiv_id}" if arxiv_id else "")
        is_oa = bool(pdf_url)

        paper_id = item.get("paperId") or ""
        doc_id = f"s2_{paper_id[:12]}" if paper_id else f"s2_{_normalize_title_for_dedupe(title)[:16]}"

        results.append({
            "doc_id": doc_id,
            "title": title,
            "authors": authors_str,
            "year": str(item.get("year") or "Unavailable"),
            "venue": venue,
            "doi": doi,
            "arxiv_id": arxiv_id,
            "abstract": _clean_text(item.get("abstract")) or "Abstract unavailable from Semantic Scholar index.",
            "url": item.get("url") or (f"https://doi.org/{doi}" if doi else ""),
            "pdf_url": pdf_url if pdf_url and pdf_url.startswith("http") else "",
            "is_open_access": is_oa,
            "citations_count": int(item.get("citationCount") or 0),
            "source": "Semantic Scholar",
            "semantic_scholar_id": paper_id,
        })

    return results


# ---------------------------------------------------------------------------
# Source 3: Crossref
# ---------------------------------------------------------------------------
def search_crossref(query: str, max_results: int = 10, timeout: float = 6.0) -> List[Dict[str, Any]]:
    """Search Crossref REST API."""
    params = {
        "query.bibliographic": query.strip(),
        "rows": str(max(1, min(max_results, 25))),
        "sort": "relevance",
        "select": "DOI,title,author,published-print,published-online,created,container-title,abstract,link,is-referenced-by-count,URL",
    }
    url = f"https://api.crossref.org/works?{urllib.parse.urlencode(params)}"

    try:
        data = _http_get_json(url, timeout=timeout)
    except Exception as exc:
        raise AcademicSearchError(f"Crossref search error: {exc}") from exc

    items = data.get("message", {}).get("items", [])
    results: List[Dict[str, Any]] = []

    for item in items:
        raw_titles = item.get("title", [])
        title = _clean_text(raw_titles[0] if raw_titles else "")
        if not title:
            continue

        # Authors
        authors = []
        for a in item.get("author", []):
            given = a.get("given", "")
            family = a.get("family", "")
            full = f"{given} {family}".strip()
            if full:
                authors.append(full)
        authors_str = ", ".join(authors) if authors else "Unavailable"

        # Year
        pub = item.get("published-print") or item.get("published-online") or item.get("created") or {}
        date_parts = pub.get("date-parts", [[]])
        year_val = date_parts[0][0] if date_parts and date_parts[0] else None
        year_str = str(year_val) if year_val else "Unavailable"

        # Venue
        container = item.get("container-title", [])
        venue = container[0] if container else (item.get("publisher") or "Crossref Registered Publication")

        doi = item.get("DOI") or ""
        url_link = item.get("URL") or (f"https://doi.org/{doi}" if doi else "")

        # Check for link resource
        pdf_url = ""
        for link in item.get("link", []):
            content_type = link.get("content-type", "")
            if "pdf" in content_type:
                pdf_url = link.get("URL", "")
                break

        abstract = _clean_text(item.get("abstract"))
        # Strip JATS XML tags if present
        if abstract:
            abstract = re.sub(r"<[^>]+>", "", abstract).strip()

        doc_id = f"cr_{doi.replace('/', '_')}" if doi else f"cr_{_normalize_title_for_dedupe(title)[:16]}"

        results.append({
            "doc_id": doc_id,
            "title": title,
            "authors": authors_str,
            "year": year_str,
            "venue": venue,
            "doi": doi,
            "abstract": abstract or "Abstract unavailable from Crossref metadata.",
            "url": url_link,
            "pdf_url": pdf_url if pdf_url and pdf_url.startswith("http") else "",
            "is_open_access": bool(pdf_url),
            "citations_count": int(item.get("is-referenced-by-count") or 0),
            "source": "Crossref",
        })

    return results


# ---------------------------------------------------------------------------
# Source 4: arXiv
# ---------------------------------------------------------------------------
def search_arxiv(query: str, max_results: int = 10, timeout: float = 6.0) -> List[Dict[str, Any]]:
    """Search arXiv export API."""
    from services import arxiv

    try:
        raw = arxiv.search(query, max_results=max_results)
    except Exception as exc:
        raise AcademicSearchError(f"arXiv search error: {exc}") from exc

    results: List[Dict[str, Any]] = []
    for item in raw:
        aid = item.get("arxiv_id", "")
        title = _clean_text(item.get("title"))
        if not title:
            continue

        results.append({
            "doc_id": f"arxiv_{aid.replace('.', '_')}" if aid else f"arxiv_{_normalize_title_for_dedupe(title)[:16]}",
            "arxiv_id": aid,
            "title": title,
            "authors": item.get("authors") or "Unavailable",
            "year": str(item.get("year") or "Unavailable"),
            "venue": item.get("venue") or "arXiv preprint",
            "doi": item.get("doi") or "",
            "abstract": _clean_text(item.get("abstract")) or "Abstract unavailable.",
            "url": item.get("abs_url") or f"https://arxiv.org/abs/{aid}",
            "pdf_url": arxiv.pdf_url(aid) if aid else "",
            "is_open_access": True,
            "citations_count": 0,
            "source": "arXiv",
        })

    return results


# ---------------------------------------------------------------------------
# Federated Search & Deduplication Engine (Concurrent & Fast)
# ---------------------------------------------------------------------------
def federated_academic_search(
    query: str,
    top_k: int = 15,
    sources: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Execute real academic search across OpenAlex, Semantic Scholar, Crossref, and arXiv in parallel.

    Uses a concurrent ThreadPoolExecutor so that all providers execute at the same
    time, dramatically reducing search latency. Returns deduplicated candidates.
    """
    q = query.strip()
    if not q:
        return {
            "query": q,
            "candidates": [],
            "source_events": [],
            "total_found_before_dedupe": 0,
            "total_deduplicated": 0,
        }

    sources_to_use = sources or ["openalex", "semanticscholar", "crossref", "arxiv"]
    
    # Check in-memory fast cache
    cache_key = f"{q.lower()}||{top_k}||{','.join(sorted(sources_to_use))}"
    now = time.time()
    if cache_key in _SEARCH_CACHE:
        cached_time, cached_data = _SEARCH_CACHE[cache_key]
        if now - cached_time < _CACHE_TTL_SECONDS:
            return cached_data

    all_results: List[Dict[str, Any]] = []
    source_events: List[Dict[str, Any]] = []

    # Worker runners with individual timing and exception isolation
    def _run_openalex() -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
        t0 = time.perf_counter()
        try:
            items = search_openalex(q, max_results=top_k, timeout=5.0)
            dur = round(time.perf_counter() - t0, 2)
            event = {
                "source": "OpenAlex",
                "status": "success",
                "count": len(items),
                "duration_s": dur,
                "message": f"Retrieved {len(items)} papers",
            }
            return ("openalex", items, event)
        except Exception as exc:
            dur = round(time.perf_counter() - t0, 2)
            event = {
                "source": "OpenAlex",
                "status": "error",
                "count": 0,
                "duration_s": dur,
                "error": str(exc),
                "message": "Search temporarily unavailable",
            }
            return ("openalex", [], event)

    def _run_semantic_scholar() -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
        t0 = time.perf_counter()
        try:
            items = search_semantic_scholar(q, max_results=top_k, timeout=5.0)
            dur = round(time.perf_counter() - t0, 2)
            event = {
                "source": "Semantic Scholar",
                "status": "success",
                "count": len(items),
                "duration_s": dur,
                "message": f"Retrieved {len(items)} papers",
            }
            return ("semanticscholar", items, event)
        except Exception as exc:
            dur = round(time.perf_counter() - t0, 2)
            event = {
                "source": "Semantic Scholar",
                "status": "error",
                "count": 0,
                "duration_s": dur,
                "error": str(exc),
                "message": "Search temporarily unavailable",
            }
            return ("semanticscholar", [], event)

    def _run_crossref() -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
        t0 = time.perf_counter()
        try:
            items = search_crossref(q, max_results=top_k, timeout=5.0)
            dur = round(time.perf_counter() - t0, 2)
            event = {
                "source": "Crossref",
                "status": "success",
                "count": len(items),
                "duration_s": dur,
                "message": f"Retrieved {len(items)} papers",
            }
            return ("crossref", items, event)
        except Exception as exc:
            dur = round(time.perf_counter() - t0, 2)
            event = {
                "source": "Crossref",
                "status": "error",
                "count": 0,
                "duration_s": dur,
                "error": str(exc),
                "message": "Search temporarily unavailable",
            }
            return ("crossref", [], event)

    def _run_arxiv() -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
        t0 = time.perf_counter()
        try:
            items = search_arxiv(q, max_results=top_k, timeout=6.0)
            dur = round(time.perf_counter() - t0, 2)
            event = {
                "source": "arXiv",
                "status": "success",
                "count": len(items),
                "duration_s": dur,
                "message": f"Retrieved {len(items)} papers",
            }
            return ("arxiv", items, event)
        except Exception as exc:
            dur = round(time.perf_counter() - t0, 2)
            event = {
                "source": "arXiv",
                "status": "error",
                "count": 0,
                "duration_s": dur,
                "error": str(exc),
                "message": "Search temporarily unavailable",
            }
            return ("arxiv", [], event)

    # Execute all selected sources in parallel
    tasks = []
    if "openalex" in sources_to_use:
        tasks.append(_run_openalex)
    if "semanticscholar" in sources_to_use:
        tasks.append(_run_semantic_scholar)
    if "crossref" in sources_to_use:
        tasks.append(_run_crossref)
    if "arxiv" in sources_to_use:
        tasks.append(_run_arxiv)

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(4, max(1, len(tasks)))) as executor:
        future_map = [executor.submit(fn) for fn in tasks]
        for future in concurrent.futures.as_completed(future_map):
            try:
                _src_name, items, event = future.result()
                all_results.extend(items)
                source_events.append(event)
            except Exception as exc:
                source_events.append({
                    "source": "Federated Worker",
                    "status": "error",
                    "count": 0,
                    "error": str(exc),
                })

    # -----------------------------------------------------------------------
    # Deduplication & Merge
    # -----------------------------------------------------------------------
    merged_papers: Dict[str, Dict[str, Any]] = {}
    doi_map: Dict[str, str] = {}
    norm_map: Dict[str, str] = {}

    for paper in all_results:
        title = paper.get("title", "")
        doi = (paper.get("doi") or "").lower().strip()
        norm_key = _normalize_title_for_dedupe(title)
        
        # Primary key match: DOI or normalized title
        master_key = None
        if doi and doi in doi_map:
            master_key = doi_map[doi]
        elif norm_key and norm_key in norm_map:
            master_key = norm_map[norm_key]

        if master_key and master_key in merged_papers:
            # Merge information into existing paper
            existing = merged_papers[master_key]
            existing_sources = set(existing.get("sources_found", [existing.get("source")]))
            existing_sources.add(paper.get("source", "Academic Source"))
            existing["sources_found"] = list(existing_sources)

            # Prefer richer abstract if existing is short/missing
            if len(paper.get("abstract", "")) > len(existing.get("abstract", "")) and "unavailable" not in paper.get("abstract", "").lower():
                existing["abstract"] = paper["abstract"]

            # Prefer real DOI if missing
            if not existing.get("doi") and paper.get("doi"):
                existing["doi"] = paper["doi"]

            # Prefer real PDF URL if missing
            if not existing.get("pdf_url") and paper.get("pdf_url"):
                existing["pdf_url"] = paper["pdf_url"]
                existing["is_open_access"] = True

            # Pick highest citation count
            existing["citations_count"] = max(
                existing.get("citations_count", 0), paper.get("citations_count", 0)
            )
            # Update IDs if missing
            for id_key in ("arxiv_id", "openalex_id", "semantic_scholar_id"):
                if not existing.get(id_key) and paper.get(id_key):
                    existing[id_key] = paper[id_key]
        else:
            # New unique paper
            m_key = doi if doi else norm_key
            if not m_key:
                m_key = paper.get("doc_id", "")

            paper["sources_found"] = [paper.get("source", "Academic Source")]
            merged_papers[m_key] = paper

            if doi:
                doi_map[doi] = m_key
            if norm_key:
                norm_map[norm_key] = m_key

    deduped_list = list(merged_papers.values())

    # Sort by citations count (descending) & whether abstract/PDF is present
    def _rank_key(p: Dict[str, Any]) -> Tuple[int, int, int]:
        has_pdf = 1 if p.get("pdf_url") else 0
        has_abs = 1 if p.get("abstract") and "unavailable" not in p.get("abstract", "").lower() else 0
        cites = int(p.get("citations_count") or 0)
        return (has_pdf, has_abs, cites)

    deduped_list.sort(key=_rank_key, reverse=True)
    final_candidates = deduped_list[:top_k]

    result = {
        "query": q,
        "candidates": final_candidates,
        "source_events": source_events,
        "total_found_before_dedupe": len(all_results),
        "total_deduplicated": len(final_candidates),
    }

    # Store in memory cache
    _SEARCH_CACHE[cache_key] = (now, result)
    # Prune old cache entries if needed
    if len(_SEARCH_CACHE) > 200:
        old_keys = [k for k, (t, _) in _SEARCH_CACHE.items() if now - t > _CACHE_TTL_SECONDS]
        for k in old_keys:
            _SEARCH_CACHE.pop(k, None)

    return result
