# Node Description Batch 7 of 27

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

- "services_workflow_enrich_citations": "_enrich_citations()" | kind=code-symbol | source=backend/services/workflow.py:L111 | neighbors=[workflow.py, Attach stored document metadata (source…, run_review(), _run_with_question()]
- "services_workflow_finalize_revision": "_finalize_revision()" | kind=code-symbol | source=backend/services/workflow.py:L577 | neighbors=[workflow.py, answer_user(), Mark the most recent (incomplete) revis…, Mark the most recent (incomplete) revis…]
- "services_workflow_set_approvals": "set_approvals()" | kind=code-symbol | source=backend/services/workflow.py:L189 | neighbors=[workflow.py, Record the researcher's approve/reject …, WorkflowError, Record the researcher's approve/reject …]
- "services_workflow_start_session": "start_session()" | kind=code-symbol | source=backend/services/workflow.py:L142 | neighbors=[workflow.py, _resolve_provider(), suggest_candidates(), WorkflowError]
- "services_workflow_suggest_candidates": "suggest_candidates()" | kind=code-symbol | source=backend/services/workflow.py:L45 | neighbors=[workflow.py, Rank the corpus for `question` so the u…, start_session(), A workflow step cannot proceed. Surface…]
- "tests_conftest_corpus_restorer": "_corpus_restorer()" | kind=code-symbol | source=backend/tests/conftest.py:L49 | neighbors=[conftest.py, Re-materialise the real corpus rows aft…, Re-materialise the real corpus rows aft…, Re-materialise the real corpus rows aft…]
- "tests_conftest_seeded_corpus": "seeded_corpus()" | kind=code-symbol | source=backend/tests/conftest.py:L103 | neighbors=[conftest.py, Real corpus rows present in *this* test…, Real corpus rows present in *this* test…, Real corpus rows present in *this* test…]
- "tests_test_feedback_test_exclusion_that_starves_evidence_asks_instead_of_fabricating": "test_exclusion_that_starves_evidence_asks_instead_of_fabricating()" | kind=code-symbol | source=backend/tests/test_feedback.py:L128 | neighbors=[test_feedback.py, When the excluded papers leave no scope…, _complete_review(), When the excluded papers leave no scope…]
- "types_index_agentprovenancestep": "AgentProvenanceStep" | kind=code-symbol | source=frontend/src/types/index.ts:L101 | neighbors=[ResearchContext.tsx, mockResearchData.ts, agentService.ts, index.ts]
- "types_index_corpusdocument": "CorpusDocument" | kind=code-symbol | source=frontend/src/types/index.ts:L181 | neighbors=[ResearchWorkspace.tsx, api.ts, researchService.ts, index.ts]
- "types_index_evidencematrixrow": "EvidenceMatrixRow" | kind=code-symbol | source=frontend/src/types/index.ts:L68 | neighbors=[mockResearchData.ts, EvidenceValidation.tsx, researchService.ts, index.ts]
- "types_index_sessionview": "SessionView" | kind=code-symbol | source=frontend/src/types/index.ts:L345 | neighbors=[LiteratureReview.tsx, api.ts, index.ts, RunResponse]
- "agent_callbacks_activityrecorder_on_llm_end": ".on_llm_end()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L161 | neighbors=[ActivityRecorder, ._last_dt(), _pick()]
- "agent_callbacks_activityrecorder_on_tool_error": ".on_tool_error()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L248 | neighbors=[ActivityRecorder, ActivityEvent, ._add()]
- "agent_callbacks_activityrecorder_on_tool_start": ".on_tool_start()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L210 | neighbors=[ActivityRecorder, ActivityEvent, ._add()]
- "agent_executor_persist": "_persist()" | kind=code-symbol | source=backend/services/agent/executor.py:L118 | neighbors=[executor.py, run_basic_rag(), run_no_rag()]
- "agent_offline_policy_offlinereactpolicy_think_then": "._think_then()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L258 | neighbors=[OfflineReactPolicy, ._insufficient_answer(), .next_action()]
- "agent_offline_policy_parse_scratchpad": "_parse_scratchpad()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L77 | neighbors=[offline_policy.py, .next_action(), Extract (action, input, observation) tr…]
- "agent_reflection_build_citations": "_build_citations()" | kind=code-symbol | source=backend/services/agent/reflection.py:L405 | neighbors=[reflection.py, One citation record per *passage* a sur…, verify()]
- "agent_reflection_index_evidence": "_index_evidence()" | kind=code-symbol | source=backend/services/agent/reflection.py:L226 | neighbors=[reflection.py, Two indexes: by marker, and by (marker,…, verify()]
- "agent_reflection_is_heading_free": "is_heading_free()" | kind=code-symbol | source=backend/services/agent/reflection.py:L40 | neighbors=[reflection.py, split_claims(), True when `text` contains no section he…]
- "agent_reflection_normalise_number": "normalise_number()" | kind=code-symbol | source=backend/services/agent/reflection.py:L180 | neighbors=[reflection.py, _numbers_in(), `0.129` and `.129` should compare equal…]
- "agent_reflection_numbers_in": "_numbers_in()" | kind=code-symbol | source=backend/services/agent/reflection.py:L191 | neighbors=[reflection.py, normalise_number(), verify()]
- "agent_reflection_parse_citations": "_parse_citations()" | kind=code-symbol | source=backend/services/agent/reflection.py:L217 | neighbors=[reflection.py, `[S1 p.9]` -> `[("S1", 9)]`; `[S1, S3]`…, verify()]
- "agent_reflection_resolve": "_resolve()" | kind=code-symbol | source=backend/services/agent/reflection.py:L247 | neighbors=[reflection.py, Map claim citations onto the exact pass…, verify()]
- "agent_tools_assign_markers": "_assign_markers()" | kind=code-symbol | source=backend/services/agent/tools.py:L69 | neighbors=[tools.py, Stable per-document markers so a citati…, Stable per-document markers so a citati…]
- "agent_tools_build_tools": "build_tools()" | kind=code-symbol | source=backend/services/agent/tools.py:L82 | neighbors=[tools.py, Return LangChain `Tool` objects bound t…, Return LangChain `Tool` objects bound t…]
- "backend_db_clear_actor_approvals": "clear_actor_approvals()" | kind=code-symbol | source=backend/db.py:L533 | neighbors=[db.py, init_db(), transaction()]
- "backend_db_connect": "_connect()" | kind=code-symbol | source=backend/db.py:L139 | neighbors=[db.py, cursor(), transaction()]
- "backend_db_corpus_stats": "corpus_stats()" | kind=code-symbol | source=backend/db.py:L373 | neighbors=[db.py, cursor(), init_db()]
- "backend_db_delete_document": "delete_document()" | kind=code-symbol | source=backend/db.py:L329 | neighbors=[db.py, init_db(), transaction()]
- "backend_db_delete_session": "delete_session()" | kind=code-symbol | source=backend/db.py:L496 | neighbors=[db.py, init_db(), transaction()]
- "backend_db_get_chunk": "get_chunk()" | kind=code-symbol | source=backend/db.py:L358 | neighbors=[db.py, cursor(), init_db()]
- "backend_db_get_chunks": "get_chunks()" | kind=code-symbol | source=backend/db.py:L337 | neighbors=[db.py, cursor(), init_db()]
- "backend_db_get_citations": "get_citations()" | kind=code-symbol | source=backend/db.py:L586 | neighbors=[db.py, cursor(), init_db()]
- "backend_db_get_document": "get_document()" | kind=code-symbol | source=backend/db.py:L308 | neighbors=[db.py, cursor(), init_db()]
- "backend_db_list_documents": "list_documents()" | kind=code-symbol | source=backend/db.py:L316 | neighbors=[db.py, cursor(), init_db()]
- "backend_db_list_sessions": "list_sessions()" | kind=code-symbol | source=backend/db.py:L485 | neighbors=[db.py, cursor(), init_db()]
- "basellm": "BaseLLM" | kind=code-symbol | neighbors=[GeminiLLM, ExtractiveLLM, OpenAICompatLLM]
- "data_mockresearchdata_mock_agent_steps": "MOCK_AGENT_STEPS" | kind=code-symbol | source=frontend/src/data/mockResearchData.ts:L656 | neighbors=[ResearchContext.tsx, mockResearchData.ts, agentService.ts]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-006.json

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
