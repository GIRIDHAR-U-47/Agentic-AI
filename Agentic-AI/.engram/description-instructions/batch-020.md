# Node Description Batch 21 of 27

Engram is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the prompt below and write
your JSON answer to the answer file.

## Prompt

You are documenting nodes in a knowledge graph.
For each entry below, write ONE concise factual plain-language sentence
describing what it is or does. Use only the provided context.
For a code symbol (kind=code-symbol — a function, class, or constant),
describe what the function/symbol does based on its name, source location
and neighbors — e.g. "Resolves the configured ontology profile from graphify.yaml.".
For an entity node (any other kind — e.g. a person, place, event, object),
describe what the entity is and its role, grounded in its type, its
relations (neighbors) and the provided citations/evidence — e.g.
"Lady Carfax, a wealthy heiress who disappears en route to Lausanne.".
Ground entity descriptions in the citations/evidence when present; do not
speculate beyond the context, so a node with no supporting context may be
left out of the reply.
LANGUAGE: each entry has a `lang=` marker giving the language of its source.
Write that entry's description in EXACTLY that language. Do not translate to
a single common language — match each node's source language individually.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "services_pdf_rag_service_rationale_102": "Grounded answer over an explicit document set.          This is the *basic RAG*" | kind=entity | source=backend/services/pdf_rag_service.py:L102 | neighbors=[.query_agentic_rag()] | lang=en
- "services_pdf_rag_service_rationale_73": "Thin adapter: the real logic lives in `ingest`, `retrieval`, `agent`." | kind=entity | source=backend/services/pdf_rag_service.py:L73 | neighbors=[PDFRAGService] | lang=en
- "services_pdfservice_pdfservice_deletedocument": ".deleteDocument()" | kind=code-symbol | source=frontend/src/services/pdfService.ts:L62 | neighbors=[PDFService] | lang=en
- "services_pdfservice_pdfservice_getdocuments": ".getDocuments()" | kind=code-symbol | source=frontend/src/services/pdfService.ts:L8 | neighbors=[PDFService] | lang=en
- "services_pdfservice_pdfservice_queryagenticrag": ".queryAgenticRAG()" | kind=code-symbol | source=frontend/src/services/pdfService.ts:L76 | neighbors=[PDFService] | lang=en
- "services_pdfservice_pdfservice_uploadpdf": ".uploadPDF()" | kind=code-symbol | source=frontend/src/services/pdfService.ts:L28 | neighbors=[PDFService] | lang=en
- "services_researchservice_bibkey": "bibKey()" | kind=code-symbol | source=frontend/src/services/researchService.ts:L27 | neighbors=[researchService.ts] | lang=en
- "services_researchservice_researchservice_getevidencematrix": ".getEvidenceMatrix()" | kind=code-symbol | source=frontend/src/services/researchService.ts:L40 | neighbors=[ResearchService] | lang=en
- "services_researchservice_researchservice_updateevidencestatus": ".updateEvidenceStatus()" | kind=code-symbol | source=frontend/src/services/researchService.ts:L44 | neighbors=[ResearchService] | lang=en
- "services_retrieval_bm25_init": ".__init__()" | kind=code-symbol | source=backend/services/retrieval.py:L152 | neighbors=[BM25] | lang=en
- "services_retrieval_rationale_1": "Deterministic retrieval over the chunk store.  Design ------ The original `PDFRA" | kind=entity | source=backend/services/retrieval.py:L1 | neighbors=[retrieval.py] | lang=en
- "services_retrieval_rationale_107": "Which of the query's content terms survive in the retrieved passages.      A pas" | kind=entity | source=backend/services/retrieval.py:L107 | neighbors=[lexical_coverage()] | lang=en
- "services_retrieval_rationale_134": "True when the retrieved passages plausibly cover the question.      This is the" | kind=entity | source=backend/services/retrieval.py:L134 | neighbors=[coverage_passes()] | lang=en
- "services_retrieval_rationale_150": "Standard Okapi BM25 over an in-memory corpus of token lists." | kind=entity | source=backend/services/retrieval.py:L150 | neighbors=[BM25] | lang=en
- "services_retrieval_rationale_194": "Fuse several ranked id-lists into one score per id.      RRF is used instead of" | kind=entity | source=backend/services/retrieval.py:L194 | neighbors=[reciprocal_rank_fusion()] | lang=en
- "services_retrieval_rationale_214": "Which section signals does this query carry?" | kind=entity | source=backend/services/retrieval.py:L214 | neighbors=[detect_intents()] | lang=en
- "services_retrieval_rationale_252": "A chunk plus retrieval provenance. Behaves as a dict for JSON safety." | kind=entity | source=backend/services/retrieval.py:L252 | neighbors=[RetrievedChunk] | lang=pt
- "services_retrieval_rationale_262": "Rank `chunks` against `query`.      Returns dicts with retrieval provenance atta" | kind=entity | source=backend/services/retrieval.py:L262 | neighbors=[retrieve()] | lang=en
- "services_retrieval_rationale_347": "Rank whole papers (used for the candidate list shown before approval)." | kind=entity | source=backend/services/retrieval.py:L347 | neighbors=[rank_papers()] | lang=en
- "services_retrieval_rationale_87": "Query terms in order, duplicates removed, stopwords dropped." | kind=entity | source=backend/services/retrieval.py:L87 | neighbors=[content_terms()] | lang=en
- "services_review_service_rationale_1": "Assemble a structured, source-backed literature review.  This is the stage the m" | kind=entity | source=backend/services/review_service.py:L1 | neighbors=[review_service.py] | lang=en
- "services_review_service_rationale_111": "One row per paper: what it claims, where the claim came from.      The \"key idea" | kind=entity | source=backend/services/review_service.py:L111 | neighbors=[build_comparison_table()] | lang=en
- "services_review_service_rationale_147": "Build the structured review from verified, cited claims only.      `key_findings" | kind=entity | source=backend/services/review_service.py:L147 | neighbors=[assemble_review()] | lang=en
- "services_review_service_rationale_225": "Normalise a 'we do not know' placeholder to None." | kind=entity | source=backend/services/review_service.py:L225 | neighbors=[_blank()] | lang=pt
- "services_review_service_rationale_236": "Normalise a 'we do not know' placeholder to None." | kind=entity | source=backend/services/review_service.py:L236 | neighbors=[_blank()] | lang=pt
- "services_review_service_rationale_244": "Plain-markdown rendering, used by the API and the CLI smoke test." | kind=entity | source=backend/services/review_service.py:L244 | neighbors=[render_markdown()] | lang=en
- "services_review_service_rationale_255": "Plain-markdown rendering, used by the API and the CLI smoke test." | kind=entity | source=backend/services/review_service.py:L255 | neighbors=[render_markdown()] | lang=en
- "services_review_service_rationale_81": "Surviving claims, each keeping its inline `[Sn]` markers." | kind=entity | source=backend/services/review_service.py:L81 | neighbors=[_sentences_with_markers()] | lang=en
- "services_review_service_rationale_92": "Content words common to several claims -- candidate theme labels." | kind=entity | source=backend/services/review_service.py:L92 | neighbors=[_keywords()] | lang=en
- "services_vectorstore_astravectorstore_count": ".count()" | kind=code-symbol | source=backend/services/vectorstore.py:L339 | neighbors=[AstraVectorStore] | lang=en
- "services_vectorstore_astravectorstore_health": ".health()" | kind=code-symbol | source=backend/services/vectorstore.py:L342 | neighbors=[AstraVectorStore] | lang=en
- "services_vectorstore_astravectorstore_init": ".__init__()" | kind=code-symbol | source=backend/services/vectorstore.py:L223 | neighbors=[AstraVectorStore] | lang=en
- "services_vectorstore_chromavectorstore_count": ".count()" | kind=code-symbol | source=backend/services/vectorstore.py:L267 | neighbors=[ChromaVectorStore] | lang=en
- "services_vectorstore_chromavectorstore_delete_paper": ".delete_paper()" | kind=code-symbol | source=backend/services/vectorstore.py:L197 | neighbors=[ChromaVectorStore] | lang=en
- "services_vectorstore_chromavectorstore_health": ".health()" | kind=code-symbol | source=backend/services/vectorstore.py:L275 | neighbors=[ChromaVectorStore] | lang=en
- "services_vectorstore_chromavectorstore_init": ".__init__()" | kind=code-symbol | source=backend/services/vectorstore.py:L98 | neighbors=[ChromaVectorStore] | lang=en
- "services_vectorstore_chromavectorstore_retrieve": ".retrieve()" | kind=code-symbol | source=backend/services/vectorstore.py:L209 | neighbors=[ChromaVectorStore] | lang=en
- "services_vectorstore_chromavectorstore_upsert_paper": ".upsert_paper()" | kind=code-symbol | source=backend/services/vectorstore.py:L124 | neighbors=[ChromaVectorStore] | lang=en
- "services_vectorstore_rationale_1": "Vector retrieval: local persistent Chroma DB.  Requirement 4c of the pilot is a" | kind=entity | source=backend/services/vectorstore.py:L1 | neighbors=[vectorstore.py] | lang=en
- "services_vectorstore_rationale_212": "Astra DB Data API vector store (no extra dependency: httpx only).      Enabled o" | kind=entity | source=backend/services/vectorstore.py:L212 | neighbors=[AstraVectorStore] | lang=pt

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-020.json

Keep each description factual and concise (one sentence). No markdown, no prose
outside the JSON object. It is acceptable to omit a node if context is
insufficient — but include every node you can ground confidently.

Example answer format:
```json
{
  "node_id_1": "Resolves the configured ontology profile from graphify.yaml.",
  "node_id_2": "Colonel James Barclay, an antagonist in The Crooked Man."
}
```
