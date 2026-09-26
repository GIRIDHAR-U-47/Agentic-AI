"""
R-Lens PDF RAG Service - Real implementation using PyMuPDF.
No placeholder text, no demo data, isolated per-document sessions.
"""

import os
import re
import hashlib
from typing import List, Dict, Any, Optional, Tuple

from pydantic import BaseModel

# PyMuPDF
try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    fitz = None
    PYMUPDF_AVAILABLE = False

# Gemini
try:
    import google.generativeai as genai
    _gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if _gemini_key:
        genai.configure(api_key=_gemini_key)
    GENAI_AVAILABLE = bool(_gemini_key)
except Exception:
    genai = None
    GENAI_AVAILABLE = False


class SectionInfo(BaseModel):
    id: str
    title: str
    page: int
    content_preview: str


class Chunk(BaseModel):
    id: str
    doc_id: str
    doc_name: str
    page: int
    section: str
    text: str
    relevance_score: float = 0.0


class PDFDocument(BaseModel):
    id: str
    filename: str
    title: str
    authors: str
    year: str
    venue: str
    doi: str
    page_count: int
    sections: List[SectionInfo]
    chunks: List[Chunk]
    full_text_by_page: Dict[int, str]


class AgenticRAGResponse(BaseModel):
    answer: str
    agent_steps: List[str]
    citations: List[Dict[str, Any]]
    verified: bool
    target_docs: List[str]


# Academic section detection patterns
SECTION_PATTERNS: List[Tuple] = [
    (re.compile(r"(?i)^\s*abstract\s*$", re.M), "Abstract"),
    (re.compile(r"(?i)^\s*(?:\d\.?\s*)?introduction\s*$", re.M), "1. Introduction"),
    (re.compile(r"(?i)^\s*(?:\d\.?\s*)?(?:related work|literature review|background)\s*$", re.M), "2. Related Work"),
    (re.compile(r"(?i)^\s*(?:\d\.?\s*)?(?:methodology|proposed method|model|framework|approach|system design|architecture)\s*$", re.M), "3. Methodology"),
    (re.compile(r"(?i)^\s*(?:\d\.?\s*)?(?:experiment|experimental setup|implementation|dataset|benchmark|evaluation)\s*$", re.M), "4. Experiments & Setup"),
    (re.compile(r"(?i)^\s*(?:\d\.?\s*)?(?:result|performance|empirical|discussion|analysis)\s*$", re.M), "5. Results & Discussion"),
    (re.compile(r"(?i)^\s*(?:\d\.?\s*)?(?:limitation|threat|constraint|future work|research gap)\s*$", re.M), "6. Limitations & Gaps"),
    (re.compile(r"(?i)^\s*(?:\d\.?\s*)?(?:conclusion|summary|concluding)\s*$", re.M), "7. Conclusion"),
    (re.compile(r"(?i)^\s*(?:reference|bibliography)\s*$", re.M), "References"),
]

STOPWORDS = frozenset({
    "the", "a", "an", "and", "or", "is", "are", "was", "were", "in", "on",
    "at", "of", "for", "with", "to", "what", "which", "how", "does", "this",
    "paper", "document", "tell", "me", "about", "it", "its", "as", "be", "by",
    "do", "not", "from", "that", "they", "we", "our", "can", "will", "has",
    "have", "had", "but", "if", "when", "where", "who", "use", "used", "using",
    "based", "also", "than", "more", "other", "any", "their", "each", "all",
})


