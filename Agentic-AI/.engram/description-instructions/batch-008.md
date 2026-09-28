# Node Description Batch 9 of 27

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

- "services_agent_service_rationale_79": "Fully autonomous runs are not supported.          R-Lens is a human-in-the-loop" | kind=entity | source=backend/services/agent_service.py:L79 | neighbors=[ActivityEvent, AgentProvenanceStep, .set_autopilot_mode()] | lang=en
- "services_agent_service_rationale_89": "Record a researcher instruction on a session's activity log." | kind=entity | source=backend/services/agent_service.py:L89 | neighbors=[ActivityEvent, AgentProvenanceStep, .add_instruction()] | lang=pt
- "services_api_api": "api" | kind=code-symbol | source=frontend/src/services/api.ts:L47 | neighbors=[LiteratureReview.tsx, ResearchWorkspace.tsx, api.ts] | lang=en
- "services_arxiv_download_pdf": "download_pdf()" | kind=code-symbol | source=backend/services/arxiv.py:L115 | neighbors=[arxiv.py, pdf_url(), Download a paper PDF. Returns bytes; ca…] | lang=en
- "services_arxiv_get": "_get()" | kind=code-symbol | source=backend/services/arxiv.py:L31 | neighbors=[arxiv.py, ArxivError, _query()] | lang=en
- "services_arxiv_lookup": "lookup()" | kind=code-symbol | source=backend/services/arxiv.py:L88 | neighbors=[arxiv.py, _query(), Fetch authoritative metadata for one ar…] | lang=en
- "services_arxiv_parse_entry": "_parse_entry()" | kind=code-symbol | source=backend/services/arxiv.py:L48 | neighbors=[arxiv.py, _text(), _query()] | lang=en
- "services_arxiv_search": "search()" | kind=code-symbol | source=backend/services/arxiv.py:L94 | neighbors=[arxiv.py, Free-text arXiv search. Used by the age…, _query()] | lang=en
- "services_discovery_canonical": "_canonical()" | kind=code-symbol | source=backend/services/discovery.py:L223 | neighbors=[discovery.py, _dedupe_and_filter(), Normalise an arXiv entry into the candi…] | lang=en
- "services_discovery_ingest_abstract_only": "_ingest_abstract_only()" | kind=code-symbol | source=backend/services/discovery.py:L465 | neighbors=[discovery.py, ingest_candidate(), Persist a paper we could not fetch full…] | lang=en
- "services_discovery_minimal_pdf": "_minimal_pdf()" | kind=code-symbol | source=backend/services/discovery.py:L196 | neighbors=[discovery.py, .download_pdf(), A minimal single-page PDF that PyMuPDF …] | lang=en
- "services_discovery_poor_coverage": "_poor_coverage()" | kind=code-symbol | source=backend/services/discovery.py:L248 | neighbors=[discovery.py, discover(), True when barely any of the top candida…] | lang=en
- "services_ingest_extract_abstract": "extract_abstract()" | kind=code-symbol | source=backend/services/ingest.py:L187 | neighbors=[ingest.py, ingest_pdf(), Best-effort abstract capture from the e…] | lang=en
- "services_ingest_find_running_heads": "find_running_heads()" | kind=code-symbol | source=backend/services/ingest.py:L203 | neighbors=[ingest.py, build_sections_and_chunks(), Identify repeating page headers/footers…] | lang=en
- "services_ingest_guess_authors": "guess_authors()" | kind=code-symbol | source=backend/services/ingest.py:L137 | neighbors=[ingest.py, ingest_pdf(), Best-effort author line, or `""` when t…] | lang=en
- "services_ingest_guess_doi": "guess_doi()" | kind=code-symbol | source=backend/services/ingest.py:L166 | neighbors=[ingest.py, ingest_pdf(), DOI printed in the PDF, or `""`.     …] | lang=en
- "services_ingest_guess_year": "guess_year()" | kind=code-symbol | source=backend/services/ingest.py:L160 | neighbors=[ingest.py, ingest_pdf(), Publication year, or `""` when absent. …] | lang=en
- "services_ingest_prose_score": "prose_score()" | kind=code-symbol | source=backend/services/ingest.py:L345 | neighbors=[ingest.py, build_sections_and_chunks(), Heuristic 0..1 score for "is this real …] | lang=en
- "services_ingest_split_chunks": "split_chunks()" | kind=code-symbol | source=backend/services/ingest.py:L400 | neighbors=[ingest.py, build_sections_and_chunks(), Sentence-aware chunking with overlap. …] | lang=en
- "services_intentservice_analyzeintent": "analyzeIntent()" | kind=code-symbol | source=frontend/src/services/intentService.ts:L28 | neighbors=[ResearchHome.tsx, intentService.ts, generateSubQueries()] | lang=en
- "services_paper_service_method_category": "_method_category()" | kind=code-symbol | source=backend/services/paper_service.py:L36 | neighbors=[paper_service.py, ._to_paper(), Coarse classification from the paper's …] | lang=en
- "services_paper_service_method_tag": "_method_tag()" | kind=code-symbol | source=backend/services/paper_service.py:L52 | neighbors=[paper_service.py, .get_papers(), ._to_paper()] | lang=en
- "services_paper_service_paperservice_get_paper_by_id": ".get_paper_by_id()" | kind=code-symbol | source=backend/services/paper_service.py:L148 | neighbors=[PaperService, ._to_paper(), .update_paper_validation()] | lang=en
- "services_paper_service_paperservice_update_paper_validation": ".update_paper_validation()" | kind=code-symbol | source=backend/services/paper_service.py:L152 | neighbors=[PaperService, .get_paper_by_id(), Validation status is per-session (see a…] | lang=en
- "services_pdf_rag_service_citation": "Citation" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L52 | neighbors=[pdf_rag_service.py, BaseModel, .query_agentic_rag()] | lang=en
- "services_research_service_researchservice_generate_bibtex": ".generate_bibtex()" | kind=code-symbol | source=backend/services/research_service.py:L131 | neighbors=[BibTeX built from real document metadat…, ResearchService, ._bibtex()] | lang=en
- "services_research_service_researchservice_update_evidence_status": ".update_evidence_status()" | kind=code-symbol | source=backend/services/research_service.py:L106 | neighbors=[Persist a reviewer's status decision ag…, ResearchService, build_evidence_matrix()] | lang=en
- "services_researchservice_fetchcorpusdocs": "fetchCorpusDocs()" | kind=code-symbol | source=frontend/src/services/researchService.ts:L14 | neighbors=[researchService.ts, .exportMatrixCsv(), .generateBibTeX()] | lang=en
- "services_retrieval_bm25_score": ".score()" | kind=code-symbol | source=backend/services/retrieval.py:L169 | neighbors=[BM25, rank_papers(), retrieve()] | lang=en
- "services_retrieval_coverage_passes": "coverage_passes()" | kind=code-symbol | source=backend/services/retrieval.py:L128 | neighbors=[retrieval.py, lexical_coverage(), True when the retrieved passages plausi…] | lang=en
- "services_retrieval_detect_intents": "detect_intents()" | kind=code-symbol | source=backend/services/retrieval.py:L213 | neighbors=[retrieval.py, Which section signals does this query c…, retrieve()] | lang=en
- "services_retrieval_reciprocal_rank_fusion": "reciprocal_rank_fusion()" | kind=code-symbol | source=backend/services/retrieval.py:L191 | neighbors=[retrieval.py, Fuse several ranked id-lists into one s…, retrieve()] | lang=en
- "services_retrieval_retrievedchunk": "RetrievedChunk" | kind=code-symbol | source=backend/services/retrieval.py:L251 | neighbors=[retrieval.py, A chunk plus retrieval provenance. Beha…, dict] | lang=en
- "services_review_service_keywords": "_keywords()" | kind=code-symbol | source=backend/services/review_service.py:L91 | neighbors=[review_service.py, assemble_review(), Content words common to several claims …] | lang=en
- "services_review_service_render_markdown": "render_markdown()" | kind=code-symbol | source=backend/services/review_service.py:L254 | neighbors=[review_service.py, Plain-markdown rendering, used by the A…, Plain-markdown rendering, used by the A…] | lang=en
- "services_vectorstore_astravectorstore_retrieve": ".retrieve()" | kind=code-symbol | source=backend/services/vectorstore.py:L285 | neighbors=[AstraVectorStore, ._post(), cosine()] | lang=en
- "tests_test_agent_rationale_1": "Agent loop, approval gate, limits, and the insufficient-evidence path.  These ar" | kind=entity | source=backend/tests/test_agent.py:L1 | neighbors=[ActivityRecorder, ToolContext, test_agent.py] | lang=en
- "tests_test_agent_rationale_104": "A run cut short must not present the executor's stop string as content.      Lan" | kind=entity | source=backend/tests/test_agent.py:L104 | neighbors=[ActivityRecorder, ToolContext, test_exhausted_marker_is_not_reported_a…] | lang=en
- "tests_test_agent_rationale_154": "An unanswerable question must either be refused or paused for the human.      An" | kind=entity | source=backend/tests/test_agent.py:L154 | neighbors=[ActivityRecorder, ToolContext, test_out_of_scope_question_does_not_fab…] | lang=en
- "tests_test_agent_rationale_179": "Markers in the answer must match the citation records exactly.      These two na" | kind=entity | source=backend/tests/test_agent.py:L179 | neighbors=[ActivityRecorder, ToolContext, test_evidence_marker_namespace_is_consi…] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-008.json

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
