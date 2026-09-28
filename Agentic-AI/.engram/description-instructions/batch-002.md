# Node Description Batch 3 of 27

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

- "agent_callbacks_activityrecorder_note": ".note()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L104 | neighbors=[ActivityRecorder, ActivityEvent, ._add(), .on_agent_action(), .on_agent_finish(), .on_llm_start()]
- "agent_executor_run_basic_rag": "run_basic_rag()" | kind=code-symbol | source=backend/services/agent/executor.py:L192 | neighbors=[executor.py, Single retrieve + single generate. No p…, run(), _evidence_prompt(), _paper_records(), _persist()]
- "llm_gemini_geminillm": "GeminiLLM" | kind=code-symbol | source=backend/services/llm/gemini.py:L26 | neighbors=[gemini.py, BaseLLM, BaseLLM, LLMError, LLMResult, ._ensure()]
- "models_schemas_compliancechecks": "ComplianceChecks" | kind=code-symbol | source=backend/models/schemas.py:L77 | neighbors=[schemas.py, BaseModel, Evidence matrix + citation export, repo…, Persist a reviewer's status decision ag…, Verified citations, keyed by marker., BibTeX built from real document metadat…]
- "models_schemas_empiricalresult": "EmpiricalResult" | kind=code-symbol | source=backend/models/schemas.py:L73 | neighbors=[schemas.py, BaseModel, Evidence matrix + citation export, repo…, Persist a reviewer's status decision ag…, Verified citations, keyed by marker., BibTeX built from real document metadat…]
- "models_schemas_evidencematrixrow": "EvidenceMatrixRow" | kind=code-symbol | source=backend/models/schemas.py:L82 | neighbors=[schemas.py, BaseModel, Evidence matrix + citation export, repo…, Persist a reviewer's status decision ag…, Verified citations, keyed by marker., BibTeX built from real document metadat…]
- "pages_aiwriter": "AIWriter.tsx" | kind=code-symbol | source=frontend/src/pages/AIWriter.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), AIWriter(), SUGGESTIONS, TEMPLATES]
- "pages_citationgenerator": "CitationGenerator.tsx" | kind=code-symbol | source=frontend/src/pages/CitationGenerator.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), CitationGenerator(), CitationResult, FORMATS]
- "routers_pdf": "pdf.py" | kind=code-symbol | source=backend/routers/pdf.py:L1 | neighbors=[d6c5367 commit, delete_document(), get_all_documents(), get_document(), query_pdf_rag(), QueryRequest]
- "services_discovery_fakearxivclient": "_FakeArxivClient" | kind=code-symbol | source=backend/services/discovery.py:L115 | neighbors=[discovery.py, discover(), ArxivClient, .download_pdf(), .__init__(), .search()]
- "services_embeddings_openrouterembedder": "OpenRouterEmbedder" | kind=code-symbol | source=backend/services/embeddings.py:L70 | neighbors=[embeddings.py, build_embedder(), Embedder, .embed(), .embed_batch(), .__init__()]
- "services_pdf_rag_service": "pdf_rag_service.py" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L1 | neighbors=[d6c5367 commit, pdf.py, ingest.py, AgenticRAGResponse, Citation, PDFDocument]
- "services_pdf_rag_service_agenticragresponse": "AgenticRAGResponse" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L60 | neighbors=[QueryRequest, Returns list of currently indexed PDF d…, Upload a PDF. Extracts real text via Py…, Multi-step Agentic RAG over the uploade…, Removes a document from the active sess…, pdf_rag_service.py]
- "services_pdf_rag_service_pdfdocument": "PDFDocument" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L38 | neighbors=[QueryRequest, Returns list of currently indexed PDF d…, Upload a PDF. Extracts real text via Py…, Multi-step Agentic RAG over the uploade…, Removes a document from the active sess…, pdf_rag_service.py]
- "services_pdf_rag_service_pdfragservice": "PDFRAGService" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L72 | neighbors=[pdf_rag_service.py, .delete_document(), .get_all_documents(), .get_document(), .process_uploaded_pdf(), .query_agentic_rag()]
- "services_research_service": "research_service.py" | kind=code-symbol | source=backend/services/research_service.py:L1 | neighbors=[d6c5367 commit, evidence.py, schemas.py, paper_service.py, build_evidence_matrix(), ResearchService]
- "services_researchservice_researchservice": "ResearchService" | kind=code-symbol | source=frontend/src/services/researchService.ts:L37 | neighbors=[Topbar.tsx, EvidenceValidation.tsx, ResearchWorkspace.tsx, researchService.ts, .exportMatrixCsv(), .generateBibTeX()]
- "tests_conftest": "conftest.py" | kind=code-symbol | source=backend/tests/conftest.py:L1 | neighbors=[chunks(), clean_db(), corpus(), _corpus_restorer(), real_corpus(), _schema()]
- "tests_test_feedback_revise": "_revise()" | kind=code-symbol | source=backend/tests/test_feedback.py:L49 | neighbors=[test_feedback.py, Revise, resuming via a reply whenever t…, test_feedback_reruns_with_exclusion_and…, test_feedback_terms_flow_into_the_retri…, test_revise_allows_multiple_rounds(), test_revision_survives_reload_like_a_re…]
- "agent_init_rationale_1": "Agentic literature-review engine.  `from services.agent import run, MODES` is th" | kind=entity | source=backend/services/agent/__init__.py:L1 | neighbors=[ActivityEvent, ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, RunResult, __init__.py]
- "backend_db_cache_discovery": "cache_discovery()" | kind=code-symbol | source=backend/db.py:L650 | neighbors=[db.py, _dumps(), init_db(), now(), transaction(), Store a fresh-topic search result so re…]
- "backend_db_now": "now()" | kind=code-symbol | source=backend/db.py:L227 | neighbors=[db.py, cache_discovery(), create_session(), record_eval_run(), set_approval(), update_session()]
- "layout_topbar": "Topbar.tsx" | kind=code-symbol | source=frontend/src/components/layout/Topbar.tsx:L1 | neighbors=[d6c5367 commit, AppLayout.tsx, ResearchContext.tsx, useResearch(), Topbar(), researchService.ts]
- "pages_paperanalysis": "PaperAnalysis.tsx" | kind=code-symbol | source=frontend/src/pages/PaperAnalysis.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), mockResearchData.ts, MOCK_PAPERS, PaperAnalysis()]
- "services_discovery_arxivclient": "ArxivClient" | kind=code-symbol | source=backend/services/discovery.py:L28 | neighbors=[discovery.py, .download_pdf(), .search(), discover(), _FakeArxivClient, ingest_candidate()]
- "services_discovery_discover": "discover()" | kind=code-symbol | source=backend/services/discovery.py:L265 | neighbors=[discovery.py, ArxivClient, _dedupe_and_filter(), _FakeArxivClient, _poor_coverage(), _safe_search()]
- "services_embeddings": "embeddings.py" | kind=code-symbol | source=backend/services/embeddings.py:L1 | neighbors=[build_embedder(), Embedder, FakeEmbedder, OpenRouterEmbedder, Embeddings: one documented model via Op…, test_vectorstore.py]
- "services_paper_service_paperservice": "PaperService" | kind=code-symbol | source=backend/services/paper_service.py:L65 | neighbors=[paper_service.py, Paper, .get_paper_by_id(), .get_papers(), ._rows(), ._to_paper()]
- "services_paperservice": "paperService.ts" | kind=code-symbol | source=frontend/src/services/paperService.ts:L1 | neighbors=[d6c5367 commit, mockResearchData.ts, MOCK_PAPERS, PaperService, index.ts, FilterState]
- "services_workflow_answer_user": "answer_user()" | kind=code-symbol | source=backend/services/workflow.py:L524 | neighbors=[workflow.py, _finalize_revision(), run_review(), _run_with_question(), WorkflowError, Resume a session that paused to ask the…]
- "services_workflow_run_review": "run_review()" | kind=code-symbol | source=backend/services/workflow.py:L259 | neighbors=[workflow.py, answer_user(), Execute the configured mode for a sessi…, _enrich_citations(), _resolve_provider(), WorkflowError]
- "services_workflow_run_with_question": "_run_with_question()" | kind=code-symbol | source=backend/services/workflow.py:L425 | neighbors=[workflow.py, answer_user(), Run the session's agent over a possibly…, revise_review(), _enrich_citations(), _resolve_provider()]
- "tests_test_discovery_fake_client": "_fake_client()" | kind=code-symbol | source=backend/tests/test_discovery.py:L46 | neighbors=[test_discovery.py, test_discover_caches_and_reuses(), test_discover_empty_question_is_harmles…, test_discover_returns_canonical_candida…, test_ingest_abstract_only_when_pdf_unav…, test_ingest_full_text_pdf()]
- "agent_executor_rationale_1": "The three run modes, and the agent loop that drives the agentic one.  Modes ----" | kind=entity | source=backend/services/agent/executor.py:L1 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, executor.py, OfflineReactPolicy, ToolContext]
- "agent_executor_rationale_141": "Answer with no retrieval at all. Deliberately hallucination-prone." | kind=entity | source=backend/services/agent/executor.py:L141 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, run_no_rag(), OfflineReactPolicy, ToolContext]
- "agent_executor_rationale_200": "Single retrieve + single generate. No planning, no tools, no reflection." | kind=entity | source=backend/services/agent/executor.py:L200 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, run_basic_rag(), OfflineReactPolicy, ToolContext]
- "agent_executor_rationale_293": "The full agentic loop. May pause for human input; may refuse to answer." | kind=entity | source=backend/services/agent/executor.py:L293 | neighbors=[ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded, run_agentic(), OfflineReactPolicy, ToolContext]
- "agent_executor_run_no_rag": "run_no_rag()" | kind=code-symbol | source=backend/services/agent/executor.py:L135 | neighbors=[executor.py, Answer with no retrieval at all. Delibe…, run(), _persist(), RunResult, .to_dict()]
- "agent_offline_policy": "offline_policy.py" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L1 | neighbors=[expand_query(), OfflineReactPolicy, _parse_scratchpad(), _question_from_prompt(), retrieval.py, Deterministic ReAct policy for the offl…]
- "agent_tools": "tools.py" | kind=code-symbol | source=backend/services/agent/tools.py:L1 | neighbors=[_assign_markers(), build_tools(), _fmt_passage(), re_insufficient(), ToolContext, Agent tools.  Two design points matter …]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-002.json

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