class PDFRAGService:
    def __init__(self):
        self.documents: Dict[str, PDFDocument] = {}
        self._file_hash_to_doc_id: Dict[str, str] = {}

    def get_all_documents(self) -> List[PDFDocument]:
        return list(self.documents.values())

    def get_document(self, doc_id: str) -> Optional[PDFDocument]:
        return self.documents.get(doc_id)

    def delete_document(self, doc_id: str) -> bool:
        if doc_id not in self.documents:
            return False
        self._file_hash_to_doc_id = {
            h: d for h, d in self._file_hash_to_doc_id.items() if d != doc_id
        }
        del self.documents[doc_id]
        return True

    def process_uploaded_pdf(self, file_bytes: bytes, filename: str) -> PDFDocument:
        """
        Extract real text via PyMuPDF, chunk, and index.
        Raises ValueError on failure - zero placeholder text inserted.
        """
        # Deduplication: same file bytes -> return existing document
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        if file_hash in self._file_hash_to_doc_id:
            existing_id = self._file_hash_to_doc_id[file_hash]
            if existing_id in self.documents:
                return self.documents[existing_id]

        # Stable doc_id from filename stem + 8-char hash prefix
        safe_stem = re.sub(r"[^a-zA-Z0-9_-]", "_",
                           filename.lower().replace(".pdf", ""))[:40]
        doc_id = f"{safe_stem}_{file_hash[:8]}"

        if not PYMUPDF_AVAILABLE:
            raise ValueError(
                "PyMuPDF (fitz) is not installed. Run: pip install pymupdf"
            )

        pages_text: Dict[int, str] = {}
        page_count = 0

        try:
            with fitz.open(stream=file_bytes, filetype="pdf") as pdf:
                page_count = len(pdf)
                if page_count == 0:
                    raise ValueError(f"'{filename}' is an empty PDF (0 pages).")
                for page_idx in range(page_count):
                    page = pdf[page_idx]
                    raw = page.get_text("text")
                    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", raw).strip()
                    if cleaned:
                        pages_text[page_idx + 1] = cleaned
        except Exception as exc:
            raise ValueError(f"Failed to extract text from '{filename}': {exc}")

        total_chars = sum(len(t) for t in pages_text.values())
        if total_chars < 50:
            raise ValueError(
                f"'{filename}' appears to be a scanned/image-only PDF. "
                "No machine-readable text could be extracted. "
                "Please OCR-process the file before uploading."
            )

        first_page_text = pages_text.get(1, "")
        title   = self._extract_title(first_page_text, filename)
        authors = self._extract_authors(first_page_text)
        year    = self._extract_year(first_page_text)
        doi     = self._extract_doi(first_page_text)
        venue   = self._extract_venue(first_page_text)

        sections, chunks = self._build_sections_and_chunks(pages_text, doc_id, filename)

        doc = PDFDocument(
            id=doc_id,
            filename=filename,
            title=title,
            authors=authors,
            year=year,
            venue=venue,
            doi=doi,
            page_count=page_count,
            sections=sections,
            chunks=chunks,
            full_text_by_page=pages_text,
        )

        self.documents[doc_id] = doc
        self._file_hash_to_doc_id[file_hash] = doc_id
        return doc

    def query_agentic_rag(
        self,
        query: str,
        active_doc_ids: Optional[List[str]] = None,
    ) -> AgenticRAGResponse:
        query_text = query.strip()

        agent_steps = [
            "Understanding query & mapping to target document",
            "Retrieving candidate evidence chunks from index",
            "Evaluating evidence sufficiency",
            "Generating grounded answer with page citations",
        ]

        if active_doc_ids:
            target_docs = [self.documents[d] for d in active_doc_ids if d in self.documents]
        else:
            target_docs = list(self.documents.values())

        if not target_docs:
            return AgenticRAGResponse(
                answer="No PDF document is currently loaded. Please upload a research paper first.",
                agent_steps=agent_steps,
                citations=[],
                verified=False,
                target_docs=[],
            )

        top_chunks = self._retrieve(query_text, target_docs, top_k=6)

        if len(top_chunks) < 2:
            expanded = self._expand_query(query_text)
            if expanded != query_text:
                agent_steps[2] = "Evidence insufficient - expanding query & re-retrieving"
                top_chunks = self._retrieve(expanded, target_docs, top_k=6)

        if not top_chunks:
            return AgenticRAGResponse(
                answer="This information was not found in the uploaded document.",
                agent_steps=agent_steps,
                citations=[],
                verified=True,
                target_docs=[d.filename for d in target_docs],
            )

        citations: List[Dict[str, Any]] = []
        for chunk in top_chunks[:5]:
            citations.append({
                "doc_name":        chunk.doc_name,
                "doc_id":          chunk.doc_id,
                "page":            chunk.page,
                "section":         chunk.section,
                "quote":           chunk.text[:220] + ("..." if len(chunk.text) > 220 else ""),
                "relevance_score": round(chunk.relevance_score, 3),
            })

        answer = self._gemini_generate(query_text, top_chunks)

        return AgenticRAGResponse(
            answer=answer,
            agent_steps=agent_steps,
            citations=citations,
            verified=True,
            target_docs=list({d.filename for d in target_docs}),
        )

    def _retrieve(self, query: str, target_docs: List[PDFDocument], top_k: int = 6) -> List[Chunk]:
        q_lower = query.lower()
        q_words = set(re.findall(r"\w+", q_lower)) - STOPWORDS

        all_chunks: List[Chunk] = []
        for doc in target_docs:
            all_chunks.extend(doc.chunks)

        if not all_chunks or not q_words:
            return []

        scored: List[Tuple] = []
        for chunk in all_chunks:
            c_lower = chunk.text.lower()
            c_words = set(re.findall(r"\w+", c_lower)) - STOPWORDS
            matches = q_words & c_words
            if not matches:
                continue

            base_score = len(matches) / (len(q_words) + 1)
            word_count = len(re.findall(r"\w+", chunk.text)) or 1
            tf_score = sum(c_lower.count(w) for w in matches) / word_count

            section_lower = chunk.section.lower()
            bonus = 0.0
            if any(w in q_lower for w in ("method", "methodology", "approach", "model", "algorithm", "architecture", "framework")):
                if any(s in section_lower for s in ("method", "model", "approach", "architecture", "framework")):
                    bonus += 0.4
            if any(w in q_lower for w in ("dataset", "data", "benchmark", "experiment", "setup", "evaluation", "setting")):
                if any(s in section_lower for s in ("experiment", "dataset", "setup", "evaluation", "benchmark")):
                    bonus += 0.4
            if any(w in q_lower for w in ("result", "performance", "accuracy", "metric", "finding", "score", "improvement")):
                if any(s in section_lower for s in ("result", "performance", "discussion", "evaluation", "analysis")):
                    bonus += 0.4
            if any(w in q_lower for w in ("limitation", "gap", "future", "constraint", "weakness", "threat", "bottleneck")):
                if any(s in section_lower for s in ("limitation", "gap", "future", "threat", "discussion")):
                    bonus += 0.4
            if any(w in q_lower for w in ("abstract", "summary", "overview", "contribution", "summarize")):
                if "abstract" in section_lower or chunk.page == 1:
                    bonus += 0.35
            if any(w in q_lower for w in ("conclusion", "conclude", "finding")):
                if "conclusion" in section_lower:
                    bonus += 0.35

            total = base_score + tf_score * 0.5 + bonus
            chunk_scored = Chunk(
                id=chunk.id, doc_id=chunk.doc_id, doc_name=chunk.doc_name,
                page=chunk.page, section=chunk.section, text=chunk.text,
                relevance_score=round(total, 4),
            )
            scored.append((total, chunk_scored))

        scored.sort(key=lambda x: x[0], reverse=True)

        seen_prefixes: set = set()
        result: List[Chunk] = []
        for _, chunk in scored:
            prefix = chunk.text[:80]
            if prefix not in seen_prefixes:
                seen_prefixes.add(prefix)
                result.append(chunk)
            if len(result) >= top_k:
                break
        return result

    def _expand_query(self, query: str) -> str:
        expansions = {
            "method":     "methodology approach technique algorithm model",
            "result":     "performance accuracy metric evaluation benchmark finding",
            "dataset":    "data corpus benchmark training testing evaluation split",
            "limitation": "limitation constraint weakness gap future work threat",
            "abstract":   "overview summary contribution introduction",
            "conclusion": "conclusion summary finding contribution",
        }
        q_lower = query.lower()
        extra = [terms for key, terms in expansions.items() if key in q_lower]
        return (query + " " + " ".join(extra)).strip() if extra else query

    def _gemini_generate(self, query: str, chunks: List[Chunk]) -> str:
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not GENAI_AVAILABLE or not api_key or genai is None:
            return self._verbatim_fallback(chunks)

        try:
            genai.configure(api_key=api_key)
            passages = []
            for i, chunk in enumerate(chunks, 1):
                passages.append(
                    f"[Evidence {i}] Source: {chunk.doc_name} | "
                    f"Page {chunk.page} | Section: {chunk.section}\n{chunk.text}"
                )
            context_block = "\n\n---\n\n".join(passages)

            prompt = (
                "You are R-Lens, a strict evidence-grounded academic research assistant.\n\n"
                "ABSOLUTE RULES:\n"
                "1. Answer ONLY using the evidence passages below. Never use outside knowledge.\n"
                "2. Every factual statement MUST include an inline citation: [filename - Page N].\n"
                "3. If the answer is not in the evidence, respond EXACTLY: "
                "'This information was not found in the uploaded document.'\n"
                "4. Never invent numbers, names, datasets, percentages, or model names.\n"
                "5. Do not reference any paper not present in the evidence.\n\n"
                f"=== RETRIEVED EVIDENCE FROM UPLOADED DOCUMENT ===\n\n{context_block}\n\n"
                f"=== USER QUESTION ===\n{query}\n\n"
                "=== GROUNDED ANSWER (cite every fact) ==="
            )

            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            if response and response.text and len(response.text.strip()) > 10:
                return response.text.strip()
        except Exception as exc:
            print(f"[PDFRAGService] Gemini API error: {exc}")

        return self._verbatim_fallback(chunks)

    def _verbatim_fallback(self, chunks: List[Chunk]) -> str:
        bullets = []
        for chunk in chunks[:4]:
            bullets.append(
                f"**{chunk.section}** [{chunk.doc_name} - Page {chunk.page}]"
                f" (relevance: {chunk.relevance_score:.3f})\n\n{chunk.text.strip()}"
            )
        return f"Retrieved evidence from **{chunks[0].doc_name}**:\n\n" + "\n\n---\n\n".join(bullets)

    def _extract_title(self, first_page: str, filename: str) -> str:
        if not first_page:
            return filename.replace(".pdf", "").replace("_", " ")
        lines = [l.strip() for l in first_page.split("\n") if len(l.strip()) > 5]
        if not lines:
            return filename.replace(".pdf", "").replace("_", " ")
        candidate = lines[0]
        if len(candidate) < 8 and len(lines) > 1:
            candidate = lines[1]
        if len(candidate) > 160:
            candidate = candidate[:160].rsplit(" ", 1)[0] + "..."
        return candidate

    def _extract_authors(self, first_page: str) -> str:
        if not first_page:
            return "Unavailable"
        lines = [l.strip() for l in first_page.split("\n") if 3 < len(l.strip()) < 200]
        for line in lines[1:6]:
            if re.search(r"(?i)\b(abstract|introduction|doi|journal|ieee|acm|arxiv|springer|copyright|all rights)\b", line):
                continue
            if re.search(r",|\band\b|[A-Z][a-z]+\s+[A-Z]", line):
                return line[:200]
        return "Unavailable"

    def _extract_year(self, first_page: str) -> str:
        m = re.search(r"\b(20[0-2]\d)\b", first_page)
        return m.group(1) if m else "Unavailable"

    def _extract_doi(self, first_page: str) -> str:
        m = re.search(r"\b(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)\b", first_page)
        return m.group(1) if m else "Unavailable"

    def _extract_venue(self, first_page: str) -> str:
        m = re.search(
            r"(?i)\b(IEEE|ACM|Springer|Elsevier|Nature|Science|NeurIPS|ICLR|"
            r"AAAI|ICML|arXiv|Proceedings of [A-Za-z\s]{3,40}|Journal of [A-Za-z\s]{3,40})\b",
            first_page,
        )
        return m.group(0).strip() if m else "Uploaded Research Document"

    def _build_sections_and_chunks(
        self,
        pages_text: Dict[int, str],
        doc_id: str,
        filename: str,
    ) -> Tuple[List[SectionInfo], List[Chunk]]:
        sections: List[SectionInfo] = []
        chunks: List[Chunk] = []
        section_set: set = set()
        current_section = "Document Body"
        chunk_idx = 0

        for page_num in sorted(pages_text.keys()):
            page_text = pages_text[page_num]

            for pat, sec_name in SECTION_PATTERNS:
                if pat.search(page_text):
                    current_section = sec_name
                    key = (sec_name, page_num)
                    if key not in section_set:
                        section_set.add(key)
                        preview = page_text.strip()[:160]
                        sections.append(SectionInfo(
                            id=f"sec-{doc_id}-p{page_num}-{len(sections)+1}",
                            title=sec_name,
                            page=page_num,
                            content_preview=preview + ("..." if len(preview) >= 160 else ""),
                        ))
                    break

            for para in re.split(r"\n{2,}", page_text):
                para = para.strip()
                if len(para) < 40:
                    continue
                if re.fullmatch(r"[\d\s\W]+", para):
                    continue
                for sub in self._split_sub_chunks(para):
                    sub = sub.strip()
                    if len(sub) < 30:
                        continue
                    chunks.append(Chunk(
                        id=f"chk-{doc_id}-p{page_num}-{chunk_idx}",
                        doc_id=doc_id,
                        doc_name=filename,
                        page=page_num,
                        section=current_section,
                        text=sub,
                        relevance_score=0.0,
                    ))
                    chunk_idx += 1

        if not sections:
            for page_num in sorted(pages_text.keys()):
                preview = pages_text[page_num].strip()[:160]
                sections.append(SectionInfo(
                    id=f"sec-{doc_id}-page{page_num}",
                    title=f"Page {page_num}",
                    page=page_num,
                    content_preview=preview + ("..." if len(preview) >= 160 else ""),
                ))

        return sections, chunks

    def _split_sub_chunks(self, text: str, max_chars: int = 500, overlap: int = 50) -> List[str]:
        if len(text) <= max_chars:
            return [text]
        result = []
        start = 0
        while start < len(text):
            end = start + max_chars
            if end < len(text):
                break_at = text.rfind(" ", start, end)
                if break_at > start:
                    end = break_at
            result.append(text[start:end])
            start = end - overlap
            if start >= len(text):
                break
        return result


pdf_rag_service = PDFRAGService()
