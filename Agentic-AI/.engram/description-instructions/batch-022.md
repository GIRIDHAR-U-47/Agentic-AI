# Node Description Batch 23 of 27

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

- "src_vite_env_d_svg": "*.svg" | kind=code-symbol | source=frontend/src/vite-env.d.ts:L18 | neighbors=[vite-env.d.ts]
- "tests_conftest_chunks": "chunks()" | kind=code-symbol | source=backend/tests/conftest.py:L135 | neighbors=[conftest.py]
- "tests_conftest_rationale_1": "Shared pytest fixtures.  Every test runs against a **temporary database and data" | kind=entity | source=backend/tests/conftest.py:L1 | neighbors=[conftest.py]
- "tests_conftest_rationale_100": "Real corpus rows present in *this* test's database.      Unlike the session-scop" | kind=entity | source=backend/tests/conftest.py:L100 | neighbors=[seeded_corpus()]
- "tests_conftest_rationale_102": "Real corpus rows present in *this* test's database.      Unlike the session-scop" | kind=entity | source=backend/tests/conftest.py:L102 | neighbors=[seeded_corpus()]
- "tests_conftest_rationale_104": "Real corpus rows present in *this* test's database.      Unlike the session-scop" | kind=entity | source=backend/tests/conftest.py:L104 | neighbors=[seeded_corpus()]
- "tests_conftest_rationale_126": "Read-only view of the ingested real corpus." | kind=entity | source=backend/tests/conftest.py:L126 | neighbors=[corpus()]
- "tests_conftest_rationale_128": "Read-only view of the ingested real corpus." | kind=entity | source=backend/tests/conftest.py:L128 | neighbors=[corpus()]
- "tests_conftest_rationale_130": "Read-only view of the ingested real corpus." | kind=entity | source=backend/tests/conftest.py:L130 | neighbors=[corpus()]
- "tests_conftest_rationale_48": "Re-materialise the real corpus rows after any test that wiped them.      `real_c" | kind=entity | source=backend/tests/conftest.py:L48 | neighbors=[_corpus_restorer()]
- "tests_conftest_rationale_50": "Re-materialise the real corpus rows after any test that wiped them.      `real_c" | kind=entity | source=backend/tests/conftest.py:L50 | neighbors=[_corpus_restorer()]
- "tests_conftest_rationale_54": "Ingest the cached real papers once per session." | kind=entity | source=backend/tests/conftest.py:L54 | neighbors=[real_corpus()]
- "tests_conftest_rationale_70": "A database with the schema in place and no rows." | kind=entity | source=backend/tests/conftest.py:L70 | neighbors=[clean_db()]
- "tests_conftest_rationale_72": "A database with the schema in place and no rows." | kind=entity | source=backend/tests/conftest.py:L72 | neighbors=[clean_db()]
- "tests_conftest_rationale_74": "A database with the schema in place and no rows." | kind=entity | source=backend/tests/conftest.py:L74 | neighbors=[clean_db()]
- "tests_conftest_rationale_76": "Read-only view of the ingested real corpus." | kind=entity | source=backend/tests/conftest.py:L76 | neighbors=[corpus()]
- "tests_conftest_rationale_78": "Ingest the cached real papers once per session." | kind=entity | source=backend/tests/conftest.py:L78 | neighbors=[real_corpus()]
- "tests_conftest_rationale_80": "Ingest the cached real papers once per session." | kind=entity | source=backend/tests/conftest.py:L80 | neighbors=[real_corpus()]
- "tests_conftest_rationale_82": "Ingest the cached real papers once per session." | kind=entity | source=backend/tests/conftest.py:L82 | neighbors=[real_corpus()]
- "tests_conftest_schema": "_schema()" | kind=code-symbol | source=backend/tests/conftest.py:L44 | neighbors=[conftest.py]
- "tests_test_agent_test_activity_log_has_plan_tool_and_verification": "test_activity_log_has_plan_tool_and_verification()" | kind=code-symbol | source=backend/tests/test_agent.py:L202 | neighbors=[test_agent.py]
- "tests_test_agent_test_agentic_run_terminates_within_limits": "test_agentic_run_terminates_within_limits()" | kind=code-symbol | source=backend/tests/test_agent.py:L84 | neighbors=[test_agent.py]
- "tests_test_agent_test_all_modes_run": "test_all_modes_run()" | kind=code-symbol | source=backend/tests/test_agent.py:L123 | neighbors=[test_agent.py]
- "tests_test_agent_test_basic_rag_cites_real_pages": "test_basic_rag_cites_real_pages()" | kind=code-symbol | source=backend/tests/test_agent.py:L137 | neighbors=[test_agent.py]
- "tests_test_agent_test_budget_exceeded_is_a_distinct_exception": "test_budget_exceeded_is_a_distinct_exception()" | kind=code-symbol | source=backend/tests/test_agent.py:L212 | neighbors=[test_agent.py]
- "tests_test_agent_test_estimate_usage_is_deterministic": "test_estimate_usage_is_deterministic()" | kind=code-symbol | source=backend/tests/test_agent.py:L217 | neighbors=[test_agent.py]
- "tests_test_agent_test_every_citation_names_a_real_page_and_quote": "test_every_citation_names_a_real_page_and_quote()" | kind=code-symbol | source=backend/tests/test_agent.py:L191 | neighbors=[test_agent.py]
- "tests_test_agent_test_no_rag_produces_no_citations": "test_no_rag_produces_no_citations()" | kind=code-symbol | source=backend/tests/test_agent.py:L131 | neighbors=[test_agent.py]
- "tests_test_agent_test_offline_run_does_not_claim_provider_token_counts": "test_offline_run_does_not_claim_provider_token_counts()" | kind=code-symbol | source=backend/tests/test_agent.py:L246 | neighbors=[test_agent.py]
- "tests_test_agent_test_run_with_no_approved_papers_cites_nothing": "test_run_with_no_approved_papers_cites_nothing()" | kind=code-symbol | source=backend/tests/test_agent.py:L24 | neighbors=[test_agent.py]
- "tests_test_agent_test_unapproved_paper_cannot_be_cited": "test_unapproved_paper_cannot_be_cited()" | kind=code-symbol | source=backend/tests/test_agent.py:L70 | neighbors=[test_agent.py]
- "tests_test_agent_test_unknown_mode_raises": "test_unknown_mode_raises()" | kind=code-symbol | source=backend/tests/test_agent.py:L147 | neighbors=[test_agent.py]
- "tests_test_api_client": "client()" | kind=code-symbol | source=backend/tests/test_api.py:L13 | neighbors=[test_api.py]
- "tests_test_api_rationale_1": "HTTP-level tests against the real FastAPI app and the real corpus.  These assert" | kind=entity | source=backend/tests/test_api.py:L1 | neighbors=[test_api.py]
- "tests_test_api_rationale_172": "No hardcoded provenance. With no session scoped, the list is empty." | kind=entity | source=backend/tests/test_api.py:L172 | neighbors=[test_legacy_agent_steps_are_empty_witho…]
- "tests_test_api_rationale_199": "The Chat-with-PDF page calls these; they must not regress." | kind=entity | source=backend/tests/test_api.py:L199 | neighbors=[test_pdf_routes_still_work()]
- "tests_test_api_rationale_82": "create -> approve -> run -> read back, exactly as the UI does it." | kind=entity | source=backend/tests/test_api.py:L82 | neighbors=[test_full_review_flow_over_http()]
- "tests_test_api_test_autopilot_is_reported_as_unsupported": "test_autopilot_is_reported_as_unsupported()" | kind=code-symbol | source=backend/tests/test_api.py:L177 | neighbors=[test_api.py]
- "tests_test_api_test_bibtex_export_is_real": "test_bibtex_export_is_real()" | kind=code-symbol | source=backend/tests/test_api.py:L183 | neighbors=[test_api.py]
- "tests_test_api_test_corpus_document_detail": "test_corpus_document_detail()" | kind=code-symbol | source=backend/tests/test_api.py:L48 | neighbors=[test_api.py]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-022.json

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
