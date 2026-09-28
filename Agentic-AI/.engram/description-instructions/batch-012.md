# Node Description Batch 13 of 27

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
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "services_discovery_fakearxivclient_download_pdf": ".download_pdf()" | kind=code-symbol | source=backend/services/discovery.py:L154 | neighbors=[_FakeArxivClient, _minimal_pdf()]
- "services_discovery_list_cached_discoveries": "list_cached_discoveries()" | kind=code-symbol | source=backend/services/discovery.py:L510 | neighbors=[discovery.py, The last few fresh-topic searches, for …]
- "services_discovery_safe_search": "_safe_search()" | kind=code-symbol | source=backend/services/discovery.py:L358 | neighbors=[discovery.py, discover()]
- "services_embeddings_embedder_embed_batch": ".embed_batch()" | kind=code-symbol | source=backend/services/embeddings.py:L35 | neighbors=[Embedder, Default batch implementation (sequentia…]
- "services_embeddings_openrouterembedder_embed_batch": ".embed_batch()" | kind=code-symbol | source=backend/services/embeddings.py:L95 | neighbors=[OpenRouterEmbedder, Batch embed via OpenRouter's OpenAI-com…]
- "services_ingest_clean": "_clean()" | kind=code-symbol | source=backend/services/ingest.py:L80 | neighbors=[ingest.py, extract_pages()]
- "services_ingest_guess_title": "guess_title()" | kind=code-symbol | source=backend/services/ingest.py:L114 | neighbors=[ingest.py, ingest_pdf()]
- "services_ingest_guess_venue": "guess_venue()" | kind=code-symbol | source=backend/services/ingest.py:L177 | neighbors=[ingest.py, ingest_pdf()]
- "services_intentservice_generatesubqueries": "generateSubQueries()" | kind=code-symbol | source=frontend/src/services/intentService.ts:L211 | neighbors=[intentService.ts, analyzeIntent()]
- "services_intentservice_intentanalysisresult": "IntentAnalysisResult" | kind=code-symbol | source=frontend/src/services/intentService.ts:L11 | neighbors=[ResearchHome.tsx, intentService.ts]
- "services_paper_service_paperservice_rows": "._rows()" | kind=code-symbol | source=backend/services/paper_service.py:L66 | neighbors=[PaperService, .get_papers()]
- "services_paper_service_rationale_1": "Paper service, repointed from mock data to the real corpus.  What changed and wh" | kind=entity | source=backend/services/paper_service.py:L1 | neighbors=[Paper, paper_service.py]
- "services_paper_service_rationale_153": "Validation status is per-session (see approvals), not a paper property." | kind=entity | source=backend/services/paper_service.py:L153 | neighbors=[Paper, .update_paper_validation()]
- "services_paper_service_rationale_37": "Coarse classification from the paper's own text, not from a fixed table." | kind=entity | source=backend/services/paper_service.py:L37 | neighbors=[Paper, _method_category()]
- "services_pdf_rag_service_pdfragservice_get_all_documents": ".get_all_documents()" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L79 | neighbors=[PDFRAGService, ._to_document()]
- "services_pdf_rag_service_pdfragservice_get_document": ".get_document()" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L88 | neighbors=[PDFRAGService, ._to_document()]
- "services_pdf_rag_service_pdfragservice_process_uploaded_pdf": ".process_uploaded_pdf()" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L75 | neighbors=[PDFRAGService, ._to_document()]
- "services_research_service_researchservice_bibtex": "._bibtex()" | kind=code-symbol | source=backend/services/research_service.py:L151 | neighbors=[ResearchService, .generate_bibtex()]
- "services_research_service_researchservice_export_matrix_csv": ".export_matrix_csv()" | kind=code-symbol | source=backend/services/research_service.py:L182 | neighbors=[ResearchService, build_evidence_matrix()]
- "services_research_service_researchservice_get_evidence_matrix": ".get_evidence_matrix()" | kind=code-symbol | source=backend/services/research_service.py:L103 | neighbors=[ResearchService, build_evidence_matrix()]
- "services_research_service_researchservice_get_report_citations": ".get_report_citations()" | kind=code-symbol | source=backend/services/research_service.py:L127 | neighbors=[Verified citations, keyed by marker., ResearchService]
- "services_research_service_session_status": "_session_status()" | kind=code-symbol | source=backend/services/research_service.py:L38 | neighbors=[research_service.py, build_evidence_matrix()]
- "services_researchservice_researchservice_exportmatrixcsv": ".exportMatrixCsv()" | kind=code-symbol | source=frontend/src/services/researchService.ts:L69 | neighbors=[ResearchService, fetchCorpusDocs()]
- "services_researchservice_researchservice_generatebibtex": ".generateBibTeX()" | kind=code-symbol | source=frontend/src/services/researchService.ts:L52 | neighbors=[ResearchService, fetchCorpusDocs()]
- "services_retrieval_rank": "_rank()" | kind=code-symbol | source=backend/services/retrieval.py:L208 | neighbors=[retrieval.py, retrieve()]
- "services_retrieval_section_boost": "section_boost()" | kind=code-symbol | source=backend/services/retrieval.py:L225 | neighbors=[retrieval.py, retrieve()]
- "services_retrieval_token_set": "token_set()" | kind=code-symbol | source=backend/services/retrieval.py:L82 | neighbors=[retrieval.py, tokenize()]
- "services_review_service_bucket": "_bucket()" | kind=code-symbol | source=backend/services/review_service.py:L64 | neighbors=[review_service.py, assemble_review()]
- "services_review_service_clean": "_clean()" | kind=code-symbol | source=backend/services/review_service.py:L73 | neighbors=[review_service.py, _sentences_with_markers()]
- "services_review_service_locator": "_locator()" | kind=code-symbol | source=backend/services/review_service.py:L244 | neighbors=[review_service.py, assemble_review()]
- "services_review_service_markers": "_markers()" | kind=code-symbol | source=backend/services/review_service.py:L250 | neighbors=[review_service.py, assemble_review()]
- "services_vectorstore_astravectorstore_delete_paper": ".delete_paper()" | kind=code-symbol | source=backend/services/vectorstore.py:L279 | neighbors=[AstraVectorStore, ._post()]
- "services_vectorstore_astravectorstore_upsert_paper": ".upsert_paper()" | kind=code-symbol | source=backend/services/vectorstore.py:L244 | neighbors=[AstraVectorStore, ._post()]
- "services_vectorstore_dot": "_dot()" | kind=code-symbol | source=backend/services/vectorstore.py:L45 | neighbors=[vectorstore.py, cosine()]
- "services_vectorstore_norm": "_norm()" | kind=code-symbol | source=backend/services/vectorstore.py:L49 | neighbors=[vectorstore.py, cosine()]
- "services_vectorstore_sqlitevectorstore_retrieve": ".retrieve()" | kind=code-symbol | source=backend/services/vectorstore.py:L151 | neighbors=[SqliteVectorStore, cosine()]
- "services_vectorstore_sync_all": "sync_all()" | kind=code-symbol | source=backend/services/vectorstore.py:L312 | neighbors=[vectorstore.py, build_vector_store()]
- "services_workflow_rationale_39": "A workflow step cannot proceed. Surfaced to the client as 400." | kind=entity | source=backend/services/workflow.py:L39 | neighbors=[WorkflowError, suggest_candidates()]
- "services_workflow_record_revision": "_record_revision()" | kind=code-symbol | source=backend/services/workflow.py:L492 | neighbors=[workflow.py, revise_review()]
- "src_main": "main.tsx" | kind=code-symbol | source=frontend/src/main.tsx:L1 | neighbors=[d6c5367 commit, App.tsx]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-012.json

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
