"""Evidence matrix + citation export, repointed from mock data to real data.

Why this was rewritten
----------------------
The original `ResearchService` had two serious problems:

1. `generate_bibtex()` returned a **hardcoded string** containing a fabricated DOI
   (`10.1109/TSG.2024.3389102`) and an entire fabricated paper -- *"Microgrid
   Voltage Stability via Distributed Deep Recurrent Reinforcement Models"*, which
   is not in the corpus and, as far as this project can tell, does not correspond
   to any ingested document. A literature-review tool that emits made-up
   references is the exact failure the project is supposed to prevent.
2. The evidence matrix was six static rows over mock papers, and
   `update_evidence_status` mutated an in-memory list, so status was lost on
   restart and was never applied to anything real.

Both are now computed. BibTeX is generated from the actual `documents` and
`citations` tables; the matrix is built from the citations the verifier actually
accepted, and status is persisted per session.
"""
from __future__ import annotations

import csv
import io
import re
from typing import Any, Dict, List, Optional

import db
from models.schemas import ComplianceChecks, EmpiricalResult, EvidenceMatrixRow
from services.paper_service import _method_category, _method_tag

NOT_AVAILABLE = "Not extracted from the ingested PDF"

# Status overrides live in the session's `metrics` blob so they survive restarts.
_STATUS_KEY = "evidence_status"


def _session_status(session_id: str) -> Dict[str, str]:
    s = db.get_session(session_id) if session_id else None
    return ((s or {}).get("metrics") or {}).get(_STATUS_KEY, {}) or {}


def build_evidence_matrix(session_id: Optional[str] = None) -> List[EvidenceMatrixRow]:
    """One row per paper that was actually cited in a verified review."""
    citations = db.get_citations(session_id) if session_id else []
    if not citations:
        return []
    overrides = _session_status(session_id)
    by_doc: Dict[str, List[Dict[str, Any]]] = {}
    for c in citations:
        by_doc.setdefault(c["doc_id"], []).append(c)

    rows: List[EvidenceMatrixRow] = []
    for i, (doc_id, cites) in enumerate(by_doc.items(), 1):
        doc = db.get_document(doc_id) or {}
        abstract = doc.get("abstract") or ""
        pages = sorted({c.get("page") for c in cites if c.get("page")})
        rows.append(
            EvidenceMatrixRow(
                id=f"ev-{i:03d}",
                paperKey=f"P{i:02d}",
                paperId=doc_id,
                paperTitle=doc.get("title") or "Untitled",
                authors=doc.get("authors") or NOT_AVAILABLE,
                year=int(str(doc.get("year") or "0")[:4] or 0),
                venue=doc.get("venue") or "Unspecified",
                citationsCount=0,
                primaryMethod=_method_tag(doc.get("title", "")),
                methodCategory=_method_category(doc.get("title", ""), abstract),
                datasetTested=NOT_AVAILABLE,
                datasetDetail=(
                    f"Cited on page(s) {', '.join(str(p) for p in pages)}"
                    if pages else NOT_AVAILABLE
                ),
                forecastHorizons=[],
                # No invented MSE/MAE. R-Lens does not read result tables, so
                # reporting a number here would be a fabrication.
                empiricalResult=EmpiricalResult(
                    primaryMetric=NOT_AVAILABLE, secondaryMetric=NOT_AVAILABLE
                ),
                supportedClaim=(cites[0].get("quote") or "")[:300],
                status=overrides.get(doc_id, "Verified"),
                identifiedLimitation=NOT_AVAILABLE,
                researchGap=NOT_AVAILABLE,
                citationTag=", ".join(c["marker"] for c in cites),
                exactOcrExcerpt=(cites[0].get("quote") or "")[:400],
                ocrLocation=(
                    f"p. {cites[0]['page']}, {cites[0].get('section') or 'n/a'}"
                    if cites[0].get("page") else "n/a"
                ),
                embeddingCosine=0.0,
                complianceChecks=ComplianceChecks(
                    statisticalCrossCheck=False,
                    datasetSplitCompliant=False,
                    codeAvailable=NOT_AVAILABLE,
                ),
            )
        )
    return rows


