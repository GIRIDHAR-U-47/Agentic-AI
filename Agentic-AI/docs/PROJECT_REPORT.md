# R-Lens Research Pilot — Project Report

Status: **implemented and tested on the real 7-paper corpus + fresh-topic arXiv discovery (offline demo path), vector RAG (sqlite tested / Astra PENDING), OpenRouter slots (PENDING without key), HITL revisions, evidence transparency** (generated 2026‑09‑28).

This report records what the "Research Pilot" mini‑project now genuinely does, what
was verified, and where results stay PENDING by design (no LLM/Astra/arXiv-live
credentials were available in the environment, so the harness structure for them
exists but no score is claimed).

---

## 1. End‑to‑end workflow (defensible)

The four-phase flow runs against real arXiv PDFs (see `backend/scripts/fetch_corpus.py`
manifest — 7 pinned papers, SHA‑256 locked, exact text extracted and chunked):

```
question → (discover on arXiv?) → rank/ingest → human approves sources → agent loop → verification → review → feedback → revised draft
```

| Phase | What runs | Where |
| --- | --- | --- |
| Paper sourcing | `scripts/fetch_corpus.py` ingests 7 real PDFs; metadata from the PDF/fetch, never hand-written; fresh topics via `discovery.py` (arxiv search, refine, dedupe, ingest-on-approval, abstract-only labelling) | `backend/services/ingest.py`, `arxiv.py`, `discovery.py` |
| Retrieval | BM25 + reciprocal-rank fusion + section boosts (abstract/intro 0.4, method 0.5), per-paper diversification | `backend/services/retrieval.py` |
| Human approval | candidates ranked for the question; approval gate enforced in tools (`search_papers` refuses unapproved docs) and in the workflow layer (run refuses without approvals) | `backend/routers/sessions.py`, `services/workflow.py` |
| Agent loop | plan → search → coverage check → read → reason, with budgets (`max_agent_iterations`, `max_tool_calls`, `max_query_refinements`); every step in the activity log | `backend/services/agent/executor.py`, `offline_policy.py`, `tools.py` |
| Source-backing | every delivered claim carries a resolvable `[S#]` marker; verification is mechanical (marker resolves, quote match, numeric containment, support floor); failed claims are dropped | `backend/services/agent/reflection.py` |
| Review | structured review assembled from *surviving* claims only: direct answer, key findings, comparison table, themes, limitations, gaps, sources (`marker + page + quote`), arXiv source links, abstract-only badges, automated-check disclaimer | `backend/services/review_service.py` |
| Persistence | sessions, approvals, citations, activity, revisions, metrics in SQLite; `awaiting_user` pauses resume after a human reply; drafts survive restart | `backend/db.py`, `services/workflow.py` |
| Feedback loop | feedback + exclusions → revised draft; per-round scope; prior draft kept as a revision | `backend/services/workflow.py` |

Visible activity log: `AgentActivityLog` renders the real `seq`‑ordered events
(plan/tool/limit/decision/verification). An offline trace for an out-of-scope
question shows: search → coverage check (1/5 terms) → refine → coverage check →
refine → **request user clarification** → 0 citations.

Retry/tool limits: `api/health` exposes `max_agent_iterations`, `max_tool_calls`,
`max_query_refinements`, `retrieval_top_k`. When the iteration limit is hit,
`langchain-classic`'s `EXHAUSTED_MARKER` text is detected and reported honestly
(`tests/test_agent.py::test_iteration_budget_is_reported_honestly`).

Insufficient evidence, never invention: the out-of-scope question ("asymptotic
freedom scale in quantum chromodynamics") yields **0 citations in all three modes**;
agentic search first, then asks the human. There is no path that prints a paper,
DOI or quote the corpus did not provide (BibTeX/CSV exports include only fields
the corpus recorded; empty year/DOI are omitted, not guessed).

## 2. Evaluation harness (`backend/eval/`)

`python -m eval.run_eval` runs 7 questions × 3 modes × provider slots (offline +
declared keyed providers; OpenRouter appears as a two-slot PENDING pair without a
key), writing `eval/results/latest.json` + a markdown table. Gold facts are quoted
**verbatim from the pipeline's own extracted abstracts** (verifiable single-chunk
quotes — a pre-check confirmed all 20 quotes appear in chunk text). Metrics are
mechanical.

