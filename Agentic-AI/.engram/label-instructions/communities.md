# Community Labeling

Engram is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the community listing below
and write 2-5 word plain-language names for each.

## Language

Write every name in English (en). Do not switch languages.

## Communities

Community 0: AgentActivityLog.tsx, AgentActivityLog(, KIND_META, SourceApprovalPanel.tsx, Props, SourceApprovalPanel(, ChatWithPDF.tsx, ChatMessage, ChatWithPDF(, SUGGESTED_QUESTIONS, LiteratureReview.tsx, inline(
Community 1: dict, retrieval.py, BM25, .__init__(, .score(, content_terms(, coverage_passes(, detect_intents(, lexical_coverage(, _rank(, rank_papers(, Deterministic retrieval over the chunk store.  Design ------
Community 2: vectorstore.py, AstraVectorStore, .count(, .delete_paper(, .health(, .__init__(, ._post(, .retrieve(, .upsert_paper(, build_vector_store(, ChromaVectorStore, cosine(
Community 3: init_db(, db.py, approved_doc_ids(, cache_discovery(, clear_actor_approvals(, _connect(, corpus_stats(, create_session(, cursor(, delete_document(, delete_session(, _dumps(
Community 4: embeddings.py, build_embedder(, Embedder, .embed(, .embed_batch(, .label(, FakeEmbedder, OpenAIEmbedder, .__init__(, OpenRouterEmbedder, Embeddings: one documented model via OpenRouter, honest fall, Return the real embedder when OPENROUTER_API_KEY exists, els
Community 5: workflow.py, answer_user(, _enrich_citations(, _finalize_revision(, get_session_view(, The end-to-end review workflow.  This is the layer the API a, Attach stored document metadata (source URL, full-text avail, Record the researcher's approve/reject choices.      Passing, Execute the configured mode for a session with an approved p, Resume a session that paused to ask the human something.    , Everything the UI needs to render a resumable session., A workflow step cannot proceed. Surfaced to the client as 40
Community 6: ActivityRecorder, callbacks.py, ActivityEvent, .to_dict(, ._add(, .as_dicts(, .budget_left(, .estimate_usage(, .__init__(, ._last_dt(, .note(, .on_agent_action(
Community 7: ToolContext, Per-run state shared by the tools., .top_chunks(, .unique_docs(, test_agent.py, Agent loop, approval gate, limits, and the insufficient-evid, A run cut short must not present the executor's stop string , An unanswerable question must either be refused or paused fo, Markers in the answer must match the citation records exactl, Tool and refinement counts come from the LangChain callbacks, `search_papers` is passed only approved ids, so the corpus i, `read_passage` resolves against the passages this run actual
Community 8: discovery.py, ArxivClient, .download_pdf(, .search(, _canonical(, _dedupe_and_filter(, discover(, _FakeArxivClient, .__init__(, _ingest_abstract_only(, ingest_candidate(, list_cached_discoveries(
Community 9: test_api.py, client(, HTTP-level tests against the real FastAPI app and the real c, No hardcoded provenance. With no session scoped, the list is, The Chat-with-PDF page calls these; they must not regress., create -> approve -> run -> read back, exactly as the UI doe, test_autopilot_is_reported_as_unsupported(, test_bibtex_export_is_real(, test_corpus_document_detail(, test_corpus_lists_real_papers(, test_evidence_matrix_is_empty_without_a_session(, test_full_review_flow_over_http(
Community 10: reflection.py, _build_citations(, ClaimCheck, .ok(, .to_dict(, _content(, _index_evidence(, is_heading_free(, _is_probably_not_a_claim(, normalise_number(, _numbers_in(, _overlap(
Community 11: conftest.py, chunks(, clean_db(, corpus(, _corpus_restorer(, Shared pytest fixtures.  Every test runs against a **tempora, Real corpus rows present in *this* test's database.      Unl, Read-only view of the ingested real corpus., Re-materialise the real corpus rows after any test that wipe, Ingest the cached real papers once per session., A database with the schema in place and no rows., real_corpus(
Community 12: pdf.py, delete_document(, get_all_documents(, get_document(, query_pdf_rag(, QueryRequest, Returns list of currently indexed PDF documents in this sess, Upload a PDF. Extracts real text via PyMuPDF, chunks it, and, Multi-step Agentic RAG over the uploaded PDF session.     R, Removes a document from the active session, upload_pdf(, pdf_rag_service.py
Community 13: ingest.py, build_sections_and_chunks(, _clean(, extract_abstract(, extract_pages(, find_running_heads(, guess_authors(, guess_doi(, guess_title(, guess_venue(, guess_year(, ingest_pdf(
Community 14: ResearchContext.tsx, DEFAULT_CHAT_MESSAGES, defaultFilters, IntentPayload, ResearchChatMessage, ResearchContext, ResearchContextType, ResearchProvider(, mockResearchData.ts, MOCK_AGENT_STEPS, MOCK_PAPERS, MOCK_REPORT_CITATIONS
Community 15: LLMError, Raised when a provider call fails in a way the caller must h, sessions.py, ApprovalIn, create_session(, Decision, delete_session(, feedback(, FeedbackIn, get_session(, health(, list_sessions(
Community 16: test_feedback.py, _complete_review(, Researcher feedback -> revised review (HITL round 2).  The e, Proving the feedback re-drives retrieval: the effective ques, When the excluded papers leave no scope that covers the ques, Vectors are never rebuilt or dropped by feedback -- only a p, Revise, resuming via a reply whenever the retriever pauses. , _revise(, test_excluding_every_approved_paper_is_an_explicit_refusal(, test_exclusion_that_starves_evidence_asks_instead_of_fabrica, test_feedback_reruns_with_exclusion_and_preserves_draft(, test_feedback_terms_flow_into_the_retrieved_scope(
Community 17: test_ingest.py, Ingestion tests: extraction, running-head removal, dedup, an, The bug this guards against is destructive.      Scanning ev, Authoritative metadata must win over whatever the PDF header, A repeated bare page number at a page edge is a running head, Each page number appears once, so none of them is a *running, Pattern-list order used to win, so a page that merely *menti, test_bare_page_numbers_are_caught(, test_different_papers_get_different_ids(, test_ingest_produces_usable_chunks(, test_ingest_rejects_non_pdf(, test_metadata_overrides_extracted_title(
Community 18: review_service.py, assemble_review(, _blank(, _bucket(, build_comparison_table(, _clean(, _keywords(, _locator(, _markers(, Assemble a structured, source-backed literature review.  Thi, One row per paper: what it claims, where the claim came from, Build the structured review from verified, cited claims only
Community 19: test_workflow.py, Session lifecycle, approval gate, resumption, and review ass, A review must resume from the database, not from process mem, Missing fields must be `None`, not a placeholder that reads , test_approval_rejects_nonsense_decision(, test_approval_rejects_unknown_document(, test_comparison_table_lists_every_paper_even_uncited(, test_empty_sections_say_not_established(, test_full_workflow_real_corpus(, test_markdown_render_mentions_every_source(, test_no_paper_metadata_is_invented(, test_real_run_produces_a_review_with_real_sources(
Community 20: AgentNeedsUser, ToolBudgetExceeded, .__init__(, .to_dict(, Raised by the tool layer when the per-run tool budget is spe, Raised when the agent decides it must ask the human somethin, __init__.py, Agentic literature-review engine.  `from services.agent impo, tools.py, _assign_markers(, build_tools(, _fmt_passage(
Community 21: OfflineReactPolicy, offline_policy.py, expand_query(, ._emit_final(, ._evidence_prompt(, ._finalise_answer(, .__init__(, ._insufficient_answer(, .llm_type(, .next_action(, ._refine(, ._think_then(
Community 22: config.py, available_providers(, default_provider(, ensure_dirs(, get_provider(, Limits, llm_status(, ProviderSpec, .key_present(, Central configuration for R-Lens, sourced from environment /, Pick the best provider that actually has credentials.      P, Machine-readable provider status, surfaced at /api/health.
Community 23: LLMResult, ExtractiveLLM, .to_dict(, .usage_known(, __init__.py, LLM provider layer.  `from services.llm import build_llm` is, .__init__(, Composes an answer from verbatim source sentences only., registry.py, _adapter_class(, as_chat_model(, build_llm(
Community 24: ComplianceChecks, EmpiricalResult, EvidenceMatrixRow, research_service.py, build_evidence_matrix(, Evidence matrix + citation export, repointed from mock data , Persist a reviewer's status decision against the session., Verified citations, keyed by marker., BibTeX built from real document metadata. Never invents an i, One row per paper that was actually cited in a verified revi, ResearchService, ._bibtex(
Community 25: AgentGallery.tsx, AgentGallery(, AGENTS, FILTERS, Comparison.tsx, Comparison(, FindTopics.tsx, FindTopics(, TOPIC_CARDS, TRENDING_TOPICS, Paraphraser.tsx, MODES
Community 26: offline.py, candidate_sentences(, _content_tokens(, ._compose(, .generate(, ._question(, is_heading(, is_self_contained(, _mmr(, parse_evidence(, Deterministic extractive provider -- works with zero API cre, True when a sentence reads unambiguously with no surrounding
Community 27: test_discovery.py, _fake_client(, Fresh-topic discovery: arXiv search, refinement, dedupe, ing, Approving an arXiv candidate materialises it before the deci, Rejecting a fresh-topic candidate that has never been materi, test_approving_a_discovery_candidate_ingests_then_runs(, test_arxiv_network_helpers_exist(, test_discover_caches_and_reuses(, test_discover_dedupes_against_corpus(, test_discover_empty_question_is_harmless(, test_discover_refines_when_first_pass_is_poor(, test_discover_returns_canonical_candidates(
Community 28: test_reflection.py, Reflection / verification tests.  Verification is the projec, 0.397 and .397 must compare equal., test_citations_only_include_used_markers(, test_correction_withdraws_unsupported_claims(, test_deictic_openers_rejected(, test_headings_are_not_claims(, test_is_heading_free_helper_exists(, test_no_citations_when_all_claims_fail(, test_no_correction_leaves_text_untouched(, test_number_in_source_passes(, test_number_not_in_source_is_flagged(
Community 29: MOCK_EVIDENCE_ROWS, EvidenceValidation.tsx, EvidenceValidation(, ResearchWorkspace.tsx, ResearchWorkspace(, api, researchService.ts, bibKey(, fetchCorpusDocs(, ResearchService, .exportMatrixCsv(, .generateBibTeX(
Community 30: metrics.py, action_taken_when_out_of_scope(, consistency(, _content(, estimate_cost_usd(, fact_hit(, factual_accuracy(, _norm(, Scoring functions for the R-Lens evaluation harness.  Delibe, Return (usd, known). Offline and anything unlisted -> (None,, One evaluatable row from one agent run., The out-of-scope question was handled correctly iff the run 
Community 31: openai_compat.py, available(, OpenAICompatLLM, ._ensure(, .generate(, .__init__(, OpenAI provider, also covering any OpenAI-compatible endpoin, openrouter.py, OpenRouterLLM, OpenRouter provider: one key, many model families.  OpenRout, ChatOpenAI pointed at OpenRouter, tagged with the app identi
Community 32: corpus.py, arxiv_lookup(, ArxivLookupIn, corpus_stats(, DocumentOut, get_doc(, list_corpus(, Corpus endpoints: what is in the collection, and how to add , Ingest an uploaded PDF. Fails loudly on scans rather than in, Rank the corpus for a question. Used to populate the approva, remove_doc(, suggest(
Community 33: executor.py, _evidence_prompt(, _paper_records(, _persist(, The three run modes, and the agent loop that drives the agen, Answer with no retrieval at all. Deliberately hallucination-, Single retrieve + single generate. No planning, no tools, no, The full agentic loop. May pause for human input; may refuse, run(, run_agentic(, run_basic_rag(, run_no_rag(
Community 34: main.py, root(, main, 170f30e Initial commit, d6c5367 commit, postcss.config.js, tailwind.config.js, vite.config.ts, main.tsx, vite-env.d.ts, *.jpeg, *.jpg
Community 35: arxiv.py, ArxivError, download_pdf(, _get(, lookup(, _parse_entry(, pdf_url(, _query(, Minimal arXiv client: metadata lookup + search.  The arXiv A, Download a paper PDF. Returns bytes; caller records the chec, Fetch authoritative metadata for one arXiv id (version suffi, Free-text arXiv search. Used by the agent's `search_papers` 
Community 36: AgentProvenanceStep, agent_service.py, AgentService, .add_instruction(, .get_sessions(, .get_steps(, .__init__(, .is_autopilot_mode(, .set_autopilot_mode(, _duration(, Agent provenance, repointed from mock steps to the real acti, Fully autonomous runs are not supported.          R-Lens is 
Community 37: Paper, paper_service.py, _method_category(, _method_tag(, PaperService, .get_paper_by_id(, .get_papers(, ._rows(, ._to_paper(, .update_paper_validation(, Paper service, repointed from mock data to the real corpus. , Validation status is per-session (see approvals), not a pape
Community 38: BaseModel, mock_data.py, schemas.py, AgentInstructionRequest, AutoPilotRequest, EvidenceAnchor, PaperMetric, PaperMetrics, PaperSection, ReportCitation, UpdateEvidenceStatusRequest, UpdateValidationRequest
Community 39: ResearchHome.tsx, ResearchHome(, TOOL_ROW, TOOLS, WORKSPACE_CARDS, WorkspaceCard, intentService.ts, analyzeIntent(, generateSubQueries(, IntentAnalysisResult, IntentType
Community 40: test_providers.py, OpenRouter provider registration, honest-key handling, and m, The evaluation harness iterates config.PROVIDERS, so the two, test_build_llm_falls_back_to_offline_without_key(, test_build_llm_returns_openrouter_with_key(, test_eval_matrix_includes_openrouter_slots(, test_keyed_providers_are_not_available_without_key(, test_run_review_refuses_mislabeled_offline_run(, test_start_session_refuses_mislabeled_offline_run(, test_two_openrouter_slots_are_registered(, test_unknown_provider_is_rejected(
Community 41: BaseLLM, ABC, base.py, .generate(, .health(, Provider-agnostic LLM contract.  Every provider returns the , One-shot text generation. Chat/tool-calling layers build on , _Timer, .__enter__(, .__exit__(
Community 42: agents.py, AutoPilotIn, get_autopilot_status(, get_provenance_steps(, InstructionIn, list_agent_sessions(, Agent provenance endpoints.  The original returned six hardc, Always false: R-Lens is human-in-the-loop by design., set_autopilot_status(, submit_instruction(
Community 43: useResearch(, AppLayout.tsx, AppLayout(, Sidebar.tsx, primaryNavItems, secondaryNavItems, Sidebar(, Topbar.tsx, Topbar(
Community 44: evidence.py, export_bibtex(, export_matrix_csv(, get_citations(, get_evidence_matrix(, Evidence + citation export endpoints.  These now require an , BibTeX from real document metadata. No invented DOIs or entr, StatusUpdate, update_matrix_row_status(
Community 45: BaseLLM, gemini.py, available(, GeminiLLM, ._ensure(, .generate(, .__init__(, Google Gemini provider.  Uses the LangChain integration (`la
Community 46: run_eval.py, main(, _provider_state(, Run the R-Lens evaluation matrix.  Usage (from backend/):   , Run one cell safely. Never lets a provider crash the whole m, _run_cell(, run_matrix(, _table(
Community 47: ExtractData.tsx, COLORS, EXTRACT_OPTIONS, ExtractData(, ExtractedItem, ICONS, MOCK_RESULTS
Community 48: collection.py, collection_health(, delete_paper(, Vector collection management.  Vectors are upserted when a p, Explicitly delete a paper from the collection: vectors + doc, sync_all(, sync_paper(
Community 49: AIDetector.tsx, AIDetector(, AnalysisResult, getHighlightColor(, getScoreLabel(, MOCK_RESULT
Community 50: fetch_corpus.py, load_manifest(, main(, Download and ingest the pinned evaluation/demo corpus from a, save_manifest(, sha256(
Community 51: AIWriter.tsx, AIWriter(, SUGGESTIONS, TEMPLATES, WritingMode
Community 52: CitationGenerator.tsx, CitationGenerator(, CitationResult, FORMATS, SAMPLE_CITATIONS
Community 53: discovery.py, cache(, discover(, DiscoverIn, Fresh-topic discovery endpoint: search arXiv, refine, cache.
Community 54: AgentService, .addInstruction(, .getSteps(, .isAutoPilotMode(, .setAutoPilotMode(
Community 55: papers.py, get_paper(, list_papers(, update_validation(
Community 56: prompts.py, Prompts for the agentic stages.  The grounded-answer prompt 
Community 57: debug_agent.py
Community 58: debug_revise.py
Community 59: debug_revise2.py
Community 60: debug_revise3.py
Community 61: debug_revise4.py
Community 62: debug_workflow.py
Community 63: debug_workflow2.py

## Instructions

Write a single JSON object mapping each community id (as a string) to its
2-5 word name to: D:\Agentic-Ai\Agentic-AI\.engram\label-instructions\communities.json

Example:
```json
{
  "0": "Authentication Flow",
  "1": "Authentication Flow",
  "2": "Authentication Flow"
}
```

Then re-run `engram update` (or `engram label`) to ingest the names.
