# Node Description Batch 2 of 27

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
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "agent_callbacks_activityevent": "ActivityEvent" | kind=code-symbol | source=backend/services/agent/callbacks.py:L26 | neighbors=[callbacks.py, .to_dict(), .note(), .on_llm_error(), .on_tool_error(), .on_tool_start()]
- "pages_researchhome": "ResearchHome.tsx" | kind=code-symbol | source=frontend/src/pages/ResearchHome.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), ResearchHome(), TOOL_ROW, TOOLS]
- "services_researchservice": "researchService.ts" | kind=code-symbol | source=frontend/src/services/researchService.ts:L1 | neighbors=[d6c5367 commit, Topbar.tsx, EvidenceValidation.tsx, ResearchWorkspace.tsx, mockResearchData.ts, MOCK_EVIDENCE_ROWS]
- "services_review_service": "review_service.py" | kind=code-symbol | source=backend/services/review_service.py:L1 | neighbors=[retrieval.py, assemble_review(), _blank(), _bucket(), build_comparison_table(), _clean()]
- "services_workflow_workflowerror": "WorkflowError" | kind=code-symbol | source=backend/services/workflow.py:L38 | neighbors=[workflow.py, answer_user(), get_session_view(), A workflow step cannot proceed. Surface…, _resolve_provider(), revise_review()]
- "tests_test_feedback": "test_feedback.py" | kind=code-symbol | source=backend/tests/test_feedback.py:L1 | neighbors=[_complete_review(), _revise(), test_excluding_every_approved_paper_is_…, test_exclusion_that_starves_evidence_as…, test_feedback_reruns_with_exclusion_and…, test_feedback_terms_flow_into_the_retri…]
- "llm_openai_compat_openaicompatllm": "OpenAICompatLLM" | kind=code-symbol | source=backend/services/llm/openai_compat.py:L27 | neighbors=[openai_compat.py, BaseLLM, BaseLLM, LLMError, LLMResult, ._ensure()]
- "pages_evidencevalidation": "EvidenceValidation.tsx" | kind=code-symbol | source=frontend/src/pages/EvidenceValidation.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), mockResearchData.ts, MOCK_EVIDENCE_ROWS, EvidenceValidation()]
- "routers_corpus": "corpus.py" | kind=code-symbol | source=backend/routers/corpus.py:L1 | neighbors=[arxiv_lookup(), ArxivLookupIn, corpus_stats(), DocumentOut, get_doc(), list_corpus()]
- "services_vectorstore": "vectorstore.py" | kind=code-symbol | source=backend/services/vectorstore.py:L1 | neighbors=[build_vector_store(), ChromaVectorStore, cosine(), _dot(), _norm(), sync_all()]
- "services_vectorstore_astravectorstore": "AstraVectorStore" | kind=code-symbol | source=backend/services/vectorstore.py:L211 | neighbors=[vectorstore.py, .count(), .delete_paper(), .health(), .__init__(), ._post()]
- "agent_executor_runresult": "RunResult" | kind=code-symbol | source=backend/services/agent/executor.py:L42 | neighbors=[executor.py, run_basic_rag(), run_no_rag(), ActivityRecorder, AgentNeedsUser, ToolBudgetExceeded]
- "eval_metrics": "metrics.py" | kind=code-symbol | source=backend/eval/metrics.py:L1 | neighbors=[action_taken_when_out_of_scope(), consistency(), _content(), estimate_cost_usd(), fact_hit(), factual_accuracy()]
- "llm_offline": "offline.py" | kind=code-symbol | source=backend/services/llm/offline.py:L1 | neighbors=[candidate_sentences(), _content_tokens(), ExtractiveLLM, is_heading(), is_self_contained(), _mmr()]
- "pages_extractdata": "ExtractData.tsx" | kind=code-symbol | source=frontend/src/pages/ExtractData.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), COLORS, EXTRACT_OPTIONS, ExtractData()]
- "routers_agents": "agents.py" | kind=code-symbol | source=backend/routers/agents.py:L1 | neighbors=[d6c5367 commit, AutoPilotIn, get_autopilot_status(), get_provenance_steps(), InstructionIn, list_agent_sessions()]
- "services_arxiv": "arxiv.py" | kind=code-symbol | source=backend/services/arxiv.py:L1 | neighbors=[ArxivError, download_pdf(), _get(), lookup(), _parse_entry(), pdf_url()]
- "services_ingest_ingest_pdf": "ingest_pdf()" | kind=code-symbol | source=backend/services/ingest.py:L434 | neighbors=[ingest.py, build_sections_and_chunks(), extract_abstract(), extract_pages(), guess_authors(), guess_doi()]
- "services_research_service_researchservice": "ResearchService" | kind=code-symbol | source=backend/services/research_service.py:L102 | neighbors=[research_service.py, ComplianceChecks, EmpiricalResult, EvidenceMatrixRow, ._bibtex(), .export_matrix_csv()]
- "services_retrieval_retrieve": "retrieve()" | kind=code-symbol | source=backend/services/retrieval.py:L255 | neighbors=[retrieval.py, Rank `chunks` against `query`.      Ret…, BM25, .score(), content_terms(), detect_intents()]
- "services_vectorstore_chromavectorstore": "ChromaVectorStore" | kind=code-symbol | source=backend/services/vectorstore.py:L80 | neighbors=[vectorstore.py, build_vector_store(), .count(), .delete_paper(), .health(), .__init__()]
- "services_vectorstore_sqlitevectorstore": "SqliteVectorStore" | kind=code-symbol | source=backend/services/vectorstore.py:L78 | neighbors=[vectorstore.py, build_vector_store(), Vectors live in the local `vectors` tab…, .count(), .delete_paper(), .health()]
- "agent_executor": "executor.py" | kind=code-symbol | source=backend/services/agent/executor.py:L1 | neighbors=[_evidence_prompt(), _paper_records(), _persist(), run(), run_agentic(), run_basic_rag()]
- "agent_offline_policy_offlinereactpolicy_next_action": ".next_action()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L173 | neighbors=[OfflineReactPolicy, expand_query(), ._emit_final(), ._finalise_answer(), ._insufficient_answer(), ._refine()]
- "backend_config": "config.py" | kind=code-symbol | source=backend/config.py:L1 | neighbors=[available_providers(), default_provider(), ensure_dirs(), get_provider(), Limits, llm_status()]
- "layout_applayout": "AppLayout.tsx" | kind=code-symbol | source=frontend/src/components/layout/AppLayout.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), AppLayout(), Sidebar.tsx, Sidebar()]
- "llm_openrouter_openrouterllm": "OpenRouterLLM" | kind=code-symbol | source=backend/services/llm/openrouter.py:L38 | neighbors=[openrouter.py, LLMError, OpenAICompatLLM, ._ensure(), .__init__(), OpenAICompatLLM]
- "pages_aidetector": "AIDetector.tsx" | kind=code-symbol | source=frontend/src/pages/AIDetector.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), AIDetector(), AnalysisResult, getHighlightColor()]
- "routers_evidence": "evidence.py" | kind=code-symbol | source=backend/routers/evidence.py:L1 | neighbors=[d6c5367 commit, export_bibtex(), export_matrix_csv(), get_citations(), get_evidence_matrix(), StatusUpdate]
- "services_agent_service_agentservice": "AgentService" | kind=code-symbol | source=backend/services/agent_service.py:L40 | neighbors=[agent_service.py, ActivityEvent, AgentProvenanceStep, .add_instruction(), .get_sessions(), .get_steps()]
- "services_embeddings_embedder": "Embedder" | kind=code-symbol | source=backend/services/embeddings.py:L24 | neighbors=[embeddings.py, .embed(), .embed_batch(), .label(), FakeEmbedder, OpenRouterEmbedder]
- "services_embeddings_fakeembedder": "FakeEmbedder" | kind=code-symbol | source=backend/services/embeddings.py:L49 | neighbors=[embeddings.py, build_embedder(), Embedder, .embed(), Deterministic, hashing-based, offline. …, Vector RAG: local persistent Chroma DB …]
- "services_paper_service": "paper_service.py" | kind=code-symbol | source=backend/services/paper_service.py:L1 | neighbors=[d6c5367 commit, papers.py, schemas.py, _method_category(), _method_tag(), PaperService]
- "services_retrieval_bm25": "BM25" | kind=code-symbol | source=backend/services/retrieval.py:L149 | neighbors=[retrieval.py, .__init__(), .score(), rank_papers(), Standard Okapi BM25 over an in-memory c…, retrieve()]
- "services_review_service_assemble_review": "assemble_review()" | kind=code-symbol | source=backend/services/review_service.py:L138 | neighbors=[review_service.py, _blank(), _bucket(), build_comparison_table(), _keywords(), _locator()]
- "services_vectorstore_build_vector_store": "build_vector_store()" | kind=code-symbol | source=backend/services/vectorstore.py:L289 | neighbors=[vectorstore.py, ChromaVectorStore, Instantiate the configured backend; Non…, sync_all(), sync_paper_vectors(), Instantiate the configured backend; Non…]
- "services_vectorstore_vectorstore": "VectorStore" | kind=code-symbol | source=backend/services/vectorstore.py:L57 | neighbors=[vectorstore.py, ChromaVectorStore, .count(), .delete_paper(), .health(), .retrieve()]
- "tests_test_feedback_complete_review": "_complete_review()" | kind=code-symbol | source=backend/tests/test_feedback.py:L31 | neighbors=[test_feedback.py, test_excluding_every_approved_paper_is_…, test_exclusion_that_starves_evidence_as…, test_feedback_reruns_with_exclusion_and…, test_feedback_terms_flow_into_the_retri…, test_revise_allows_multiple_rounds()]
- "tests_test_providers": "test_providers.py" | kind=code-symbol | source=backend/tests/test_providers.py:L1 | neighbors=[test_build_llm_falls_back_to_offline_wi…, test_build_llm_returns_openrouter_with_…, test_eval_matrix_includes_openrouter_sl…, test_keyed_providers_are_not_available_…, test_run_review_refuses_mislabeled_offl…, test_start_session_refuses_mislabeled_o…]
- "agent_callbacks": "callbacks.py" | kind=code-symbol | source=backend/services/agent/callbacks.py:L1 | neighbors=[ActivityEvent, ActivityRecorder, AgentNeedsUser, _extract_hit_count(), _pick(), _stringify()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-001.json

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
