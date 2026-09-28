# Node Description Batch 10 of 27

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

- "tests_test_agent_rationale_226": "Tool and refinement counts come from the LangChain callbacks, not notes.      Co" | kind=entity | source=backend/tests/test_agent.py:L226 | neighbors=[ActivityRecorder, ToolContext, test_activity_summary_reports_which_lim…]
- "tests_test_agent_rationale_32": "`search_papers` is passed only approved ids, so the corpus it sees is     the ap" | kind=entity | source=backend/tests/test_agent.py:L32 | neighbors=[ActivityRecorder, ToolContext, test_search_tool_cannot_reach_unapprove…]
- "tests_test_agent_rationale_50": "`read_passage` resolves against the passages this run actually retrieved.      A" | kind=entity | source=backend/tests/test_agent.py:L50 | neighbors=[ActivityRecorder, ToolContext, test_read_passage_refuses_unapproved_ch…]
- "tests_test_agent_rationale_93": "Exhausting the tool budget must stop the run, not silently continue." | kind=entity | source=backend/tests/test_agent.py:L93 | neighbors=[ActivityRecorder, ToolContext, test_tool_budget_is_enforced()]
- "tests_test_feedback_test_feedback_reruns_with_exclusion_and_preserves_draft": "test_feedback_reruns_with_exclusion_and_preserves_draft()" | kind=code-symbol | source=backend/tests/test_feedback.py:L62 | neighbors=[test_feedback.py, _complete_review(), _revise()]
- "tests_test_feedback_test_revise_allows_multiple_rounds": "test_revise_allows_multiple_rounds()" | kind=code-symbol | source=backend/tests/test_feedback.py:L170 | neighbors=[test_feedback.py, _complete_review(), _revise()]
- "tests_test_feedback_test_revision_survives_reload_like_a_restart": "test_revision_survives_reload_like_a_restart()" | kind=code-symbol | source=backend/tests/test_feedback.py:L95 | neighbors=[test_feedback.py, _complete_review(), _revise()]
- "tests_test_vectorstore_test_fake_and_real_collections_are_separate": "test_fake_and_real_collections_are_separate()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L148 | neighbors=[test_vectorstore.py, Fake and real embeddings must never mix…, Fake and real embeddings must never mix…]
- "types_index_activityevent": "ActivityEvent" | kind=code-symbol | source=frontend/src/types/index.ts:L280 | neighbors=[AgentActivityLog.tsx, LiteratureReview.tsx, index.ts]
- "types_index_candidatepaper": "CandidatePaper" | kind=code-symbol | source=frontend/src/types/index.ts:L231 | neighbors=[SourceApprovalPanel.tsx, api.ts, index.ts]
- "types_index_filterstate": "FilterState" | kind=code-symbol | source=frontend/src/types/index.ts:L112 | neighbors=[ResearchContext.tsx, paperService.ts, index.ts]
- "types_index_healthinfo": "HealthInfo" | kind=code-symbol | source=frontend/src/types/index.ts:L217 | neighbors=[LiteratureReview.tsx, api.ts, index.ts]
- "types_index_paper": "Paper" | kind=code-symbol | source=frontend/src/types/index.ts:L27 | neighbors=[mockResearchData.ts, paperService.ts, index.ts]
- "types_index_pdfdocumentmodel": "PDFDocumentModel" | kind=code-symbol | source=frontend/src/types/index.ts:L138 | neighbors=[ChatWithPDF.tsx, pdfService.ts, index.ts]
- "types_index_reviewmode": "ReviewMode" | kind=code-symbol | source=frontend/src/types/index.ts:L173 | neighbors=[LiteratureReview.tsx, api.ts, index.ts]
- "types_index_runresponse": "RunResponse" | kind=code-symbol | source=frontend/src/types/index.ts:L412 | neighbors=[api.ts, index.ts, SessionView]
- "types_index_sessionlistitem": "SessionListItem" | kind=code-symbol | source=frontend/src/types/index.ts:L386 | neighbors=[LiteratureReview.tsx, api.ts, index.ts]
- "abc": "ABC" | kind=code-symbol | neighbors=[base.py, BaseLLM]
- "agent_callbacks_activityrecorder_estimate_usage": ".estimate_usage()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L121 | neighbors=[ActivityRecorder, Whitespace-token count for providers th…]
- "agent_callbacks_activityrecorder_on_agent_action": ".on_agent_action()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L263 | neighbors=[ActivityRecorder, .note()]
- "agent_callbacks_activityrecorder_on_agent_finish": ".on_agent_finish()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L269 | neighbors=[ActivityRecorder, .note()]
- "agent_callbacks_activityrecorder_on_llm_start": ".on_llm_start()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L152 | neighbors=[ActivityRecorder, .note()]
- "agent_callbacks_activityrecorder_on_text": ".on_text()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L272 | neighbors=[ActivityRecorder, .note()]
- "agent_callbacks_extract_hit_count": "_extract_hit_count()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L301 | neighbors=[callbacks.py, .on_tool_end()]
- "agent_callbacks_pick": "_pick()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L282 | neighbors=[callbacks.py, .on_llm_end()]
- "agent_callbacks_stringify": "_stringify()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L292 | neighbors=[callbacks.py, .on_tool_end()]
- "agent_executor_evidence_prompt": "_evidence_prompt()" | kind=code-symbol | source=backend/services/agent/executor.py:L80 | neighbors=[executor.py, run_basic_rag()]
- "agent_executor_paper_records": "_paper_records()" | kind=code-symbol | source=backend/services/agent/executor.py:L99 | neighbors=[executor.py, run_basic_rag()]
- "agent_offline_policy_offlinereactpolicy_emit_final": "._emit_final()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L267 | neighbors=[OfflineReactPolicy, .next_action()]
- "agent_offline_policy_offlinereactpolicy_evidence_prompt": "._evidence_prompt()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L288 | neighbors=[OfflineReactPolicy, ._finalise_answer()]
- "agent_offline_policy_question_from_prompt": "_question_from_prompt()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L99 | neighbors=[offline_policy.py, .next_action()]
- "agent_offline_policy_rationale_1": "Deterministic ReAct policy for the offline (no-credentials) provider.  `Extracti" | kind=entity | source=backend/services/agent/offline_policy.py:L1 | neighbors=[offline_policy.py, ExtractiveLLM]
- "agent_offline_policy_rationale_111": "A LangChain-compatible chat model that emits deterministic ReAct text." | kind=entity | source=backend/services/agent/offline_policy.py:L111 | neighbors=[OfflineReactPolicy, ExtractiveLLM]
- "agent_offline_policy_rationale_271": "Broaden on each successive attempt while staying on the question's topic." | kind=entity | source=backend/services/agent/offline_policy.py:L271 | neighbors=[._refine(), ExtractiveLLM]
- "agent_offline_policy_rationale_53": "Turn a natural-language question into keyword terms for BM25.      BM25 has no n" | kind=entity | source=backend/services/agent/offline_policy.py:L53 | neighbors=[expand_query(), ExtractiveLLM]
- "agent_offline_policy_rationale_78": "Extract (action, input, observation) triples from the ReAct scratchpad." | kind=entity | source=backend/services/agent/offline_policy.py:L78 | neighbors=[_parse_scratchpad(), ExtractiveLLM]
- "agent_reflection_content": "_content()" | kind=code-symbol | source=backend/services/agent/reflection.py:L170 | neighbors=[reflection.py, verify()]
- "agent_reflection_is_probably_not_a_claim": "_is_probably_not_a_claim()" | kind=code-symbol | source=backend/services/agent/reflection.py:L208 | neighbors=[reflection.py, verify()]
- "agent_reflection_overlap": "_overlap()" | kind=code-symbol | source=backend/services/agent/reflection.py:L174 | neighbors=[reflection.py, verify()]
- "backend_config_available_providers": "available_providers()" | kind=code-symbol | source=backend/config.py:L137 | neighbors=[config.py, .key_present()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-009.json

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
