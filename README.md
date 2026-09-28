# R-Lens — Academic Research Assistant

> **Agentic AI academic research assistant**: real papers → retrieval → human approval → source-backed literature review, with an agent loop that re-verifies every claim, resumable saved sessions, a deterministic evaluation harness, and a UI wired to it all.

This is the **Research Pilot** stage: instead of demo screens over mock data, the review workflow runs end-to-end on real arXiv papers — either the seven pinned time-series foundation papers that seed the corpus, or any fresh topic discovered live on arXiv (with refinement when the first pass is poor, dedupe against the corpus, and explicit abstract-only labelling when a PDF cannot be fetched). Every number shown anywhere in the pipeline is produced by the pipeline.

---

## The workflow (what actually runs)

```
question → (discover on arXiv?) → rank/ingest → YOU approve sources → agent loop → verification → review → feedback → revised draft
```

1. **Create a session** (`POST /api/sessions`) — the corpus is ranked for your question and candidates are returned. Nothing is retrieved yet. With `Discover on arXiv` you can search any fresh topic: real candidates come back (scroll-window into the arXiv API with lexical coverage checks), poor first passes are **refined automatically**, duplicates against the corpus are skipped, and every candidate keeps its arXiv id / abstract URL / PDF URL for provenance.
2. **Human approval** (`POST /api/sessions/{id}/approval`) — you approve/reject which papers the agent may cite. Approving a fresh-topic candidate **materialises it first** (full-text PDF, or an explicitly-labelled abstract-only record when the PDF cannot be fetched), and rejections are recorded even for never-materialised candidates — the agent never sees them as undecided. The gate is enforced in the *tools* too: `search_papers` refuses to look at an unapproved paper.
3. **Agent run** (`POST /api/sessions/{id}/run`) — the agent searches, reads and reasons with bounded budgets (`max_agent_iterations`, `max_tool_calls`, `max_query_refinements`), and every step lands in the **activity log** (plan / search / coverage-check / read / decide / verify).
4. **Verification (reflection)** — each claim must carry a resolvable `[S#]` marker pointing at a real chunk; the quote is checked against the passage, numeric claims are checked for containment, and anything that fails is **dropped** — a run can never promote a mechanically-failed claim. If the collection does not cover the question, the agent says **insufficient evidence** (or asks you) instead of inventing papers, DOIs or quotes. Automated citation checks are surfaced as warnings for human review, not proof.
5. **Review** — the review is assembled from surviving claims only: direct answer, key findings, comparison table, themes, limitations, gaps, and a source list where every row resolves to `marker + page + quote`, links out to the real arXiv source, and is badged when it was drawn from an abstract only. Sessions persist to SQLite and resume — including `awaiting_user` pauses where the agent asked you something.
6. **Feedback → revised draft** (`POST /api/sessions/{id}/feedback`) — after a completed review you can say “exclude this paper”, “focus on newer studies”, or “compare the datasets”. The earlier draft and your feedback are saved in the session’s **revision history** (SQLite, survives restarts), your feedback is folded into the research question, the excluded papers are dropped from the *revised* retrieval scope only (approvals stay intact), and the agent re-searches and produces a revised draft. Drafts are browsable in the UI; session state, revisions and approvals all survive a backend restart.

Three run modes exist so retrieval quality is measurable: `no_rag` (baseline, no retrieval), `basic_rag` (single-shot retrieval), `agentic_rag` (the loop above). The offline provider is deterministic, so identical runs must produce identical output.

## Run it

```bat
start.bat
```

or, manually:

```bat
:: backend (http://localhost:8000) — needs the corpus once
cd backend
venv\Scripts\python.exe -m pip install -r requirements.txt
venv\Scripts\python.exe scripts\fetch_corpus.py          :: downloads + ingests the 7 pinned papers
venv\Scripts\python.exe -m uvicorn main:app --port 8000

:: frontend (http://localhost:5173)
cd ..\frontend
npm install
npm run dev
```

Open <http://localhost:5173/report> and drive the workflow: new review → pick mode → approve sources → run → read the verified review and its cited passages.

## Tests

```bat
cd backend
$env:PYTHONIOENCODING="utf-8"
venv\Scripts\python.exe -m pytest tests\ -q
```

