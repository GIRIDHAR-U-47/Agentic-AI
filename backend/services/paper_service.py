from typing import List, Optional, Dict, Any
from data.mock_data import MOCK_PAPERS
from models.schemas import Paper, ValidationStatus

class PaperService:
    def __init__(self):
        # Deep copy to maintain mutable state during session
        self.papers: List[Dict[str, Any]] = [dict(p) for p in MOCK_PAPERS]

    def get_papers(
        self,
        search_query: Optional[str] = None,
        methods: Optional[List[str]] = None,
        min_relevance: Optional[int] = None,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        sort_by: Optional[str] = None
    ) -> List[Paper]:
        result = [p for p in self.papers]

        if search_query:
            q = search_query.lower()
            result = [
                p for p in result
                if q in p["title"].lower()
                or q in p["authors"].lower()
                or q in p["abstract"].lower()
                or q in p["methodTag"].lower()
                or q in p["venue"].lower()
            ]

        if methods and len(methods) > 0:
            result = [
                p for p in result
                if any(
                    m.lower() in p["methodCategory"].lower() or m.lower() in p["methodTag"].lower()
                    for m in methods
                )
            ]

        if min_relevance is not None:
            result = [p for p in result if p["relevanceScore"] >= min_relevance]

        if year_min is not None and year_max is not None:
            result = [p for p in result if year_min <= p["year"] <= year_max]
        elif year_min is not None:
            result = [p for p in result if p["year"] >= year_min]
        elif year_max is not None:
            result = [p for p in result if p["year"] <= year_max]

        if sort_by:
            if sort_by == 'relevance':
                result.sort(key=lambda x: x["relevanceScore"], reverse=True)
            elif sort_by == 'citations':
                result.sort(key=lambda x: x["citationsCount"], reverse=True)
            elif sort_by == 'year':
                result.sort(key=lambda x: x["year"], reverse=True)
            elif sort_by == 'evidenceDensity':
                result.sort(key=lambda x: x["evidenceQuotesCount"], reverse=True)

        return [Paper(**p) for p in result]

    def get_paper_by_id(self, paper_id: str) -> Optional[Paper]:
        for p in self.papers:
            if p["id"] == paper_id:
                return Paper(**p)
        return None

    def update_paper_validation(self, paper_id: str, status: ValidationStatus) -> Optional[Paper]:
        for p in self.papers:
            if p["id"] == paper_id:
                p["validationStatus"] = status
                return Paper(**p)
        return None

paper_service = PaperService()
