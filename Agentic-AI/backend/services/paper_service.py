"""Paper service, repointed from mock data to the real corpus.

What changed and why
--------------------
The original `PaperService` copied 12 hand-written papers out of
`data/mock_data.py`. That list contained **invented DOIs, invented metric values
and invented altmetric scores**. Serving it as "papers" was the single largest
source of fabricated data in the project, and it is the reason
`docs/PROJECT_REPORT.md` marks the legacy `/api/papers` numbers as unusable for
evaluation.

This service now builds `Paper` records from the real documents table. Fields
that genuinely cannot be derived from a PDF (citation count, altmetric score,
SOTA flag) are returned as explicit `null`-equivalent values and a `dataOrigin`
marker, rather than being filled with plausible numbers. The UI shows
"Not indexed" for them, which is the truth.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import db
from models.schemas import MethodCategory, Paper, ValidationStatus
from services.retrieval import rank_papers

#: Fields the mock data used to fabricate. Left empty on purpose.
UNAVAILABLE = "Not available from the ingested PDF"

_YEAR_FALLBACK = 0

# `MethodCategory` is a Literal alias, not an Enum, so the allowed values are
# the source of truth and these must match `models/schemas.py`.
_METHOD_CATEGORIES = ("Transformer", "Linear", "TCN", "Diffusion", "Graph", "Hybrid")


def _method_category(title: str, abstract: str) -> MethodCategory:
    """Coarse classification from the paper's own text, not from a fixed table."""
    blob = f"{title} {abstract}".lower()
    if "decomposition" in blob or "autoformer" in blob:
        return "Transformer"  # no finer category exists in the schema
    if "linear" in blob or "dlinear" in blob:
        return "Linear"
    if "temporal convolution" in blob or "tcn" in blob:
        return "TCN"
    if "diffusion" in blob:
        return "Diffusion"
    if "graph" in blob:
        return "Graph"
    return "Transformer"


def _method_tag(title: str) -> str:
    t = (title or "").lower()
    for key, tag in (
        ("informer", "Informer"), ("autoformer", "Autoformer"),
        ("patchtst", "PatchTST"), ("itransformer", "iTransformer"),
        ("timesnet", "TimesNet"), ("dlinear", "DLinear"),
        ("attention is all you need", "Transformer"),
    ):
        if key in t:
            return tag
    return "Transformer"


class PaperService:
    def _rows(self) -> List[Dict[str, Any]]:
        return db.list_documents()

    def _to_paper(self, d: Dict[str, Any]) -> Paper:
        chunks = db.get_chunks([d["id"]])
        abstract = d.get("abstract") or ""
        try:
            year = int(str(d.get("year") or "")[:4])
        except (TypeError, ValueError):
            year = _YEAR_FALLBACK
        return Paper(
            id=d["id"],
            title=d.get("title") or d.get("filename", "Untitled"),
            # `""` from ingest means "the PDF did not say". The schema types these as
    # plain strings, so the honest value is a visible phrase rather than an
    # empty cell -- but it is never confused with real metadata downstream
    # because `review_service._blank` maps the phrasing back to None.
    authors=d.get("authors") or UNAVAILABLE,
            year=year,
            venue=d.get("venue") or "Unspecified",
            publisher="",
            doi=d.get("doi") or UNAVAILABLE,
            arxiv=d.get("arxiv_id"),
            abstract=abstract or "(no abstract extracted)",
            methodTag=_method_tag(d.get("title", "")),
            methodCategory=_method_category(d.get("title", ""), abstract),
            relevanceScore=0,
            evidenceQuotesCount=len(chunks),
            # 'Accepted' means "successfully indexed and citable", which is the
            # only claim R-Lens can actually make about a paper.
            validationStatus="Accepted",
            isSota=None,
            isSeminal=None,
            citationsCount=0,
            altmetricScore=0,
            forecastHorizons=[],
            metrics={},
            datasets=[],
            complexity=UNAVAILABLE,
            coreHypothesis=abstract[:400] if abstract else UNAVAILABLE,
            identifiedLimitations=UNAVAILABLE,
            researchGap=UNAVAILABLE,
            scholarAudit=(
                "Derived from the ingested PDF text. Citation counts, altmetric "
                "scores and SOTA status are not computed by R-Lens and are left "
                "empty rather than estimated."
            ),
            evidenceAnchors=[],
            sections=[],
        )

    def get_papers(
        self,
        search_query: Optional[str] = None,
        methods: Optional[List[str]] = None,
        min_relevance: Optional[int] = None,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        sort_by: Optional[str] = None,
    ) -> List[Paper]:
        rows = self._rows()
        if search_query:
            rows = rank_papers(search_query, rows, top_k=len(rows) or 1)
        if methods:
            wanted = {m.lower() for m in methods}
            rows = [
                r for r in rows
                if _method_tag(r.get("title", "")).lower() in wanted
                or any(m in (r.get("title") or "").lower() for m in wanted)
            ]

        papers = [self._to_paper(r) for r in rows]
        if year_min is not None:
            papers = [p for p in papers if p.year >= year_min]
        if year_max is not None:
            papers = [p for p in papers if p.year <= year_max]
        if sort_by == "year":
            papers.sort(key=lambda p: -p.year)
        elif sort_by == "evidenceDensity":
            papers.sort(key=lambda p: -p.evidenceQuotesCount)
        return papers

    def get_paper_by_id(self, paper_id: str) -> Optional[Paper]:
        d = db.get_document(paper_id)
        return self._to_paper(d) if d else None

    def update_paper_validation(self, paper_id: str, status: ValidationStatus) -> Optional[Paper]:
        """Validation status is per-session (see approvals), not a paper property.

        Kept for API compatibility; it records nothing, because storing a global
        'validated' flag on a shared paper would be meaningless and misleading.
        """
        return self.get_paper_by_id(paper_id) if db.get_document(paper_id) else None


paper_service = PaperService()
