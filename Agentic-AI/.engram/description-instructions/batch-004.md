# Node Description Batch 5 of 27

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

- "llm_registry_rationale_1": "Provider factory and the LangChain adapter.  `build_llm()` returns a `BaseLLM` f" | kind=entity | source=backend/services/llm/registry.py:L1 | neighbors=[BaseLLM, LLMError, LLMResult, ExtractiveLLM, registry.py] | lang=en
- "llm_registry_rationale_128": "Wrap (and memoise) a BaseLLM as a LangChain chat model." | kind=entity | source=backend/services/llm/registry.py:L128 | neighbors=[BaseLLM, LLMError, LLMResult, ExtractiveLLM, as_chat_model()] | lang=pt
- "llm_registry_rationale_132": "Wrap (and memoise) a BaseLLM as a LangChain chat model." | kind=entity | source=backend/services/llm/registry.py:L132 | neighbors=[BaseLLM, LLMError, LLMResult, ExtractiveLLM, as_chat_model()] | lang=pt
- "llm_registry_rationale_136": "Wrap (and memoise) a BaseLLM as a LangChain chat model." | kind=entity | source=backend/services/llm/registry.py:L136 | neighbors=[BaseLLM, LLMError, LLMResult, ExtractiveLLM, as_chat_model()] | lang=pt
- "llm_registry_rationale_22": "Instantiate a provider. Never raises for a missing key -- falls back." | kind=entity | source=backend/services/llm/registry.py:L22 | neighbors=[BaseLLM, LLMError, LLMResult, ExtractiveLLM, build_llm()] | lang=pt
- "pages_agentgallery": "AgentGallery.tsx" | kind=code-symbol | source=frontend/src/pages/AgentGallery.tsx:L1 | neighbors=[d6c5367 commit, AgentGallery(), AGENTS, FILTERS, App.tsx] | lang=en
- "pages_comparison": "Comparison.tsx" | kind=code-symbol | source=frontend/src/pages/Comparison.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), Comparison(), App.tsx] | lang=en
- "pages_findtopics": "FindTopics.tsx" | kind=code-symbol | source=frontend/src/pages/FindTopics.tsx:L1 | neighbors=[d6c5367 commit, FindTopics(), TOPIC_CARDS, TRENDING_TOPICS, App.tsx] | lang=en
- "routers_collection": "collection.py" | kind=code-symbol | source=backend/routers/collection.py:L1 | neighbors=[collection_health(), delete_paper(), sync_all(), sync_paper(), Vector collection management.  Vectors …] | lang=en
- "runtimeerror": "RuntimeError" | kind=code-symbol | neighbors=[AgentNeedsUser, ToolBudgetExceeded, LLMError, ArxivError, WorkflowError] | lang=en
- "scripts_fetch_corpus": "fetch_corpus.py" | kind=code-symbol | source=backend/scripts/fetch_corpus.py:L1 | neighbors=[load_manifest(), main(), save_manifest(), sha256(), Download and ingest the pinned evaluati…] | lang=en
- "services_agentservice_agentservice": "AgentService" | kind=code-symbol | source=frontend/src/services/agentService.ts:L4 | neighbors=[agentService.ts, .addInstruction(), .getSteps(), .isAutoPilotMode(), .setAutoPilotMode()] | lang=en
- "services_discovery_ingest_candidate": "ingest_candidate()" | kind=code-symbol | source=backend/services/discovery.py:L399 | neighbors=[discovery.py, ArxivClient, _FakeArxivClient, _ingest_abstract_only(), Materialise an approved discovery candi…] | lang=en
- "services_ingest_build_sections_and_chunks": "build_sections_and_chunks()" | kind=code-symbol | source=backend/services/ingest.py:L250 | neighbors=[ingest.py, find_running_heads(), prose_score(), split_chunks(), ingest_pdf()] | lang=en
- "services_paper_service_paperservice_to_paper": "._to_paper()" | kind=code-symbol | source=backend/services/paper_service.py:L69 | neighbors=[PaperService, .get_paper_by_id(), .get_papers(), _method_category(), _method_tag()] | lang=en
- "services_pdf_rag_service_pdfragservice_to_document": "._to_document()" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L181 | neighbors=[PDFRAGService, .get_all_documents(), .get_document(), .process_uploaded_pdf(), PDFDocument] | lang=en
- "services_retrieval_lexical_coverage": "lexical_coverage()" | kind=code-symbol | source=backend/services/retrieval.py:L106 | neighbors=[retrieval.py, coverage_passes(), content_terms(), tokenize(), Which of the query's content terms surv…] | lang=en
- "services_review_service_blank": "_blank()" | kind=code-symbol | source=backend/services/review_service.py:L235 | neighbors=[review_service.py, assemble_review(), build_comparison_table(), Normalise a 'we do not know' placeholde…, Normalise a 'we do not know' placeholde…] | lang=en
- "services_vectorstore_cosine": "cosine()" | kind=code-symbol | source=backend/services/vectorstore.py:L53 | neighbors=[vectorstore.py, _dot(), _norm(), .retrieve(), .retrieve()] | lang=en
- "services_vectorstore_sync_paper_vectors": "sync_paper_vectors()" | kind=code-symbol | source=backend/services/vectorstore.py:L304 | neighbors=[vectorstore.py, Upsert one paper's passages into the co…, build_vector_store(), Upsert one paper's passages into the co…, Upsert one paper's passages into the co…] | lang=en
- "services_workflow_get_session_view": "get_session_view()" | kind=code-symbol | source=backend/services/workflow.py:L599 | neighbors=[workflow.py, WorkflowError, Everything the UI needs to render a res…, Everything the UI needs to render a res…, Everything the UI needs to render a res…] | lang=en
- "services_workflow_revise_review": "revise_review()" | kind=code-symbol | source=backend/services/workflow.py:L343 | neighbors=[workflow.py, Revise a completed review from research…, _record_revision(), _run_with_question(), WorkflowError] | lang=en
- "src_vite_env_d": "vite-env.d.ts" | kind=code-symbol | source=frontend/src/vite-env.d.ts:L1 | neighbors=[d6c5367 commit, *.jpeg, *.jpg, *.png, *.svg] | lang=en
- "tests_conftest_clean_db": "clean_db()" | kind=code-symbol | source=backend/tests/conftest.py:L73 | neighbors=[conftest.py, A database with the schema in place and…, A database with the schema in place and…, A database with the schema in place and…, Re-materialise the real corpus rows aft…] | lang=en
- "tests_conftest_corpus": "corpus()" | kind=code-symbol | source=backend/tests/conftest.py:L129 | neighbors=[conftest.py, Read-only view of the ingested real cor…, Read-only view of the ingested real cor…, Read-only view of the ingested real cor…, Read-only view of the ingested real cor…] | lang=en
- "tests_conftest_real_corpus": "real_corpus()" | kind=code-symbol | source=backend/tests/conftest.py:L81 | neighbors=[conftest.py, Ingest the cached real papers once per …, Ingest the cached real papers once per …, Ingest the cached real papers once per …, Ingest the cached real papers once per …] | lang=en
- "tests_test_feedback_test_feedback_terms_flow_into_the_retrieved_scope": "test_feedback_terms_flow_into_the_retrieved_scope()" | kind=code-symbol | source=backend/tests/test_feedback.py:L111 | neighbors=[test_feedback.py, Proving the feedback re-drives retrieva…, _complete_review(), _revise(), Proving the feedback re-drives retrieva…] | lang=en
- "tests_test_feedback_test_vectors_survive_revisions": "test_vectors_survive_revisions()" | kind=code-symbol | source=backend/tests/test_feedback.py:L190 | neighbors=[test_feedback.py, Vectors are never rebuilt or dropped by…, _complete_review(), _revise(), Vectors are never rebuilt or dropped by…] | lang=en
- "agent_callbacks_activityrecorder_last_dt": "._last_dt()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L277 | neighbors=[ActivityRecorder, .on_llm_end(), .on_llm_error(), .on_tool_end()] | lang=en
- "agent_callbacks_activityrecorder_on_llm_error": ".on_llm_error()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L196 | neighbors=[ActivityRecorder, ActivityEvent, ._add(), ._last_dt()] | lang=en
- "agent_callbacks_activityrecorder_on_tool_end": ".on_tool_end()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L227 | neighbors=[ActivityRecorder, ._last_dt(), _extract_hit_count(), _stringify()] | lang=en
- "agent_executor_run": "run()" | kind=code-symbol | source=backend/services/agent/executor.py:L467 | neighbors=[executor.py, run_agentic(), run_basic_rag(), run_no_rag()] | lang=en
- "agent_executor_run_agentic": "run_agentic()" | kind=code-symbol | source=backend/services/agent/executor.py:L284 | neighbors=[executor.py, The full agentic loop. May pause for hu…, run(), .to_dict()] | lang=en
- "agent_executor_runresult_to_dict": ".to_dict()" | kind=code-symbol | source=backend/services/agent/executor.py:L58 | neighbors=[run_agentic(), run_basic_rag(), run_no_rag(), RunResult] | lang=en
- "agent_offline_policy_expand_query": "expand_query()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L52 | neighbors=[offline_policy.py, .next_action(), ._refine(), Turn a natural-language question into k…] | lang=en
- "agent_offline_policy_offlinereactpolicy_finalise_answer": "._finalise_answer()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L304 | neighbors=[OfflineReactPolicy, ._evidence_prompt(), ._insufficient_answer(), .next_action()] | lang=en
- "agent_offline_policy_offlinereactpolicy_insufficient_answer": "._insufficient_answer()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L307 | neighbors=[OfflineReactPolicy, ._finalise_answer(), ._think_then(), .next_action()] | lang=en
- "agent_offline_policy_offlinereactpolicy_refine": "._refine()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L270 | neighbors=[OfflineReactPolicy, .next_action(), expand_query(), Broaden on each successive attempt whil…] | lang=en
- "agent_reflection_claimcheck": "ClaimCheck" | kind=code-symbol | source=backend/services/agent/reflection.py:L69 | neighbors=[reflection.py, .ok(), .to_dict(), verify()] | lang=en
- "agent_reflection_reflectionresult": "ReflectionResult" | kind=code-symbol | source=backend/services/agent/reflection.py:L94 | neighbors=[Agentic literature-review engine.  `fro…, reflection.py, .to_dict(), verify()] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-004.json

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
