# Node Description Batch 26 of 27

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

- "tests_test_retrieval_test_rrf_handles_empty_input": "test_rrf_handles_empty_input()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L40 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_rrf_rewards_agreement_across_rankers": "test_rrf_rewards_agreement_across_rankers()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L35 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_section_boost_prefers_matching_sections": "test_section_boost_prefers_matching_sections()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L76 | neighbors=[test_retrieval.py]
- "tests_test_retrieval_test_stopwords_dropped_but_content_kept": "test_stopwords_dropped_but_content_kept()" | kind=code-symbol | source=backend/tests/test_retrieval.py:L45 | neighbors=[test_retrieval.py]
- "tests_test_vectorstore_chroma_store": "chroma_store()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L26 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_sqlite_store": "sqlite_store()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L26 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_test_abstract_only_paper_carries_its_labels": "test_abstract_only_paper_carries_its_labels()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L100 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_test_astra_store_reports_unavailable_without_credentials": "test_astra_store_reports_unavailable_without_credentials()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L130 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_test_build_vector_store_returns_none_when_off": "test_build_vector_store_returns_none_when_off()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L136 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_test_delete_paper_removes_vectors_only": "test_delete_paper_removes_vectors_only()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L124 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_test_fake_embedder_is_deterministic_and_discriminative": "test_fake_embedder_is_deterministic_and_discriminative()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L52 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_test_retrieval_is_restricted_to_approved_papers": "test_retrieval_is_restricted_to_approved_papers()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L86 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_test_retrieval_respects_approved_set_presence": "test_retrieval_respects_approved_set_presence()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L95 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_test_sync_all_upserts_every_paper": "test_sync_all_upserts_every_paper()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L142 | neighbors=[test_vectorstore.py]
- "tests_test_vectorstore_test_upsert_and_retrieve_with_metadata": "test_upsert_and_retrieve_with_metadata()" | kind=code-symbol | source=backend/tests/test_vectorstore.py:L66 | neighbors=[test_vectorstore.py]
- "tests_test_workflow_rationale_1": "Session lifecycle, approval gate, resumption, and review assembly.  The review a" | kind=entity | source=backend/tests/test_workflow.py:L1 | neighbors=[test_workflow.py]
- "tests_test_workflow_rationale_197": "A review must resume from the database, not from process memory." | kind=entity | source=backend/tests/test_workflow.py:L197 | neighbors=[test_session_state_is_reproducible_afte…]
- "tests_test_workflow_rationale_90": "Missing fields must be `None`, not a placeholder that reads as data." | kind=entity | source=backend/tests/test_workflow.py:L90 | neighbors=[test_no_paper_metadata_is_invented()]
- "tests_test_workflow_test_approval_rejects_nonsense_decision": "test_approval_rejects_nonsense_decision()" | kind=code-symbol | source=backend/tests/test_workflow.py:L164 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_approval_rejects_unknown_document": "test_approval_rejects_unknown_document()" | kind=code-symbol | source=backend/tests/test_workflow.py:L156 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_comparison_table_lists_every_paper_even_uncited": "test_comparison_table_lists_every_paper_even_uncited()" | kind=code-symbol | source=backend/tests/test_workflow.py:L78 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_empty_sections_say_not_established": "test_empty_sections_say_not_established()" | kind=code-symbol | source=backend/tests/test_workflow.py:L69 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_full_workflow_real_corpus": "test_full_workflow_real_corpus()" | kind=code-symbol | source=backend/tests/test_workflow.py:L173 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_markdown_render_mentions_every_source": "test_markdown_render_mentions_every_source()" | kind=code-symbol | source=backend/tests/test_workflow.py:L111 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_real_run_produces_a_review_with_real_sources": "test_real_run_produces_a_review_with_real_sources()" | kind=code-symbol | source=backend/tests/test_workflow.py:L122 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_reply_refuses_when_not_waiting": "test_reply_refuses_when_not_waiting()" | kind=code-symbol | source=backend/tests/test_workflow.py:L212 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_run_refuses_without_approval": "test_run_refuses_without_approval()" | kind=code-symbol | source=backend/tests/test_workflow.py:L149 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_sections_are_populated_from_cited_claims": "test_sections_are_populated_from_cited_claims()" | kind=code-symbol | source=backend/tests/test_workflow.py:L57 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_session_rejects_unknown_mode": "test_session_rejects_unknown_mode()" | kind=code-symbol | source=backend/tests/test_workflow.py:L144 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_session_requires_a_real_question": "test_session_requires_a_real_question()" | kind=code-symbol | source=backend/tests/test_workflow.py:L139 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_unknown_session_raises": "test_unknown_session_raises()" | kind=code-symbol | source=backend/tests/test_workflow.py:L218 | neighbors=[test_workflow.py]
- "tests_test_workflow_test_unverified_review_is_flagged": "test_unverified_review_is_flagged()" | kind=code-symbol | source=backend/tests/test_workflow.py:L102 | neighbors=[test_workflow.py]
- "types_index_comparisonrow": "ComparisonRow" | kind=code-symbol | source=frontend/src/types/index.ts:L310 | neighbors=[index.ts]
- "types_index_discoveryinfo": "DiscoveryInfo" | kind=code-symbol | source=frontend/src/types/index.ts:L259 | neighbors=[index.ts]
- "types_index_discoverysearchevent": "DiscoverySearchEvent" | kind=code-symbol | source=frontend/src/types/index.ts:L252 | neighbors=[index.ts]
- "types_index_evidenceanchor": "EvidenceAnchor" | kind=code-symbol | source=frontend/src/types/index.ts:L17 | neighbors=[index.ts]
- "types_index_papermetric": "PaperMetric" | kind=code-symbol | source=frontend/src/types/index.ts:L3 | neighbors=[index.ts]
- "types_index_papersection": "PaperSection" | kind=code-symbol | source=frontend/src/types/index.ts:L10 | neighbors=[index.ts]
- "types_index_pdfchunk": "PDFChunk" | kind=code-symbol | source=frontend/src/types/index.ts:L129 | neighbors=[index.ts]
- "types_index_providerstatus": "ProviderStatus" | kind=code-symbol | source=frontend/src/types/index.ts:L209 | neighbors=[index.ts]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-025.json

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