class ResearchService:
    def get_evidence_matrix(self, session_id: Optional[str] = None) -> List[EvidenceMatrixRow]:
        return build_evidence_matrix(session_id)

    def update_evidence_status(
        self, row_id: str, status: str, session_id: Optional[str] = None
    ) -> Optional[EvidenceMatrixRow]:
        """Persist a reviewer's status decision against the session."""
        if not session_id:
            return None
        session = db.get_session(session_id)
        if not session:
            return None
        rows = build_evidence_matrix(session_id)
        target = next((r for r in rows if r.id == row_id), None)
        if target is None:
            return None
        metrics = dict(session.get("metrics") or {})
        overrides = dict(metrics.get(_STATUS_KEY) or {})
        overrides[target.paperId] = status
        metrics[_STATUS_KEY] = overrides
        db.update_session(session_id, metrics=metrics)
        return next((r for r in build_evidence_matrix(session_id) if r.id == row_id), None)

    # ------------------------------------------------------------------
    def get_report_citations(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Verified citations, keyed by marker."""
        return {c["marker"]: c for c in db.get_citations(session_id)} if session_id else {}

    def generate_bibtex(self, session_id: Optional[str] = None) -> str:
        """BibTeX built from real document metadata. Never invents an identifier."""
        if session_id:
            doc_ids = {c["doc_id"] for c in db.get_citations(session_id)}
        else:
            doc_ids = {d["id"] for d in db.list_documents()}
        docs = [db.get_document(i) for i in doc_ids]
        entries = [self._bibtex(d) for d in docs if d]
        if not entries:
            return (
            "% No documents in the corpus yet.\n"
            "% Run: python scripts/fetch_corpus.py\n"
        )
        header = (
            "% Generated by R-Lens from ingested PDF metadata.\n"
            "% Fields that could not be extracted from the PDF are omitted\n"
            "% rather than guessed -- R-Lens does not fabricate identifiers.\n\n"
        )
        return header + "\n\n".join(entries) + "\n"

    def _bibtex(self, d: Dict[str, Any]) -> str:
        def esc(s: str) -> str:
            return re.sub(r"([{}%&_$#])", r"\\\1", (s or "").strip())

        authors = d.get("authors") or ""
        names = [a.strip() for a in authors.split(",") if a.strip()]
        bib_authors = " and ".join(
            f"{n.split()[-1]}, {' '.join(n.split()[:-1])}".strip(", ") if " " in n else n
            for n in names
        ) or "Unknown"
        year = str(d.get("year") or "")
        key = re.sub(r"[^a-z0-9]", "", (d.get("title") or d["id"]).lower())[:40] or d["id"]
        fields = [
            ("title", "{" + esc(d.get("title") or "Untitled") + "}"),
            ("author", "{" + esc(bib_authors) + "}"),
        ]
        # Every field below is omitted when the PDF did not supply it. A BibTeX
        # entry with a guessed year or a derived DOI is a fabricated reference,
        # which is the one thing this project exists to prevent.
        if year:
            fields.append(("year", "{" + esc(year) + "}"))
        if d.get("venue") and d["venue"] != "Uploaded Research Document":
            fields.append(("howpublished", "{" + esc(d["venue"]) + "}"))
        if d.get("arxiv_id"):
            fields.append(("eprint", "{" + esc(d["arxiv_id"]) + "}"))
            fields.append(("archivePrefix", "{arXiv}"))
        if d.get("doi"):
            fields.append(("doi", "{" + esc(d["doi"]) + "}"))
        body = ",\n".join(f"  {k} = {v}" for k, v in fields)
        return f"@article{{{key},\n{body}\n}}"

    def export_matrix_csv(self, session_id: Optional[str] = None) -> str:
        buf = io.StringIO()
        w = csv.writer(buf, quoting=csv.QUOTE_ALL, lineterminator="\n")
        w.writerow([
            "Source", "Paper", "Authors", "Year", "Venue", "Method",
            "Cited pages", "Supporting quote", "Status",
        ])
        for r in build_evidence_matrix(session_id):
            w.writerow([
                r.paperKey, r.paperTitle, r.authors, r.year, r.venue,
                r.primaryMethod, r.datasetDetail, r.exactOcrExcerpt, r.status,
            ])
        return buf.getvalue()


research_service = ResearchService()