### Results — offline provider (deterministic; runs everywhere)

| question | mode | cite | support | fact_recall | r_prec | verified | lat |
| --- | --- | --- | --- | --- | --- | --- | --- |
| patchtst_channel_independence | basic_rag | 4 | 1.00 | 0.0 | 0.50 | True | 0.05s |
| patchtst_channel_independence | agentic_rag | 2 | 1.00 | 0.0 | 1.00 | True | 0.11s |
| transformer_limits_ltsf | basic_rag | 5 | 1.00 | 0.0 | 0.00 | True | 0.09s |
| transformer_limits_ltsf | agentic_rag | 3 | 0.75 | 0.0 | 0.00 | False | 0.07s |
| autoformer_decomposition | basic_rag | 4 | 1.00 | 0.0 | 0.33 | True | 0.06s |
| autoformer_decomposition | agentic_rag | 3 | 1.00 | 0.0 | 0.00 | True | 0.08s |
| informer_efficiency | basic_rag | 5 | 1.00 | 0.33 | 0.25 | True | 0.05s |
| informer_efficiency | agentic_rag | 5 | 0.83 | 0.33 | 0.25 | False | 0.07s |
| itransformer_inversion | basic_rag | 4 | 1.00 | 0.0 | 0.50 | True | 0.05s |
| itransformer_inversion | agentic_rag | 2 | 0.80 | 0.0 | 0.50 | False | 0.07s |
| cross_model_forecasting | basic_rag | 5 | 1.00 | 0.0 | 0.50 | True | 0.05s |
| cross_model_forecasting | agentic_rag | 5 | 1.00 | 0.0 | 0.50 | True | 0.07s |
| out_of_scope_qcd | basic_rag | **0** | 0.00 | — | — | False | 0.05s |
| out_of_scope_qcd | agentic_rag | **0** | 0.00 | — | — | False | 0.17s |

- **Consistency**: agentic runs executed twice per cell — deterministic provider,
  `consistency = 1.0` everywhere; `deterministic_inconsistencies: []`.
