# Node Description Batch 25 of 27

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

- "tests_test_ingest_test_ingest_produces_usable_chunks": "test_ingest_produces_usable_chunks()" | kind=code-symbol | source=backend/tests/test_ingest.py:L109 | neighbors=[test_ingest.py]
- "tests_test_ingest_test_ingest_rejects_non_pdf": "test_ingest_rejects_non_pdf()" | kind=code-symbol | source=backend/tests/test_ingest.py:L118 | neighbors=[test_ingest.py]
- "tests_test_ingest_test_prose_score_is_bounded": "test_prose_score_is_bounded()" | kind=code-symbol | source=backend/tests/test_ingest.py:L83 | neighbors=[test_ingest.py]
- "tests_test_ingest_test_prose_score_separates_prose_from_debris": "test_prose_score_separates_prose_from_debris()" | kind=code-symbol | source=backend/tests/test_ingest.py:L73 | neighbors=[test_ingest.py]
- "tests_test_ingest_test_running_heads_ignore_sentences": "test_running_heads_ignore_sentences()" | kind=code-symbol | source=backend/tests/test_ingest.py:L30 | neighbors=[test_ingest.py]
- "tests_test_ingest_test_same_bytes_ingest_once": "test_same_bytes_ingest_once()" | kind=code-symbol | source=backend/tests/test_ingest.py:L89 | neighbors=[test_ingest.py]
- "tests_test_ingest_test_scanned_pdf_raises_rather_than_indexing_blanks": "test_scanned_pdf_raises_rather_than_indexing_blanks()" | kind=code-symbol | source=backend/tests/test_ingest.py:L123 | neighbors=[test_ingest.py]
- "tests_test_ingest_test_short_document_is_left_alone": "test_short_document_is_left_alone()" | kind=code-symbol | source=backend/tests/test_ingest.py:L50 | neighbors=[test_ingest.py]
- "tests_test_providers_test_build_llm_falls_back_to_offline_without_key": "test_build_llm_falls_back_to_offline_without_key()" | kind=code-symbol | source=backend/tests/test_providers.py:L43 | neighbors=[test_providers.py]
- "tests_test_providers_test_build_llm_returns_openrouter_with_key": "test_build_llm_returns_openrouter_with_key()" | kind=code-symbol | source=backend/tests/test_providers.py:L53 | neighbors=[test_providers.py]
- "tests_test_providers_test_keyed_providers_are_not_available_without_key": "test_keyed_providers_are_not_available_without_key()" | kind=code-symbol | source=backend/tests/test_providers.py:L35 | neighbors=[test_providers.py]
- "tests_test_providers_test_run_review_refuses_mislabeled_offline_run": "test_run_review_refuses_mislabeled_offline_run()" | kind=code-symbol | source=backend/tests/test_providers.py:L72 | neighbors=[test_providers.py]
- "tests_test_providers_test_start_session_refuses_mislabeled_offline_run": "test_start_session_refuses_mislabeled_offline_run()" | kind=code-symbol | source=backend/tests/test_providers.py:L65 | neighbors=[test_providers.py]
- "tests_test_providers_test_two_openrouter_slots_are_registered": "test_two_openrouter_slots_are_registered()" | kind=code-symbol | source=backend/tests/test_providers.py:L23 | neighbors=[test_providers.py]
- "tests_test_providers_test_unknown_provider_is_rejected": "test_unknown_provider_is_rejected()" | kind=code-symbol | source=backend/tests/test_providers.py:L84 | neighbors=[test_providers.py]
- "tests_test_reflection_rationale_1": "Reflection / verification tests.  Verification is the project's central safety c" | kind=entity | source=backend/tests/test_reflection.py:L1 | neighbors=[test_reflection.py]
- "tests_test_reflection_rationale_53": "0.397 and .397 must compare equal." | kind=entity | source=backend/tests/test_reflection.py:L53 | neighbors=[test_trailing_zero_normalisation()]
- "tests_test_reflection_test_citations_only_include_used_markers": "test_citations_only_include_used_markers()" | kind=code-symbol | source=backend/tests/test_reflection.py:L109 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_correction_withdraws_unsupported_claims": "test_correction_withdraws_unsupported_claims()" | kind=code-symbol | source=backend/tests/test_reflection.py:L90 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_deictic_openers_rejected": "test_deictic_openers_rejected()" | kind=code-symbol | source=backend/tests/test_reflection.py:L135 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_headings_are_not_claims": "test_headings_are_not_claims()" | kind=code-symbol | source=backend/tests/test_reflection.py:L128 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_is_heading_free_helper_exists": "test_is_heading_free_helper_exists()" | kind=code-symbol | source=backend/tests/test_reflection.py:L153 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_no_citations_when_all_claims_fail": "test_no_citations_when_all_claims_fail()" | kind=code-symbol | source=backend/tests/test_reflection.py:L119 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_no_correction_leaves_text_untouched": "test_no_correction_leaves_text_untouched()" | kind=code-symbol | source=backend/tests/test_reflection.py:L102 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_number_in_source_passes": "test_number_in_source_passes()" | kind=code-symbol | source=backend/tests/test_reflection.py:L42 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_number_not_in_source_is_flagged": "test_number_not_in_source_is_flagged()" | kind=code-symbol | source=backend/tests/test_reflection.py:L31 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_split_claims_skips_headings_and_footnotes": "test_split_claims_skips_headings_and_footnotes()" | kind=code-symbol | source=backend/tests/test_reflection.py:L141 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_unapproved_source_is_a_global_failure": "test_unapproved_source_is_a_global_failure()" | kind=code-symbol | source=backend/tests/test_reflection.py:L80 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_uncited_claim_is_flagged": "test_uncited_claim_is_flagged()" | kind=code-symbol | source=backend/tests/test_reflection.py:L71 | neighbors=[test_reflection.py]
- "tests_test_reflection_test_unresolvable_marker_is_flagged": "test_unresolvable_marker_is_flagged()" | kind=code-symbol | source=backend/tests/test_reflection.py:L62 | neighbors=[test_reflection.py]
- "tests_test_retrieval_test_bm25_idf_rewards_rare_terms": "test_bm25_idf_rewards_rare_terms()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L22 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_bm25_is_deterministic": "test_bm25_is_deterministic()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L29 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_bm25_prefers_term_frequency": "test_bm25_prefers_term_frequency()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L16 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_content_terms_deduplicates_preserving_order": "test_content_terms_deduplicates_preserving_order()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L51 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_detect_intents": "test_detect_intents()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L72 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_empty_query_yields_nothing": "test_empty_query_yields_nothing()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L57 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_per_doc_cap_is_enforced": "test_per_doc_cap_is_enforced()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L115 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_provenance_fields_present": "test_provenance_fields_present()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L126 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_rank_papers_orders_by_relevance": "test_rank_papers_orders_by_relevance()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L134 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_retrieval_is_deterministic": "test_retrieval_is_deterministic()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L108 | neighbors=[test_retrieval.py]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-024.json

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
