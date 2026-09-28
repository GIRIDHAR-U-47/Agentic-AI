"""Minimal arXiv client: metadata lookup + search.

The arXiv API needs no credentials, which is what lets the demo, the tests and
the evaluation harness run with zero secrets in Git.

Only stdlib `urllib` is used on purpose — the project already depends on
`requests` transitively via LangChain, but keeping this module stdlib-only means
corpus fetching works even in a minimal install.
"""
from __future__ import annotations

import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional

import config

_NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "arxiv": "http://arxiv.org/schemas/atom",
}


class ArxivError(RuntimeError):
    pass


def _get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": config.USER_AGENT})
    last: Optional[Exception] = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=config.ARXIV_TIMEOUT_S) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception as exc:  # pragma: no cover - network dependent
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise ArxivError(f"arXiv request failed: {last}")


def _text(node: Optional[ET.Element]) -> str:
    return (node.text or "").strip() if node is not None else ""


def _parse_entry(entry: ET.Element) -> Dict[str, Any]:
    def get(tag: str) -> str:
        return _text(entry.find(tag, _NS))

    abs_url = get("atom:id")
    arxiv_id = abs_url.rsplit("/abs/", 1)[-1] if "/abs/" in abs_url else abs_url
    published = get("atom:published")
    updated = get("atom:updated")
    authors = [
        _text(a) for a in entry.findall("atom:author/atom:name", _NS) if _text(a)
    ]
    cats = [c.get("term", "") for c in entry.findall("atom:category", _NS)]
    doi = _text(entry.find("arxiv:doi", _NS))
    journal = _text(entry.find("arxiv:journal_ref", _NS))
    return {
        "arxiv_id": re.sub(r"v\d+$", "", arxiv_id),
        "arxiv_version": arxiv_id,
        "title": re.sub(r"\s+", " ", get("atom:title")),
        "abstract": re.sub(r"\s+", " ", get("atom:summary")),
        "authors": ", ".join(authors) if authors else "Unavailable",
        "year": published[:4] if published else "Unavailable",
        "published": published[:10],
        "updated": updated[:10],
        "doi": doi,
        "venue": journal or "arXiv preprint",
        "categories": cats,
        "abs_url": f"https://arxiv.org/abs/{arxiv_id}",
    }


def _query(params: Dict[str, str]) -> List[Dict[str, Any]]:
    url = f"{config.ARXIV_API_BASE}?{urllib.parse.urlencode(params)}"
    xml = _get(url)
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as exc:
        raise ArxivError(f"Could not parse arXiv response: {exc}") from exc
    return [_parse_entry(e) for e in root.findall("atom:entry", _NS)]


def lookup(arxiv_id: str) -> Optional[Dict[str, Any]]:
    """Fetch authoritative metadata for one arXiv id (version suffix optional)."""
    entries = _query({"id_list": arxiv_id, "max_results": "1"})
    return entries[0] if entries else None


def search(query: str, max_results: int = 8) -> List[Dict[str, Any]]:
    """Free-text arXiv search. Used by the agent's `search_papers` tool."""
    q = re.sub(r"[^A-Za-z0-9\s:+\-]", " ", query or "").strip()
    if not q:
        return []
    entries = _query(
        {
            "search_query": f"all:{q}",
            "start": "0",
            "max_results": str(max(1, min(max_results, 25))),
            "sortBy": "relevance",
            "sortOrder": "descending",
        }
    )
    return [e for e in entries if e.get("title")]


def pdf_url(arxiv_id: str) -> str:
    return f"https://arxiv.org/pdf/{arxiv_id}"


def download_pdf(arxiv_id: str, dest) -> bytes:
    """Download a paper PDF. Returns bytes; caller records the checksum."""
    url = pdf_url(arxiv_id)
    req = urllib.request.Request(url, headers={"User-Agent": config.USER_AGENT})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()
