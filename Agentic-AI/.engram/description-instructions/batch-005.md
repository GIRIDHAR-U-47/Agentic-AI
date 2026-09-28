# Node Description Batch 6 of 27

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

- "agent_reflection_split_claims": "split_claims()" | kind=code-symbol | source=backend/services/agent/reflection.py:L126 | neighbors=[reflection.py, is_heading_free(), Split an answer into checkable claim un…, verify()] | lang=en
- "agent_tools_rationale_1": "Agent tools.  Two design points matter here and both are load-bearing for the br" | kind=entity | source=backend/services/agent/tools.py:L1 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, tools.py] | lang=en
- "agent_tools_rationale_33": "Per-run state shared by the tools." | kind=entity | source=backend/services/agent/tools.py:L33 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, ToolContext] | lang=en
- "agent_tools_rationale_66": "Stable per-document markers so a citation always names its source." | kind=entity | source=backend/services/agent/tools.py:L66 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, _assign_markers()] | lang=pt
- "agent_tools_rationale_70": "Stable per-document markers so a citation always names its source." | kind=entity | source=backend/services/agent/tools.py:L70 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, _assign_markers()] | lang=pt
- "agent_tools_rationale_79": "Return LangChain `Tool` objects bound to this run's context." | kind=entity | source=backend/services/agent/tools.py:L79 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, build_tools()] | lang=en
- "agent_tools_rationale_83": "Return LangChain `Tool` objects bound to this run's context." | kind=entity | source=backend/services/agent/tools.py:L83 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, build_tools()] | lang=en
- "backend_config_providerspec_key_present": ".key_present()" | kind=code-symbol | source=backend/config.py:L93 | neighbors=[available_providers(), default_provider(), llm_status(), ProviderSpec] | lang=en
- "backend_db_dumps": "_dumps()" | kind=code-symbol | source=backend/db.py:L231 | neighbors=[db.py, cache_discovery(), record_eval_run(), update_session()] | lang=en
- "backend_db_get_discovery_cache": "get_discovery_cache()" | kind=code-symbol | source=backend/db.py:L686 | neighbors=[db.py, cursor(), init_db(), _loads()] | lang=en
- "backend_db_get_session": "get_session()" | kind=code-symbol | source=backend/db.py:L466 | neighbors=[db.py, cursor(), init_db(), _loads()] | lang=en
- "backend_db_list_eval_runs": "list_eval_runs()" | kind=code-symbol | source=backend/db.py:L637 | neighbors=[db.py, cursor(), init_db(), _loads()] | lang=en
- "backend_db_loads": "_loads()" | kind=code-symbol | source=backend/db.py:L235 | neighbors=[db.py, get_discovery_cache(), get_session(), list_eval_runs()] | lang=en
- "backend_db_replace_citations": "replace_citations()" | kind=code-symbol | source=backend/db.py:L562 | neighbors=[db.py, init_db(), new_id(), transaction()] | lang=en
- "backend_db_upsert_document": "upsert_document()" | kind=code-symbol | source=backend/db.py:L247 | neighbors=[db.py, init_db(), now(), transaction()] | lang=en
- "data_mockresearchdata_mock_papers": "MOCK_PAPERS" | kind=code-symbol | source=frontend/src/data/mockResearchData.ts:L3 | neighbors=[mockResearchData.ts, PaperAnalysis.tsx, ResearchWorkspace.tsx, paperService.ts] | lang=en
- "eval_metrics_fact_hit": "fact_hit()" | kind=code-symbol | source=backend/eval/metrics.py:L49 | neighbors=[metrics.py, _norm(), factual_accuracy(), A gold fact is hit if its quote survive…] | lang=en
- "eval_run_eval_run_matrix": "run_matrix()" | kind=code-symbol | source=backend/eval/run_eval.py:L91 | neighbors=[run_eval.py, main(), _provider_state(), _run_cell()] | lang=en
- "llm_gemini_rationale_1": "Google Gemini provider.  Uses the LangChain integration (`langchain_google_genai" | kind=entity | source=backend/services/llm/gemini.py:L1 | neighbors=[BaseLLM, LLMError, LLMResult, gemini.py] | lang=en
- "llm_offline_extractivellm_generate": ".generate()" | kind=code-symbol | source=backend/services/llm/offline.py:L258 | neighbors=[ExtractiveLLM, ._compose(), ._question(), parse_evidence()] | lang=en
- "llm_offline_mmr": "_mmr()" | kind=code-symbol | source=backend/services/llm/offline.py:L198 | neighbors=[offline.py, ._compose(), _content_tokens(), Maximal Marginal Relevance selection to…] | lang=en
- "llm_openai_compat_rationale_1": "OpenAI provider, also covering any OpenAI-compatible endpoint.  `OPENAI_BASE_URL" | kind=entity | source=backend/services/llm/openai_compat.py:L1 | neighbors=[BaseLLM, LLMError, LLMResult, openai_compat.py] | lang=en
- "pages_templates": "Templates.tsx" | kind=code-symbol | source=frontend/src/pages/Templates.tsx:L1 | neighbors=[d6c5367 commit, CATEGORIES, TEMPLATES, App.tsx] | lang=en
- "routers_discovery": "discovery.py" | kind=code-symbol | source=backend/routers/discovery.py:L1 | neighbors=[cache(), discover(), DiscoverIn, Fresh-topic discovery endpoint: search …] | lang=en
- "routers_pdf_queryrequest": "QueryRequest" | kind=code-symbol | source=backend/routers/pdf.py:L9 | neighbors=[pdf.py, BaseModel, AgenticRAGResponse, PDFDocument] | lang=en
- "scripts_fetch_corpus_main": "main()" | kind=code-symbol | source=backend/scripts/fetch_corpus.py:L71 | neighbors=[fetch_corpus.py, load_manifest(), save_manifest(), sha256()] | lang=en
- "services_arxiv_arxiverror": "ArxivError" | kind=code-symbol | source=backend/services/arxiv.py:L27 | neighbors=[arxiv.py, RuntimeError, _get(), _query()] | lang=en
- "services_discovery_dedupe_and_filter": "_dedupe_and_filter()" | kind=code-symbol | source=backend/services/discovery.py:L370 | neighbors=[discovery.py, _canonical(), discover(), Dedupe by arXiv id (and, weakly, by nor…] | lang=en
- "services_ingest_extract_pages": "extract_pages()" | kind=code-symbol | source=backend/services/ingest.py:L84 | neighbors=[ingest.py, _clean(), ingest_pdf(), Return {page_number: text} plus the pag…] | lang=en
- "services_paper_service_paperservice_get_papers": ".get_papers()" | kind=code-symbol | source=backend/services/paper_service.py:L117 | neighbors=[PaperService, _method_tag(), ._rows(), ._to_paper()] | lang=en
- "services_paperservice_paperservice": "PaperService" | kind=code-symbol | source=frontend/src/services/paperService.ts:L4 | neighbors=[paperService.ts, .getPaperById(), .getPapers(), .updatePaperValidation()] | lang=en
- "services_pdf_rag_service_pdfragservice_query_agentic_rag": ".query_agentic_rag()" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L99 | neighbors=[PDFRAGService, AgenticRAGResponse, Citation, Grounded answer over an explicit docume…] | lang=en
- "services_research_service_rationale_1": "Evidence matrix + citation export, repointed from mock data to real data.  Why t" | kind=entity | source=backend/services/research_service.py:L1 | neighbors=[ComplianceChecks, EmpiricalResult, EvidenceMatrixRow, research_service.py] | lang=en
- "services_research_service_rationale_109": "Persist a reviewer's status decision against the session." | kind=entity | source=backend/services/research_service.py:L109 | neighbors=[ComplianceChecks, EmpiricalResult, EvidenceMatrixRow, .update_evidence_status()] | lang=en
- "services_research_service_rationale_128": "Verified citations, keyed by marker." | kind=entity | source=backend/services/research_service.py:L128 | neighbors=[ComplianceChecks, EmpiricalResult, EvidenceMatrixRow, .get_report_citations()] | lang=en
- "services_research_service_rationale_132": "BibTeX built from real document metadata. Never invents an identifier." | kind=entity | source=backend/services/research_service.py:L132 | neighbors=[ComplianceChecks, EmpiricalResult, EvidenceMatrixRow, .generate_bibtex()] | lang=en
- "services_research_service_rationale_44": "One row per paper that was actually cited in a verified review." | kind=entity | source=backend/services/research_service.py:L44 | neighbors=[ComplianceChecks, EmpiricalResult, EvidenceMatrixRow, build_evidence_matrix()] | lang=en
- "services_review_service_build_comparison_table": "build_comparison_table()" | kind=code-symbol | source=backend/services/review_service.py:L108 | neighbors=[review_service.py, assemble_review(), _blank(), One row per paper: what it claims, wher…] | lang=en
- "services_review_service_sentences_with_markers": "_sentences_with_markers()" | kind=code-symbol | source=backend/services/review_service.py:L80 | neighbors=[review_service.py, assemble_review(), Surviving claims, each keeping its inli…, _clean()] | lang=en
- "services_vectorstore_astravectorstore_post": "._post()" | kind=code-symbol | source=backend/services/vectorstore.py:L232 | neighbors=[AstraVectorStore, .delete_paper(), .retrieve(), .upsert_paper()] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-005.json

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