- **PENDING cells**: every keyed provider cell (`gemini` / `openai` /
  `openrouter`) is PENDING ("no GEMINI_API_KEY set / no OPENAI_API_KEY set / no
  OPENROUTER_API_KEY set") and cross-LLM consistency is PENDING ("need ≥ 2
  keyed providers; only offline present"). **No score is invented for a provider
  that was not called.**
- **Reading the numbers honestly**: support_rate is high and verified=True when
  all delivered claims resolved to real passages. `fact_recall` is *verbatim*
  gold-sentence containment in the answer — a strict lower bound: extractive mode
  quotes whatever ranked in the top passages, so a true paraphrase scores a miss.

## 3. Fresh-topic arXiv discovery (any topic)

The corpus mode ranks the pinned papers; **discovery mode** searches arXiv live for
any topic (`POST /api/sessions` with `discover=true`, or the "Discover on arXiv"
button in the UI). Flow, in `backend/services/discovery.py`:

| Step | Behaviour |
| --- | --- |
| Search | real candidates from the arXiv export API (scroll-window query, lexical coverage floor) |
| Refine | if the first pass misses the question's terms, a refined second pass runs automatically and is recorded as an event for the UI |
| Dedupe | candidates whose arXiv id/title matches a stored paper are skipped ("known paper(s) skipped") and the search trail persists in `discovery_cache` + `discovery_meta` |
| Ingest-on-approval | approving a candidate downloads the PDF (full text, source URL preserved) or stores an explicitly-labelled **abstract-only** record when the PDF cannot be fetched |
| Provenance | every candidate keeps arXiv id, abstract URL, PDF URL; source links survive into citations and reviews |

**Demo** (offline honest path): with `RLENS_FAKE_ARXIV=1` the exact same flow runs
against *real* paper fixtures (GCN 1704.01265, GAT 1801.07606, Graph Wavelet Net
1803.03378, JK-Net, N-BEATS, TFT…) and is clearly labelled "fake" in the UI. The
demo session `ses-c62066217a5b` at "How do graph neural networks perform message
passing?" shows: first pass poor → refinement event → 1 known paper skipped →
approve 3 (GCN/GAT full-text, GWN abstract-only) → reject 2 (N-BEATS, TFT)
recorded → 2-citation verified review with arXiv source links.

**Live note**: the arXiv export API was rate-limited/blocked from this
environment, so live *real* discovery could not be demonstrated end-to-end here;
the live path is exercised by the API smoke tests (PENDING when unreachable) and
switched on by leaving `RLENS_FAKE_ARXIV` unset. This is reported honestly in §9.

## 4. Vector RAG (Astra DB)

`backend/services/vectorstore.py` + `embeddings.py`. One documented embedding
model (`text-embedding-3-small`, 1536 dims) via the OpenAI package; without a key
a deterministic local `FakeEmbedder` (hash-v1, 64 dims) is used and clearly
labelled "fake" — fake vectors are never sent to Astra.

- `RLENS_VECTOR_BACKEND=off` (default) keeps BM25 — the original pilot behaviour;
  agentic retrieval uses vectors only when a vector backend is enabled, and
  `basic_rag` is **always BM25** (the baseline never moves).
- `sqlite` stores passages in a local vector table, fully testable with zero
  credentials (`tests/test_vectorstore.py`).
- `astra` talks to Astra DB's Data API v1 over raw httpx.
- Passages are upserted with `page`/`paper`/`source_url` metadata; retrieval is
  restricted to the session's approved papers; vectors survive feedback revisions
  and are deleted only on explicit paper deletion.
- **No Astra credentials existed in this environment** — the Astra path is
  implemented, documented and PENDING live tests (see §9).

## 5. OpenRouter LLM slots

`backend/services/llm/openrouter.py` + provider registry. Two OpenRouter model
slots are always declared — `openrouter` (default `openai/gpt-4o-mini`) and
`openrouter-strong` (default `anthropic/claude-3.5-sonnet`) — so ≥ 2 OpenRouter
models can be compared in the eval harness whenever `OPENROUTER_API_KEY` is set.
The key lives in the backend environment only.

- The eval harness auto-adds both slots as **PENDING** rows when the key is absent
  (`_provider_state` iterates `config.PROVIDERS`); no score is invented.
- A keyed provider without a key is **refused** with a clear error when requested
  for a live run (`workflow._resolve_provider`) — never silently swapped, and
  offline output is never labelled as OpenRouter.
- The `offline` provider remains fully functional and is labelled offline in the UI.

## 6. Human-in-the-loop: feedback, revisions, persistence

After a completed review, `POST /api/sessions/{id}/feedback` with text like
"exclude this paper", "focus on newer studies", or "compare the datasets" —
optionally ticking papers to exclude:

- The earlier draft and the feedback are saved in the session's `revisions`
  history (SQLite, survives restarts); the UI shows a browsable **Drafts** strip.
- The feedback is folded into the research question; excluded papers are dropped
  from the *revised* retrieval scope only (approvals stay intact); the agent
  re-retrieves and produces a revised draft.
- Exclusions are **per round** — they never leak into later rounds.
- Tests prove the feedback changes retrieval/answer: excluding the GCN citation
  from the demo session makes draft 2 cite a different paper set.
- Sessions — drafts, approvals, activity, pauses — survive a full backend restart
  (verified: session `ses-c62066217a5b` reloads identical after restart).

## 7. Evidence-quality transparency

- Claims resolve to real `paper + page + passage`; the UI's "Cited passages" cards
  link out to the arXiv source and show the page.
- Papers whose PDF could not be fetched are stored and rendered as
  **"(abstract only -- full text unavailable)"** — never presented as full text.
- If the approved scope cannot cover the question, the agent pauses
  (`awaiting_user`) and asks the human rather than fabricating (demoed by
  scoping a revision to the single abstract-only paper: the agent honestly
  reports the papers "do not appear to cover this question").
- Automatic citation checks ("support rate", "verified") are presented as
  **warnings for human review**, with an explicit disclaimer line — they are
  mechanical checks, not proof that a claim is scientifically correct.

## 8. Guideline-by-guideline status

| Guideline | Status | Evidence |
| --- | --- | --- |
| Literature-review agent + human approval | ✅ | `services/workflow.py` + `tests/test_api.py` HTTP create→approve→run→markdown |
| Visible activity log | ✅ | `AgentActivityLog` (frontend) renders `seq`-ordered events; offline trace above |
| Retry / tool limits | ✅ | `config.py` limits; `EXHAUSTED_MARKER` honesty test; `TestToolBudget` |
| Insufficient evidence instead of invented content | ✅ | coverage gate in `retrieval.py`/`tools.py`/`executor.py`; QCD → 0 citations in all modes |
| Evaluation: basic vs agentic | ✅ | matrix above |
| Retrieval relevance | ✅ | precision/recall/F1 of cited papers vs gold papers |
| Citation support | ✅ | support_rate from mechanical verification |
| Factual accuracy | ✅ | verbatim gold-fact containment (strict) |
| Consistency | ✅ | offline 1.0; cross-LLM PENDING (no keys) |
| Latency | ✅ | per-run `latency_s` |
| Cost | ⚠️ | `estimate_cost_usd` with provider price table; offline = free, unlisted = PENDING |
| ≥ 2 LLMs | ⚠️ | 5 provider slots declared (`offline`/`gemini`/`openai`/`openrouter`/`openrouter-strong`); keyed cells PENDING without keys |
| Any-topic arXiv discovery | ✅ℹ️ | `discovery.py`, refine/dedupe/abstract-only, demoed with real fixtures (`RLENS_FAKE_ARXIV=1`); live arXiv unreachable from this env → PENDING live |
| Vector RAG (Astra DB) | ⚠️ | implemented (`vectorstore.py`/`embeddings.py`, sqlite path tested); Astra live = PENDING (no creds) |
| OpenRouter ≥ 2 models | ⚠️ | two slots declared + PENDING in eval until `OPENROUTER_API_KEY` |
| HITL: feedback → revised draft | ✅ | `revise_review`/`answer_user`, revisions history, drafts UI, persistence across restart |
| Evidence transparency | ✅ | source links, abstract-only badges, support-rate warnings + disclaimer, honest insufficient-evidence pauses |
| Failure examples + reflection change | ✅ | `docs/FAILURE_CASES.md` (below) |
| Saved sessions / resume | ✅ | SQLite; `tests/test_workflow.py` resume-from-DB; `awaiting_user` reply |
| Usable product, README, report, tests, Graphify | ✅ | README, this report, **144 tests**, `graphify update .` |

## 9. What was NOT done (honesty)

- No hosted LLM run happened (no credentials in the environment). The matrix
  structure, prompts, provider glue (Gemini, OpenAI, OpenRouter ×2), cost model
  and PENDING marking exist; no keyed provider score is claimed.
- No live Astra DB call happened (no token/endpoint); the Data API client,
  collection schema and upsert/search paths are implemented and the sqlite vector
  path is fully tested, but "astra" mode is PENDING live validation.
- The arXiv export API was rate-limited/blocked from this environment, so live
  *real* discovery could not be demonstrated here; the identical flow ran against
  real paper fixtures with `RLENS_FAKE_ARXIV=1` and is labelled "fake" wherever it
  appears in the UI. Live discovery = PENDING from a network that allows arXiv.
- The older demo screens (paper tables driven by `MOCK_PAPERS`) are untouched;
  exports and the workspace chat were made honest (real corpus metadata only, no
  fabricated MSE/DOI claims), but those screens still render the pre-existing
  mock dataset — they are display scaffolding, not results.