# Node Description Batch 24 of 27

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

- "tests_test_api_test_corpus_lists_real_papers": "test_corpus_lists_real_papers()" | kind=code-symbol | source=backend/tests/test_api.py:L39 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_evidence_matrix_is_empty_without_a_session": "test_evidence_matrix_is_empty_without_a_session()" | kind=code-symbol | source=backend/tests/test_api.py:L194 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_health_reports_providers_and_limits": "test_health_reports_providers_and_limits()" | kind=code-symbol | source=backend/tests/test_api.py:L21 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_legacy_papers_route_serves_the_real_corpus": "test_legacy_papers_route_serves_the_real_corpus()" | kind=code-symbol | source=backend/tests/test_api.py:L162 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_markdown_export_requires_a_review": "test_markdown_export_requires_a_review()" | kind=code-symbol | source=backend/tests/test_api.py:L152 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_reply_without_a_pending_question_is_rejected": "test_reply_without_a_pending_question_is_rejected()" | kind=code-symbol | source=backend/tests/test_api.py:L146 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_root_points_at_the_workflow": "test_root_points_at_the_workflow()" | kind=code-symbol | source=backend/tests/test_api.py:L32 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_run_without_approval_is_rejected": "test_run_without_approval_is_rejected()" | kind=code-symbol | source=backend/tests/test_api.py:L122 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_sessions_are_listed": "test_sessions_are_listed()" | kind=code-symbol | source=backend/tests/test_api.py:L157 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_short_question_is_rejected": "test_short_question_is_rejected()" | kind=code-symbol | source=backend/tests/test_api.py:L129 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_suggest_ranks_by_relevance": "test_suggest_ranks_by_relevance()" | kind=code-symbol | source=backend/tests/test_api.py:L59 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_suggest_requires_a_query": "test_suggest_requires_a_query()" | kind=code-symbol | source=backend/tests/test_api.py:L70 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_unknown_document_is_404": "test_unknown_document_is_404()" | kind=code-symbol | source=backend/tests/test_api.py:L55 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_unknown_mode_is_rejected": "test_unknown_mode_is_rejected()" | kind=code-symbol | source=backend/tests/test_api.py:L134 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_unknown_session_is_404": "test_unknown_session_is_404()" | kind=code-symbol | source=backend/tests/test_api.py:L141 | neighbors=[test_api.py] | lang=en
- "tests_test_api_test_upload_rejects_non_pdf": "test_upload_rejects_non_pdf()" | kind=code-symbol | source=backend/tests/test_api.py:L74 | neighbors=[test_api.py] | lang=en
- "tests_test_discovery_rationale_1": "Fresh-topic discovery: arXiv search, refinement, dedupe, ingest-on-approval.  Ev" | kind=entity | source=backend/tests/test_discovery.py:L1 | neighbors=[test_discovery.py] | lang=en
- "tests_test_discovery_rationale_173": "Approving an arXiv candidate materialises it before the decision is     recorded" | kind=entity | source=backend/tests/test_discovery.py:L173 | neighbors=[test_approving_a_discovery_candidate_in…] | lang=en
- "tests_test_discovery_rationale_209": "Rejecting a fresh-topic candidate that has never been materialised as a     docu" | kind=entity | source=backend/tests/test_discovery.py:L209 | neighbors=[test_rejecting_an_unmaterialised_discov…] | lang=pt
- "tests_test_discovery_test_arxiv_network_helpers_exist": "test_arxiv_network_helpers_exist()" | kind=code-symbol | source=backend/tests/test_discovery.py:L261 | neighbors=[test_discovery.py] | lang=en
- "tests_test_discovery_test_discover_dedupes_against_corpus": "test_discover_dedupes_against_corpus()" | kind=code-symbol | source=backend/tests/test_discovery.py:L100 | neighbors=[test_discovery.py] | lang=en
- "tests_test_discovery_test_discover_refines_when_first_pass_is_poor": "test_discover_refines_when_first_pass_is_poor()" | kind=code-symbol | source=backend/tests/test_discovery.py:L67 | neighbors=[test_discovery.py] | lang=en
- "tests_test_discovery_test_workflow_rejects_requested_keyed_provider_without_key": "test_workflow_rejects_requested_keyed_provider_without_key()" | kind=code-symbol | source=backend/tests/test_discovery.py:L255 | neighbors=[test_discovery.py] | lang=en
- "tests_test_feedback_rationale_1": "Researcher feedback -> revised review (HITL round 2).  The end-to-end flow: draf" | kind=entity | source=backend/tests/test_feedback.py:L1 | neighbors=[test_feedback.py] | lang=en
- "tests_test_feedback_rationale_107": "Proving the feedback re-drives retrieval: the effective question the     retriev" | kind=entity | source=backend/tests/test_feedback.py:L107 | neighbors=[test_feedback_terms_flow_into_the_retri…] | lang=en
- "tests_test_feedback_rationale_112": "Proving the feedback re-drives retrieval: the effective question the     retriev" | kind=entity | source=backend/tests/test_feedback.py:L112 | neighbors=[test_feedback_terms_flow_into_the_retri…] | lang=en
- "tests_test_feedback_rationale_124": "When the excluded papers leave no scope that covers the question, the     revisi" | kind=entity | source=backend/tests/test_feedback.py:L124 | neighbors=[test_exclusion_that_starves_evidence_as…] | lang=en
- "tests_test_feedback_rationale_129": "When the excluded papers leave no scope that covers the question, the     revisi" | kind=entity | source=backend/tests/test_feedback.py:L129 | neighbors=[test_exclusion_that_starves_evidence_as…] | lang=en
- "tests_test_feedback_rationale_184": "Vectors are never rebuilt or dropped by feedback -- only a paper delete     touc" | kind=entity | source=backend/tests/test_feedback.py:L184 | neighbors=[test_vectors_survive_revisions()] | lang=en
- "tests_test_feedback_rationale_191": "Vectors are never rebuilt or dropped by feedback -- only a paper delete     touc" | kind=entity | source=backend/tests/test_feedback.py:L191 | neighbors=[test_vectors_survive_revisions()] | lang=en
- "tests_test_feedback_rationale_46": "Revise, resuming via a reply whenever the retriever pauses. When an     exclusio" | kind=entity | source=backend/tests/test_feedback.py:L46 | neighbors=[_revise()] | lang=en
- "tests_test_feedback_rationale_50": "Revise, resuming via a reply whenever the retriever pauses. When an     exclusio" | kind=entity | source=backend/tests/test_feedback.py:L50 | neighbors=[_revise()] | lang=en
- "tests_test_feedback_test_revise_requires_a_completed_session": "test_revise_requires_a_completed_session()" | kind=code-symbol | source=backend/tests/test_feedback.py:L157 | neighbors=[test_feedback.py] | lang=en
- "tests_test_ingest_rationale_1": "Ingestion tests: extraction, running-head removal, dedup, and prose scoring." | kind=entity | source=backend/tests/test_ingest.py:L1 | neighbors=[test_ingest.py] | lang=en
- "tests_test_ingest_rationale_12": "The bug this guards against is destructive.      Scanning every line of every pa" | kind=entity | source=backend/tests/test_ingest.py:L12 | neighbors=[test_running_heads_only_matches_page_ed…] | lang=en
- "tests_test_ingest_rationale_130": "Authoritative metadata must win over whatever the PDF header guessed.      The b" | kind=entity | source=backend/tests/test_ingest.py:L130 | neighbors=[test_metadata_overrides_extracted_title…] | lang=en
- "tests_test_ingest_rationale_36": "A repeated bare page number at a page edge is a running head." | kind=entity | source=backend/tests/test_ingest.py:L36 | neighbors=[test_bare_page_numbers_are_caught()] | lang=pt
- "tests_test_ingest_rationale_42": "Each page number appears once, so none of them is a *running* head.      Getting" | kind=entity | source=backend/tests/test_ingest.py:L42 | neighbors=[test_unique_page_numbers_are_not_treate…] | lang=en
- "tests_test_ingest_rationale_56": "Pattern-list order used to win, so a page that merely *mentions*     \"5. Results" | kind=entity | source=backend/tests/test_ingest.py:L56 | neighbors=[test_section_is_the_earliest_heading_on…] | lang=en
- "tests_test_ingest_test_different_papers_get_different_ids": "test_different_papers_get_different_ids()" | kind=code-symbol | source=backend/tests/test_ingest.py:L103 | neighbors=[test_ingest.py] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-023.json

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
