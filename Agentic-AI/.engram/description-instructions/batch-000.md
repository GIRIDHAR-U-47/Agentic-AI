# Node Description Batch 1 of 27

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

- "types_index": "index.ts" | kind=code-symbol | source=frontend/src/types/index.ts:L1 | neighbors=[d6c5367 commit, AgentActivityLog.tsx, SourceApprovalPanel.tsx, ResearchContext.tsx, mockResearchData.ts, ChatWithPDF.tsx]
- "commit:repo:github.com/GIRIDHAR-U-47/Agentic-AI@d6c53677e9dfc570774448781878e9ee3b95fc26": "d6c5367 commit" | kind=Commit | source=git | neighbors=[170f30e Initial commit, main.py, main, ResearchContext.tsx, mock_data.py, mockResearchData.ts]
- "agent_callbacks_activityrecorder": "ActivityRecorder" | kind=code-symbol | source=backend/services/agent/callbacks.py:L77 | neighbors=[callbacks.py, ._add(), .as_dicts(), .budget_left(), .estimate_usage(), .__init__()]
- "src_app": "App.tsx" | kind=code-symbol | source=frontend/src/App.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, ResearchProvider(), AppLayout.tsx, AppLayout(), AgentGallery.tsx]
- "backend_db": "db.py" | kind=code-symbol | source=backend/db.py:L1 | neighbors=[approved_doc_ids(), cache_discovery(), clear_actor_approvals(), _connect(), corpus_stats(), create_session()]
- "basemodel": "BaseModel" | kind=code-symbol | neighbors=[AgentInstructionRequest, AgentProvenanceStep, AutoPilotRequest, ComplianceChecks, EmpiricalResult, EvidenceAnchor]
- "context_researchcontext": "ResearchContext.tsx" | kind=code-symbol | source=frontend/src/context/ResearchContext.tsx:L1 | neighbors=[d6c5367 commit, DEFAULT_CHAT_MESSAGES, defaultFilters, IntentPayload, ResearchChatMessage, ResearchContext]
- "backend_db_init_db": "init_db()" | kind=code-symbol | source=backend/db.py:L175 | neighbors=[db.py, cache_discovery(), clear_actor_approvals(), corpus_stats(), create_session(), delete_document()]
- "llm_base_llmerror": "LLMError" | kind=code-symbol | source=backend/services/llm/base.py:L17 | neighbors=[base.py, RuntimeError, Raised when a provider call fails in a …, GeminiLLM, Google Gemini provider.  Uses the LangC…, LLM provider layer.  `from services.llm…]
- "tests_test_api": "test_api.py" | kind=code-symbol | source=backend/tests/test_api.py:L1 | neighbors=[client(), test_autopilot_is_reported_as_unsupport…, test_bibtex_export_is_real(), test_corpus_document_detail(), test_corpus_lists_real_papers(), test_evidence_matrix_is_empty_without_a…]
- "llm_base_basellm": "BaseLLM" | kind=code-symbol | source=backend/services/llm/base.py:L48 | neighbors=[base.py, ABC, .generate(), .health(), One-shot text generation. Chat/tool-cal…, GeminiLLM]
- "services_retrieval": "retrieval.py" | kind=code-symbol | source=backend/services/retrieval.py:L1 | neighbors=[offline_policy.py, reflection.py, offline.py, corpus.py, discovery.py, paper_service.py]
- "llm_base_llmresult": "LLMResult" | kind=code-symbol | source=backend/services/llm/base.py:L22 | neighbors=[base.py, .to_dict(), .usage_known(), GeminiLLM, Google Gemini provider.  Uses the LangC…, LLM provider layer.  `from services.llm…]
- "llm_offline_extractivellm": "ExtractiveLLM" | kind=code-symbol | source=backend/services/llm/offline.py:L232 | neighbors=[OfflineReactPolicy, Deterministic ReAct policy for the offl…, A LangChain-compatible chat model that …, Broaden on each successive attempt whil…, Turn a natural-language question into k…, Extract (action, input, observation) tr…]
- "pages_literaturereview": "LiteratureReview.tsx" | kind=code-symbol | source=frontend/src/pages/LiteratureReview.tsx:L1 | neighbors=[d6c5367 commit, AgentActivityLog.tsx, AgentActivityLog(), SourceApprovalPanel.tsx, SourceApprovalPanel(), inline()]
- "agent_tools_toolcontext": "ToolContext" | kind=code-symbol | source=backend/services/agent/tools.py:L32 | neighbors=[The three run modes, and the agent loop…, Answer with no retrieval at all. Delibe…, Single retrieve + single generate. No p…, The full agentic loop. May pause for hu…, RunResult, tools.py]
- "models_schemas": "schemas.py" | kind=code-symbol | source=backend/models/schemas.py:L1 | neighbors=[d6c5367 commit, mock_data.py, AgentInstructionRequest, AgentProvenanceStep, AutoPilotRequest, ComplianceChecks]
- "tests_test_agent": "test_agent.py" | kind=code-symbol | source=backend/tests/test_agent.py:L1 | neighbors=[test_activity_log_has_plan_tool_and_ver…, test_activity_summary_reports_which_lim…, test_agentic_run_terminates_within_limi…, test_all_modes_run(), test_basic_rag_cites_real_pages(), test_budget_exceeded_is_a_distinct_exce…]
- "agent_callbacks_agentneedsuser": "AgentNeedsUser" | kind=code-symbol | source=backend/services/agent/callbacks.py:L55 | neighbors=[callbacks.py, .__init__(), .to_dict(), RuntimeError, Raised when the agent decides it must a…, The three run modes, and the agent loop…]
- "tests_test_retrieval": "test_retrieval.py" | kind=code-symbol | source=backend/tests/test_retrieval.py:L1 | neighbors=[retrieval.py, test_bm25_idf_rewards_rare_terms(), test_bm25_is_deterministic(), test_bm25_prefers_term_frequency(), test_content_terms_deduplicates_preserv…, test_detect_intents()]
- "agent_offline_policy_offlinereactpolicy": "OfflineReactPolicy" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L110 | neighbors=[The three run modes, and the agent loop…, Answer with no retrieval at all. Delibe…, Single retrieve + single generate. No p…, The full agentic loop. May pause for hu…, RunResult, offline_policy.py]
- "routers_sessions": "sessions.py" | kind=code-symbol | source=backend/routers/sessions.py:L1 | neighbors=[ApprovalIn, create_session(), Decision, delete_session(), feedback(), FeedbackIn]
- "tests_test_workflow": "test_workflow.py" | kind=code-symbol | source=backend/tests/test_workflow.py:L1 | neighbors=[test_approval_rejects_nonsense_decision…, test_approval_rejects_unknown_document(), test_comparison_table_lists_every_paper…, test_empty_sections_say_not_established…, test_full_workflow_real_corpus(), test_markdown_render_mentions_every_sou…]
- "agent_callbacks_toolbudgetexceeded": "ToolBudgetExceeded" | kind=code-symbol | source=backend/services/agent/callbacks.py:L51 | neighbors=[callbacks.py, Raised by the tool layer when the per-r…, RuntimeError, The three run modes, and the agent loop…, Answer with no retrieval at all. Delibe…, Single retrieve + single generate. No p…]
- "agent_reflection": "reflection.py" | kind=code-symbol | source=backend/services/agent/reflection.py:L1 | neighbors=[_build_citations(), ClaimCheck, _content(), _index_evidence(), is_heading_free(), _is_probably_not_a_claim()]
- "data_mockresearchdata": "mockResearchData.ts" | kind=code-symbol | source=frontend/src/data/mockResearchData.ts:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, MOCK_AGENT_STEPS, MOCK_EVIDENCE_ROWS, MOCK_PAPERS, MOCK_REPORT_CITATIONS]
- "services_api": "api.ts" | kind=code-symbol | source=frontend/src/services/api.ts:L1 | neighbors=[LiteratureReview.tsx, ResearchWorkspace.tsx, api, MODE_DESCRIPTIONS, request(), index.ts]
- "services_ingest": "ingest.py" | kind=code-symbol | source=backend/services/ingest.py:L1 | neighbors=[build_sections_and_chunks(), _clean(), extract_abstract(), extract_pages(), find_running_heads(), guess_authors()]
- "services_workflow": "workflow.py" | kind=code-symbol | source=backend/services/workflow.py:L1 | neighbors=[retrieval.py, answer_user(), _enrich_citations(), _finalize_revision(), get_session_view(), _record_revision()]
- "tests_test_ingest": "test_ingest.py" | kind=code-symbol | source=backend/tests/test_ingest.py:L1 | neighbors=[test_bare_page_numbers_are_caught(), test_different_papers_get_different_ids…, test_ingest_produces_usable_chunks(), test_ingest_rejects_non_pdf(), test_metadata_overrides_extracted_title…, test_prose_score_is_bounded()]
- "tests_test_reflection": "test_reflection.py" | kind=code-symbol | source=backend/tests/test_reflection.py:L1 | neighbors=[test_citations_only_include_used_marker…, test_correction_withdraws_unsupported_c…, test_deictic_openers_rejected(), test_headings_are_not_claims(), test_is_heading_free_helper_exists(), test_no_citations_when_all_claims_fail()]
- "backend_db_cursor": "cursor()" | kind=code-symbol | source=backend/db.py:L149 | neighbors=[db.py, corpus_stats(), _connect(), get_approvals(), get_chunk(), get_chunks()]
- "backend_db_transaction": "transaction()" | kind=code-symbol | source=backend/db.py:L163 | neighbors=[db.py, cache_discovery(), clear_actor_approvals(), create_session(), delete_document(), delete_session()]
- "context_researchcontext_useresearch": "useResearch()" | kind=code-symbol | source=frontend/src/context/ResearchContext.tsx:L252 | neighbors=[ResearchContext.tsx, AppLayout.tsx, Topbar.tsx, AIDetector.tsx, AIWriter.tsx, ChatWithPDF.tsx]
- "tests_test_discovery": "test_discovery.py" | kind=code-symbol | source=backend/tests/test_discovery.py:L1 | neighbors=[_fake_client(), test_approving_a_discovery_candidate_in…, test_arxiv_network_helpers_exist(), test_discover_caches_and_reuses(), test_discover_dedupes_against_corpus(), test_discover_empty_question_is_harmles…]
- "tests_test_vectorstore": "test_vectorstore.py" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L1 | neighbors=[embeddings.py, chroma_store(), test_abstract_only_paper_carries_its_la…, test_build_vector_store_returns_none_wh…, test_delete_paper_removes_vectors_only(), test_fake_and_real_collections_are_sepa…]
- "agent_reflection_verify": "verify()" | kind=code-symbol | source=backend/services/agent/reflection.py:L278 | neighbors=[reflection.py, Check `answer` against `evidence`; opti…, _build_citations(), ClaimCheck, _content(), _index_evidence()]
- "pages_chatwithpdf": "ChatWithPDF.tsx" | kind=code-symbol | source=frontend/src/pages/ChatWithPDF.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), ChatMessage, ChatWithPDF(), SUGGESTED_QUESTIONS]
- "pages_researchworkspace": "ResearchWorkspace.tsx" | kind=code-symbol | source=frontend/src/pages/ResearchWorkspace.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), mockResearchData.ts, MOCK_PAPERS, ResearchWorkspace()]
- "services_discovery": "discovery.py" | kind=code-symbol | source=backend/services/discovery.py:L1 | neighbors=[ArxivClient, _canonical(), _dedupe_and_filter(), discover(), _FakeArxivClient, _ingest_abstract_only()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-000.json

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
