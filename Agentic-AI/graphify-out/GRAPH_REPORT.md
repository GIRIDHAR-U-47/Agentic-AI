# Graph Report - .  (2026-09-28)

## Corpus Check
- 122 files · ~2,67,620 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1050 nodes · 1693 edges · 56 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 188 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output
- Edge kinds: contains: 554 · calls: 291 · rationale_for: 258 · uses: 188 · method: 135 · imports: 87 · imports_from: 84 · inherits: 50 · MODIFIES: 43 · ON_BRANCH: 2 · PARENT_OF: 1


## Input Scope
- Requested: all
- Resolved: all (source: cli)
- Included files: 122 · Candidates: recursive
- Excluded: 0 untracked · 0 ignored · 0 sensitive · 0 missing committed

## Graph Freshness
- Built from Git commit: `d6c5367`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `ActivityRecorder` - 43 edges
2. `init_db()` - 25 edges
3. `LLMError` - 24 edges
4. `BaseLLM` - 23 edges
5. `LLMResult` - 21 edges
6. `ExtractiveLLM` - 21 edges
7. `ToolContext` - 20 edges
8. `AgentNeedsUser` - 18 edges
9. `OfflineReactPolicy` - 17 edges
10. `ToolBudgetExceeded` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Deterministic ReAct policy for the offline (no-credentials) provider.  `Extracti` --uses--> `ExtractiveLLM`  [INFERRED]
  backend/services/agent/offline_policy.py → backend/services/llm/offline.py
- `A LangChain-compatible chat model that emits deterministic ReAct text.` --uses--> `ExtractiveLLM`  [INFERRED]
  backend/services/agent/offline_policy.py → backend/services/llm/offline.py
- `Broaden on each successive attempt while staying on the question's topic.` --uses--> `ExtractiveLLM`  [INFERRED]
  backend/services/agent/offline_policy.py → backend/services/llm/offline.py
- `Turn a natural-language question into keyword terms for BM25.      BM25 has no n` --uses--> `ExtractiveLLM`  [INFERRED]
  backend/services/agent/offline_policy.py → backend/services/llm/offline.py
