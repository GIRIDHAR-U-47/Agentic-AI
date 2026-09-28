# Node Description Batch 14 of 27

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

- "tests_conftest_rationale_46": "Re-materialise the real corpus rows after any test that wiped them.      `real_c" | kind=entity | source=backend/tests/conftest.py:L46 | neighbors=[_corpus_restorer(), clean_db()] | lang=en
- "tests_test_agent_test_activity_summary_reports_which_limit_was_hit": "test_activity_summary_reports_which_limit_was_hit()" | kind=code-symbol | source=backend/tests/test_agent.py:L225 | neighbors=[test_agent.py, Tool and refinement counts come from th…] | lang=en
- "tests_test_agent_test_evidence_marker_namespace_is_consistent": "test_evidence_marker_namespace_is_consistent()" | kind=code-symbol | source=backend/tests/test_agent.py:L178 | neighbors=[test_agent.py, Markers in the answer must match the ci…] | lang=en
- "tests_test_agent_test_exhausted_marker_is_not_reported_as_an_answer": "test_exhausted_marker_is_not_reported_as_an_answer()" | kind=code-symbol | source=backend/tests/test_agent.py:L103 | neighbors=[test_agent.py, A run cut short must not present the ex…] | lang=en
- "tests_test_agent_test_out_of_scope_question_does_not_fabricate": "test_out_of_scope_question_does_not_fabricate()" | kind=code-symbol | source=backend/tests/test_agent.py:L153 | neighbors=[test_agent.py, An unanswerable question must either be…] | lang=en
- "tests_test_agent_test_read_passage_refuses_unapproved_chunk": "test_read_passage_refuses_unapproved_chunk()" | kind=code-symbol | source=backend/tests/test_agent.py:L49 | neighbors=[test_agent.py, `read_passage` resolves against the pas…] | lang=en
- "tests_test_agent_test_search_tool_cannot_reach_unapproved_paper": "test_search_tool_cannot_reach_unapproved_paper()" | kind=code-symbol | source=backend/tests/test_agent.py:L31 | neighbors=[test_agent.py, `search_papers` is passed only approved…] | lang=en
- "tests_test_agent_test_tool_budget_is_enforced": "test_tool_budget_is_enforced()" | kind=code-symbol | source=backend/tests/test_agent.py:L92 | neighbors=[test_agent.py, Exhausting the tool budget must stop th…] | lang=en
- "tests_test_api_test_full_review_flow_over_http": "test_full_review_flow_over_http()" | kind=code-symbol | source=backend/tests/test_api.py:L81 | neighbors=[test_api.py, create -> approve -> run -> read back, …] | lang=en
- "tests_test_api_test_legacy_agent_steps_are_empty_without_runs": "test_legacy_agent_steps_are_empty_without_runs()" | kind=code-symbol | source=backend/tests/test_api.py:L171 | neighbors=[test_api.py, No hardcoded provenance. With no sessio…] | lang=en
- "tests_test_api_test_pdf_routes_still_work": "test_pdf_routes_still_work()" | kind=code-symbol | source=backend/tests/test_api.py:L198 | neighbors=[test_api.py, The Chat-with-PDF page calls these; the…] | lang=en
- "tests_test_discovery_test_approving_a_discovery_candidate_ingests_then_runs": "test_approving_a_discovery_candidate_ingests_then_runs()" | kind=code-symbol | source=backend/tests/test_discovery.py:L172 | neighbors=[test_discovery.py, Approving an arXiv candidate materialis…] | lang=en
- "tests_test_discovery_test_discover_caches_and_reuses": "test_discover_caches_and_reuses()" | kind=code-symbol | source=backend/tests/test_discovery.py:L122 | neighbors=[test_discovery.py, _fake_client()] | lang=en
- "tests_test_discovery_test_discover_empty_question_is_harmless": "test_discover_empty_question_is_harmless()" | kind=code-symbol | source=backend/tests/test_discovery.py:L134 | neighbors=[test_discovery.py, _fake_client()] | lang=en
- "tests_test_discovery_test_discover_returns_canonical_candidates": "test_discover_returns_canonical_candidates()" | kind=code-symbol | source=backend/tests/test_discovery.py:L51 | neighbors=[test_discovery.py, _fake_client()] | lang=en
- "tests_test_discovery_test_ingest_abstract_only_when_pdf_unavailable": "test_ingest_abstract_only_when_pdf_unavailable()" | kind=code-symbol | source=backend/tests/test_discovery.py:L153 | neighbors=[test_discovery.py, _fake_client()] | lang=en
- "tests_test_discovery_test_ingest_full_text_pdf": "test_ingest_full_text_pdf()" | kind=code-symbol | source=backend/tests/test_discovery.py:L141 | neighbors=[test_discovery.py, _fake_client()] | lang=en
- "tests_test_discovery_test_ingest_requires_arxiv_id": "test_ingest_requires_arxiv_id()" | kind=code-symbol | source=backend/tests/test_discovery.py:L166 | neighbors=[test_discovery.py, _fake_client()] | lang=en
- "tests_test_discovery_test_rejecting_an_unmaterialised_discovery_candidate_is_recorded": "test_rejecting_an_unmaterialised_discovery_candidate_is_recorded()" | kind=code-symbol | source=backend/tests/test_discovery.py:L208 | neighbors=[test_discovery.py, Rejecting a fresh-topic candidate that …] | lang=en
- "tests_test_feedback_test_excluding_every_approved_paper_is_an_explicit_refusal": "test_excluding_every_approved_paper_is_an_explicit_refusal()" | kind=code-symbol | source=backend/tests/test_feedback.py:L147 | neighbors=[test_feedback.py, _complete_review()] | lang=en
- "tests_test_feedback_test_revise_requires_feedback": "test_revise_requires_feedback()" | kind=code-symbol | source=backend/tests/test_feedback.py:L164 | neighbors=[test_feedback.py, _complete_review()] | lang=en
- "tests_test_ingest_test_bare_page_numbers_are_caught": "test_bare_page_numbers_are_caught()" | kind=code-symbol | source=backend/tests/test_ingest.py:L35 | neighbors=[test_ingest.py, A repeated bare page number at a page e…] | lang=en
- "tests_test_ingest_test_metadata_overrides_extracted_title": "test_metadata_overrides_extracted_title()" | kind=code-symbol | source=backend/tests/test_ingest.py:L129 | neighbors=[test_ingest.py, Authoritative metadata must win over wh…] | lang=en
- "tests_test_ingest_test_running_heads_only_matches_page_edges": "test_running_heads_only_matches_page_edges()" | kind=code-symbol | source=backend/tests/test_ingest.py:L11 | neighbors=[test_ingest.py, The bug this guards against is destruct…] | lang=en
- "tests_test_ingest_test_section_is_the_earliest_heading_on_the_page": "test_section_is_the_earliest_heading_on_the_page()" | kind=code-symbol | source=backend/tests/test_ingest.py:L55 | neighbors=[test_ingest.py, Pattern-list order used to win, so a pa…] | lang=en
- "tests_test_ingest_test_unique_page_numbers_are_not_treated_as_running_heads": "test_unique_page_numbers_are_not_treated_as_running_heads()" | kind=code-symbol | source=backend/tests/test_ingest.py:L41 | neighbors=[test_ingest.py, Each page number appears once, so none …] | lang=en
- "tests_test_providers_rationale_1": "OpenRouter provider registration, honest-key handling, and mislabel guards.  No" | kind=entity | source=backend/tests/test_providers.py:L1 | neighbors=[OpenRouterLLM, test_providers.py] | lang=en
- "tests_test_providers_rationale_90": "The evaluation harness iterates config.PROVIDERS, so the two OpenRouter     slot" | kind=entity | source=backend/tests/test_providers.py:L90 | neighbors=[OpenRouterLLM, test_eval_matrix_includes_openrouter_sl…] | lang=en
- "tests_test_providers_test_eval_matrix_includes_openrouter_slots": "test_eval_matrix_includes_openrouter_slots()" | kind=code-symbol | source=backend/tests/test_providers.py:L89 | neighbors=[test_providers.py, The evaluation harness iterates config.…] | lang=en
- "tests_test_reflection_test_trailing_zero_normalisation": "test_trailing_zero_normalisation()" | kind=code-symbol | source=backend/tests/test_reflection.py:L52 | neighbors=[test_reflection.py, 0.397 and .397 must compare equal.] | lang=en
- "tests_test_retrieval_rationale_1": "Retrieval tests: BM25, fusion, prose prior, diversification, determinism.  These" | kind=entity | source=backend/tests/test_retrieval.py:L1 | neighbors=[BM25, test_retrieval.py] | lang=en
- "tests_test_retrieval_rationale_85": "A question about a specific method must surface that paper." | kind=entity | source=backend/tests/test_retrieval.py:L85 | neighbors=[BM25, test_retrieval_finds_the_right_paper()] | lang=pt
- "tests_test_retrieval_rationale_96": "Figure/table fragments must not dominate purely on term density." | kind=entity | source=backend/tests/test_retrieval.py:L96 | neighbors=[BM25, test_retrieval_demotes_table_debris()] | lang=en
- "tests_test_retrieval_test_retrieval_demotes_table_debris": "test_retrieval_demotes_table_debris()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L95 | neighbors=[test_retrieval.py, Figure/table fragments must not dominat…] | lang=en
- "tests_test_retrieval_test_retrieval_finds_the_right_paper": "test_retrieval_finds_the_right_paper()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L84 | neighbors=[test_retrieval.py, A question about a specific method must…] | lang=en
- "tests_test_vectorstore_rationale_1": "Vector RAG: local persistent Chroma DB with the deterministic fake embedder.  Th" | kind=entity | source=backend/tests/test_vectorstore.py:L1 | neighbors=[FakeEmbedder, test_vectorstore.py] | lang=en
- "tests_test_vectorstore_rationale_138": "Fake and real embeddings must never mix -- separate collections." | kind=entity | source=backend/tests/test_vectorstore.py:L138 | neighbors=[FakeEmbedder, test_fake_and_real_collections_are_sepa…] | lang=en
- "tests_test_vectorstore_rationale_149": "Fake and real embeddings must never mix -- separate collections." | kind=entity | source=backend/tests/test_vectorstore.py:L149 | neighbors=[FakeEmbedder, test_fake_and_real_collections_are_sepa…] | lang=en
- "tests_test_workflow_test_no_paper_metadata_is_invented": "test_no_paper_metadata_is_invented()" | kind=code-symbol | source=backend/tests/test_workflow.py:L89 | neighbors=[test_workflow.py, Missing fields must be `None`, not a pl…] | lang=en
- "tests_test_workflow_test_session_state_is_reproducible_after_reload": "test_session_state_is_reproducible_after_reload()" | kind=code-symbol | source=backend/tests/test_workflow.py:L196 | neighbors=[test_workflow.py, A review must resume from the database,…] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-013.json

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