106 tests on the real 7-paper corpus: retrieval, reflection (incl. the fabrication tripwires), the agent (approval gate, tool budget, exhausted-marker honesty, marker namespace consistency), ingestion, the workflow (session resume from DB, no-invented-metadata), and a full HTTP end-to-end (create → approve → run → markdown, legacy routes, BibTeX purity).

The suite is now **144 tests** and adds the new capabilities: fresh-topic arXiv discovery (candidate shape, refine-when-poor, dedupe against the corpus, PDF vs abstract-only ingest, approving-a-candidate materialises before decision, rejecting an unmaterialised candidate is still recorded), vector RAG (SQLite vector table + deterministic fake embedder; retrieval restricted to approved papers; vectors survive revisions and are deleted only on paper deletion), provider honesty (a keyed provider without a key raises, never falls back silently), and the feedback loop (a revision that excludes a paper provably changes retrieval and the resulting draft; per-round exclusions never leak into later rounds).

## Evaluation

```bat
cd backend
$env:PYTHONIOENCODING="utf-8"
venv\Scripts\python.exe -m eval.run_eval
```

See `backend/eval/README.md`. The matrix runs 7 questions (gold facts quoted from the pipeline's own extracted abstracts) × 3 modes × provider slots. `offline` always runs; `gemini`/`openai` cells are marked **PENDING** until credentials exist, and OpenRouter is auto-added as a **PENDING** pair (`openrouter`/`openrouter-strong`) whenever `OPENROUTER_API_KEY` is absent — the harness never invents a score for a provider that was not called, and offline output is never labelled OpenRouter (see `backend/.env.example`). Metrics: factual-accuracy (verbatim gold-fact containment), retrieval relevance (precision/recall/F1 of cited papers), citation support (mechanical), consistency, latency, estimated cost, and out-of-scope refusal behaviour.

## Repository layout

```
backend/
  config.py, db.py, main.py        # FastAPI app, SQLite store, provider config
  routers/corpus.py, sessions.py   # corpus + review workflow HTTP API
  routers/{agents,evidence,papers,pdf}.py   # legacy routes, off mock data
  services/
    ingest.py, retrieval.py        # real PDF extraction; BM25+RRF+section boosts
    discovery.py                   # any-topic arXiv search, refine, dedupe, ingest
    vectorstore.py, embeddings.py  # optional vector RAG (sqlite local | Astra DB)
    agent/{executor,tools,offline_policy,reflection,callbacks}.py
    llm/{offline,gemini,openai_compat,openrouter,base,registry}.py
    review_service.py, workflow.py # structured review; session state machine
    arxiv.py, pdf_rag_service.py, ...
  scripts/fetch_corpus.py          # pinned corpus + SHA-256 manifest
  eval/                            # dataset, metrics, evaluator (PENDING-aware)
  tests/                           # 144 tests
frontend/
  src/pages/LiteratureReview.tsx   # the real review workflow UI
  src/components/AgentActivityLog.tsx, SourceApprovalPanel.tsx
  src/services/api.ts              # typed client for the workflow API
  src/pages/ResearchWorkspace.tsx, src/services/researchService.ts  # honest exports
docs/PROJECT_REPORT.md             # what was implemented, guideline-by-guideline
docs/FAILURE_CASES.md              # real failures found + what reflection changed
```

## Honest limitations

- The `offline` provider composes answers by *extracting verbatim sentences* from retrieved passages. That keeps every answer source-backed with zero credentials, but it reads terser than an LLM synthesis would.
- Gold-fact recall in the eval measures *verbatim* containment of a gold sentence in the delivered answer; a paraphrase that is equally true scores a miss. It is an intentionally strict lower bound.
- Configured providers without keys (`gemini`/`openai`/`openrouter`/`openrouter-strong`) are PENDING in the eval and refused (with a clear error) when requested for a live run — the harness structure for them exists and is demonstrated, but no score is claimed.
- Live *real* arXiv discovery can be rate-limited/blocked from some networks (the export API is frequently unreachable); `RLENS_FAKE_ARXIV=1` runs the identical flow against real paper fixtures and is clearly labelled “fake” in the UI, and the final report calls out exactly what was/wasn't exercised live.
- Vector RAG (Astra DB) and hosted embeddings need real credentials; without them the system runs the documented SQLite/fake-embedder path or BM25-only, and no fake vector is ever sent to Astra.