- `Extract (action, input, observation) triples from the ReAct scratchpad.` --uses--> `ExtractiveLLM`  [INFERRED]
  backend/services/agent/offline_policy.py → backend/services/llm/offline.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (40): AgentActivityLog(), KIND_META, Props, SourceApprovalPanel(), ChatMessage, ChatWithPDF(), SUGGESTED_QUESTIONS, inline() (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (29): dict, BM25, content_terms(), coverage_passes(), detect_intents(), lexical_coverage(), _rank(), rank_papers() (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (20): AstraVectorStore, build_vector_store(), ChromaVectorStore, cosine(), _dot(), _norm(), Vector retrieval: local persistent Chroma DB.  Requirement 4c of the pilot is a, Astra DB Data API vector store (no extra dependency: httpx only).      Enabled o (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (43): approved_doc_ids(), cache_discovery(), clear_actor_approvals(), _connect(), corpus_stats(), create_session(), cursor(), delete_document() (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (20): build_embedder(), Embedder, FakeEmbedder, OpenAIEmbedder, OpenRouterEmbedder, Embeddings: one documented model via OpenRouter, honest fallback.  The documente, Return the real embedder when OPENROUTER_API_KEY exists, else the fake one., A text -> vector function with an honest identity. (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (32): answer_user(), _enrich_citations(), _finalize_revision(), get_session_view(), The end-to-end review workflow.  This is the layer the API and the UI actually c, Attach stored document metadata (source URL, full-text availability,     canonic, Record the researcher's approve/reject choices.      Passing an empty list clear, Execute the configured mode for a session with an approved paper set. (+24 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (11): ActivityEvent, ActivityRecorder, _extract_hit_count(), _pick(), Structured activity log captured from the LangChain callback interface.  `AgentE, Manually record a non-callback step (plan, decision, limit)., Whitespace-token count for providers that report no usage.          Deliberately, One observable step in the agent's reasoning. (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (17): Per-run state shared by the tools., ToolContext, Agent loop, approval gate, limits, and the insufficient-evidence path.  These ar, A run cut short must not present the executor's stop string as content.      Lan, An unanswerable question must either be refused or paused for the human.      An, Markers in the answer must match the citation records exactly.      These two na, Tool and refinement counts come from the LangChain callbacks, not notes.      Co, `search_papers` is passed only approved ids, so the corpus it sees is     the ap (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (22): ArxivClient, _canonical(), _dedupe_and_filter(), discover(), _FakeArxivClient, _ingest_abstract_only(), ingest_candidate(), list_cached_discoveries() (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (7): HTTP-level tests against the real FastAPI app and the real corpus.  These assert, No hardcoded provenance. With no session scoped, the list is empty., The Chat-with-PDF page calls these; they must not regress., create -> approve -> run -> read back, exactly as the UI does it., test_full_review_flow_over_http(), test_legacy_agent_steps_are_empty_without_runs(), test_pdf_routes_still_work()

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (23): _build_citations(), ClaimCheck, _content(), _index_evidence(), is_heading_free(), _is_probably_not_a_claim(), normalise_number(), _numbers_in() (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (23): clean_db(), corpus(), _corpus_restorer(), Shared pytest fixtures.  Every test runs against a **temporary database and data, Real corpus rows present in *this* test's database.      Unlike the session-scop, Real corpus rows present in *this* test's database.      Unlike the session-scop, Real corpus rows present in *this* test's database.      Unlike the session-scop, Read-only view of the ingested real corpus. (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (16): delete_document(), get_all_documents(), query_pdf_rag(), QueryRequest, Returns list of currently indexed PDF documents in this session, Upload a PDF. Extracts real text via PyMuPDF, chunks it, and indexes it.     Re, Multi-step Agentic RAG over the uploaded PDF session.     Retrieval is strictly, Removes a document from the active session (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (23): build_sections_and_chunks(), _clean(), extract_abstract(), extract_pages(), find_running_heads(), guess_authors(), guess_doi(), guess_title() (+15 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (15): DEFAULT_CHAT_MESSAGES, defaultFilters, IntentPayload, ResearchChatMessage, ResearchContext, ResearchContextType, ResearchProvider(), MOCK_AGENT_STEPS (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (11): LLMError, Raised when a provider call fails in a way the caller must handle., ApprovalIn, Decision, feedback(), FeedbackIn, Session + review workflow endpoints.  Route map (the demo path is exactly this o, Researcher feedback on a completed review -> revised draft.      The earlier dra (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (19): _complete_review(), Researcher feedback -> revised review (HITL round 2).  The end-to-end flow: draf, Proving the feedback re-drives retrieval: the effective question the     retriev, Proving the feedback re-drives retrieval: the effective question the     retriev, When the excluded papers leave no scope that covers the question, the     revisi, When the excluded papers leave no scope that covers the question, the     revisi, Vectors are never rebuilt or dropped by feedback -- only a paper delete     touc, Vectors are never rebuilt or dropped by feedback -- only a paper delete     touc (+11 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (11): Ingestion tests: extraction, running-head removal, dedup, and prose scoring., The bug this guards against is destructive.      Scanning every line of every pa, Authoritative metadata must win over whatever the PDF header guessed.      The b, A repeated bare page number at a page edge is a running head., Each page number appears once, so none of them is a *running* head.      Getting, Pattern-list order used to win, so a page that merely *mentions*     "5. Results, test_bare_page_numbers_are_caught(), test_metadata_overrides_extracted_title() (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (19): assemble_review(), _blank(), _bucket(), build_comparison_table(), _clean(), _keywords(), _locator(), _markers() (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (5): Session lifecycle, approval gate, resumption, and review assembly.  The review a, A review must resume from the database, not from process memory., Missing fields must be `None`, not a placeholder that reads as data., test_no_paper_metadata_is_invented(), test_session_state_is_reproducible_after_reload()

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (13): AgentNeedsUser, Raised by the tool layer when the per-run tool budget is spent., Raised when the agent decides it must ask the human something.      Carries the, ToolBudgetExceeded, Agentic literature-review engine.  `from services.agent import run, MODES` is th, _assign_markers(), build_tools(), Agent tools.  Two design points matter here and both are load-bearing for the br (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (9): expand_query(), OfflineReactPolicy, _parse_scratchpad(), _question_from_prompt(), Deterministic ReAct policy for the offline (no-credentials) provider.  `Extracti, A LangChain-compatible chat model that emits deterministic ReAct text., Broaden on each successive attempt while staying on the question's topic., Turn a natural-language question into keyword terms for BM25.      BM25 has no n (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (15): available_providers(), default_provider(), get_provider(), Limits, llm_status(), ProviderSpec, Central configuration for R-Lens, sourced from environment / .env.  No new depen, Pick the best provider that actually has credentials.      Preference order hono (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (12): LLMResult, LLM provider layer.  `from services.llm import build_llm` is the only import cal, ExtractiveLLM, Composes an answer from verbatim source sentences only., _adapter_class(), as_chat_model(), build_llm(), Provider factory and the LangChain adapter.  `build_llm()` returns a `BaseLLM` f (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (11): ComplianceChecks, EmpiricalResult, EvidenceMatrixRow, build_evidence_matrix(), Evidence matrix + citation export, repointed from mock data to real data.  Why t, Persist a reviewer's status decision against the session., Verified citations, keyed by marker., BibTeX built from real document metadata. Never invents an identifier. (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (11): AgentGallery(), AGENTS, FILTERS, Comparison(), FindTopics(), TOPIC_CARDS, TRENDING_TOPICS, MODES (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (13): candidate_sentences(), _content_tokens(), is_heading(), is_self_contained(), _mmr(), parse_evidence(), Deterministic extractive provider -- works with zero API credentials.  This is N, True when a sentence reads unambiguously with no surrounding context.      Rejec (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.16
Nodes (12): _fake_client(), Fresh-topic discovery: arXiv search, refinement, dedupe, ingest-on-approval.  Ev, Approving an arXiv candidate materialises it before the decision is     recorded, Rejecting a fresh-topic candidate that has never been materialised as a     docu, test_approving_a_discovery_candidate_ingests_then_runs(), test_discover_caches_and_reuses(), test_discover_empty_question_is_harmless(), test_discover_returns_canonical_candidates() (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (3): Reflection / verification tests.  Verification is the project's central safety c, 0.397 and .397 must compare equal., test_trailing_zero_normalisation()

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (8): MOCK_EVIDENCE_ROWS, EvidenceValidation(), ResearchWorkspace(), api, fetchCorpusDocs(), ResearchService, CorpusDocument, EvidenceMatrixRow

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (15): action_taken_when_out_of_scope(), consistency(), _content(), estimate_cost_usd(), fact_hit(), factual_accuracy(), _norm(), Scoring functions for the R-Lens evaluation harness.  Deliberately mechanical. E (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (6): OpenAICompatLLM, OpenAI provider, also covering any OpenAI-compatible endpoint.  `OPENAI_BASE_URL, OpenRouterLLM, OpenRouter provider: one key, many model families.  OpenRouter exposes OpenAI-co, ChatOpenAI pointed at OpenRouter, tagged with the app identity., OpenAICompatLLM

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (11): ArxivLookupIn, corpus_stats(), DocumentOut, list_corpus(), Corpus endpoints: what is in the collection, and how to add to it.  The legacy `, Ingest an uploaded PDF. Fails loudly on scans rather than indexing blanks., Ingest an uploaded PDF. Fails loudly on scans rather than indexing blanks., Rank the corpus for a question. Used to populate the approval panel. (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.27
Nodes (12): _evidence_prompt(), _paper_records(), _persist(), The three run modes, and the agent loop that drives the agentic one.  Modes ----, Answer with no retrieval at all. Deliberately hallucination-prone., Single retrieve + single generate. No planning, no tools, no reflection., The full agentic loop. May pause for human input; may refuse to answer., run() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (7): main, 170f30e Initial commit, d6c5367 commit, *.jpeg, *.jpg, *.png, *.svg

### Community 35 - "Community 35"
Cohesion: 0.23
Nodes (13): ArxivError, download_pdf(), _get(), lookup(), _parse_entry(), pdf_url(), _query(), Minimal arXiv client: metadata lookup + search.  The arXiv API needs no credenti (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (6): AgentProvenanceStep, AgentService, _duration(), Agent provenance, repointed from mock steps to the real activity log.  The origi, Fully autonomous runs are not supported.          R-Lens is a human-in-the-loop, Record a researcher instruction on a session's activity log.

### Community 37 - "Community 37"
Cohesion: 0.28
Nodes (7): Paper, _method_category(), _method_tag(), PaperService, Paper service, repointed from mock data to the real corpus.  What changed and wh, Validation status is per-session (see approvals), not a paper property., Coarse classification from the paper's own text, not from a fixed table.

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (10): BaseModel, AgentInstructionRequest, AutoPilotRequest, EvidenceAnchor, PaperMetric, PaperMetrics, PaperSection, ReportCitation (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (9): ResearchHome(), TOOL_ROW, TOOLS, WORKSPACE_CARDS, WorkspaceCard, analyzeIntent(), generateSubQueries(), IntentAnalysisResult (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (3): OpenRouter provider registration, honest-key handling, and mislabel guards.  No, The evaluation harness iterates config.PROVIDERS, so the two OpenRouter     slot, test_eval_matrix_includes_openrouter_slots()

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (5): ABC, BaseLLM, Provider-agnostic LLM contract.  Every provider returns the same `LLMResult`, so, One-shot text generation. Chat/tool-calling layers build on this., _Timer

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (5): AutoPilotIn, get_autopilot_status(), InstructionIn, Agent provenance endpoints.  The original returned six hardcoded `MOCK_AGENT_STE, Always false: R-Lens is human-in-the-loop by design.

### Community 43 - "Community 43"
Cohesion: 0.31
Nodes (6): useResearch(), AppLayout(), primaryNavItems, secondaryNavItems, Sidebar(), Topbar()

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (4): export_bibtex(), Evidence + citation export endpoints.  These now require an optional `session_id, BibTeX from real document metadata. No invented DOIs or entries., StatusUpdate

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (3): BaseLLM, GeminiLLM, Google Gemini provider.  Uses the LangChain integration (`langchain_google_genai

### Community 46 - "Community 46"
Cohesion: 0.39
Nodes (7): main(), _provider_state(), Run the R-Lens evaluation matrix.  Usage (from backend/):      $env:PYTHONIOENCO, Run one cell safely. Never lets a provider crash the whole matrix.      `doc_ids, _run_cell(), run_matrix(), _table()

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (6): COLORS, EXTRACT_OPTIONS, ExtractData(), ExtractedItem, ICONS, MOCK_RESULTS

### Community 48 - "Community 48"
Cohesion: 0.29
Nodes (3): delete_paper(), Vector collection management.  Vectors are upserted when a paper is ingested/syn, Explicitly delete a paper from the collection: vectors + document.

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (4): AIDetector(), AnalysisResult, getScoreLabel(), MOCK_RESULT

### Community 50 - "Community 50"
Cohesion: 0.53
Nodes (5): load_manifest(), main(), Download and ingest the pinned evaluation/demo corpus from arXiv.  The mini proj, save_manifest(), sha256()

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (4): AIWriter(), SUGGESTIONS, TEMPLATES, WritingMode

### Community 52 - "Community 52"
Cohesion: 0.40
Nodes (4): CitationGenerator(), CitationResult, FORMATS, SAMPLE_CITATIONS

### Community 53 - "Community 53"
Cohesion: 0.40
Nodes (2): DiscoverIn, Fresh-topic discovery endpoint: search arXiv, refine, cache.

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (1): AgentService

### Community 56 - "Community 56"
Cohesion: 1.00
Nodes (1): Prompts for the agentic stages.  The grounded-answer prompt is preserved from th

## Knowledge Gaps
- **241 isolated node(s):** `Limits`, `Central configuration for R-Lens, sourced from environment / .env.  No new depen`, `A concrete LLM the system can talk to.`, `Pick the best provider that actually has credentials.      Preference order hono`, `Machine-readable provider status, surfaced at /api/health.` (+236 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 53`** (2 nodes): `DiscoverIn`, `Fresh-topic discovery endpoint: search arXiv, refine, cache.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `AgentService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `Prompts for the agentic stages.  The grounded-answer prompt is preserved from th`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LLMError` connect `Community 15` to `Community 41`, `Community 20`, `Community 45`, `Community 23`, `Community 31`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `ActivityEvent` connect `Community 6` to `Community 20`, `Community 36`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `Agentic literature-review engine.  `from services.agent import run, MODES` is th` connect `Community 20` to `Community 6`, `Community 33`, `Community 10`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `ActivityRecorder` (e.g. with `The three run modes, and the agent loop that drives the agentic one.  Modes ----` and `Answer with no retrieval at all. Deliberately hallucination-prone.`) actually correct?**
  _`ActivityRecorder` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `LLMError` (e.g. with `GeminiLLM` and `Google Gemini provider.  Uses the LangChain integration (`langchain_google_genai`) actually correct?**
  _`LLMError` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Limits`, `Central configuration for R-Lens, sourced from environment / .env.  No new depen`, `A concrete LLM the system can talk to.` to the rest of the system?**
  _241 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0641025641025641 - nodes in this community are weakly interconnected._