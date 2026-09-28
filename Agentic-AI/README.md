# R-Lens — Agentic Literature Review Assistant

> **Production-ready agentic AI for academic research**: real papers → retrieval → human approval → source-backed literature review with verifiable citations, resumable sessions, and honest evaluation.

[![Tests](https://img.shields.io/badge/tests-144%20passing-brightgreen)](#testing)
[![Python](https://img.shields.io/badge/python-3.10+-blue)](#requirements)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal)](#backend)
[![React](https://img.shields.io/badge/React-18+-cyan)](#frontend)
[![Chroma DB](https://img.shields.io/badge/Chroma%20DB-local%20vector%20store-purple)](#vector-store)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-LLM%20%2B%20embeddings-orange)](#llm--embeddings)

---

## What It Does

R-Lens runs an **end-to-end literature review workflow** that is:

| Property | How It's Enforced |
|----------|-------------------|
| **Human-in-the-loop** | No retrieval until you approve papers (`POST /api/sessions/{id}/approval`) |
| **Source-backed claims** | Every claim carries a `[S#]` marker resolvable to a real chunk; failed verification drops the claim |
| **Honest about limits** | Fake embedders, offline LLM, and PENDING eval cells are first-class — never pretend a call happened |
| **Resumable** | Sessions, approvals, revisions, activity logs survive backend restarts (SQLite) |
| **Evidence transparency** | Citations link to arXiv source + page + passage; abstract-only papers explicitly badged |
| **Fair evaluation** | 7 questions × 3 modes × 5 providers = 105 cells; offline always runs; keyed providers = PENDING without keys |

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| Git | any |

### 1. Clone & Configure

```bash
git clone https://github.com/GIRIDHAR-U-47/Agentic-AI.git
cd Agentic-AI

# Backend config
cd backend
copy .env.example .env          # Windows
# cp .env.example .env          # Linux/macOS

# Edit .env and add your OpenRouter key:
# OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
# RLENS_VECTOR_BACKEND=chroma   # enable vector RAG (optional)
```

> **No key?** The system runs fully on the deterministic `offline` provider (extractive, no network, no cost). All eval cells for keyed providers stay **PENDING** — no scores are invented.

### 2. Install Dependencies

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt

# Frontend
cd ..\frontend
npm install
```

### 3. Seed the Corpus (7 pinned papers)

```bash
cd backend
venv\Scripts\python.exe scripts\fetch_corpus.py
```

This downloads 7 real arXiv PDFs (time-series forecasting), extracts text, chunks them, and stores in SQLite.

### 4. Run Everything

```bash
# Option A: One command (Windows)
cd ..\..
start.bat

# Option B: Manual (two terminals)
# Terminal 1 - Backend (port 8000)
cd backend
venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** → **Literature Review** tab → drive the workflow.

---

## The Workflow (What Actually Runs)

```
question → (discover on arXiv?) → rank/ingest → YOU approve sources → agent loop → verification → review → feedback → revised draft
```

| Step | API | What Happens |
|------|-----|--------------|
| 1. Create session | `POST /api/sessions` | Corpus ranked for your question; candidates returned. With `discover=true`, searches arXiv live (refine + dedupe). |
| 2. Approve sources | `POST /api/sessions/{id}/approval` | You approve/reject papers. Approving a discovery candidate **materialises it first** (PDF → chunks, or abstract-only if PDF unavailable). Rejections recorded even for unmaterialised candidates. |
| 3. Run review | `POST /api/sessions/{id}/run` | Agent searches, reads, reasons with budgets (8 iterations, 12 tool calls, 3 refinements). Every step logged. |
| 4. Verification | Built into loop | Each claim needs a `[S#]` marker; quote match + numeric containment checked. Failed claims **dropped**. |
| 5. Review | Auto-assembled | Direct answer, key findings, comparison table, themes, limitations, gaps, sources (`marker + page + quote + arXiv link`). |
| 6. Feedback → revision | `POST /api/sessions/{id}/feedback` | "Exclude paper X", "focus on newer studies". Prior draft saved; feedback folded into question; excluded papers dropped from **revised** scope only; agent re-retrieves + rewrites. Drafts browsable in UI. |

---

## Configuration (.env)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENROUTER_API_KEY` | No | — | Unlocks OpenRouter chat (`openrouter`, `openrouter-strong`) + embeddings |
| `RLENS_VECTOR_BACKEND` | No | `off` | `chroma` enables vector RAG; `off` = BM25 only (basic_rag always BM25) |
| `RLENS_LLM_PROVIDER` | No | auto | Force provider: `offline`, `openrouter`, `openrouter-strong` |
| `RLENS_CHROMA_DIR` | No | `backend/data/chroma/` | Chroma persistence directory |
| `RLENS_FAKE_ARXIV` | No | `0` | `1` = deterministic fixtures (offline demo) |
| `RLENS_DATA_DIR` | No | `backend/data/` | Corpus + DB root |
| `OPENROUTER_EMBEDDING_MODEL` | No | `nvidia/nemotron-3-embed-1b:free` | Embedding model via OpenRouter |
| `OPENROUTER_EMBEDDING_DIM` | No | `4096` | **Verified on first real call** (actual: 2048 for Nemotron 3 Embed 1B) |

> **Key insight**: One `OPENROUTER_API_KEY` unlocks both chat models AND embeddings. No separate embedding key needed.

---

## Vector Store (Chroma DB)

| Aspect | Detail |
|--------|--------|
| **Backend** | `chromadb.PersistentClient` at `RLENS_CHROMA_DIR` |
| **Collections** | `rlens_passages_real` (OpenRouter embeddings) / `rlens_passages_fake` (FakeEmbedder) — **never mix** |
| **Per-chunk metadata** | `doc_id`, `chunk_id`, `page`, `section`, `title`, `authors`, `year`, `venue`, `arxiv_id`, `doi`, `source_url`, `full_text_available` |
| **Upsert** | Delete by `doc_id` → batch add (single embedding call per paper) |
| **Retrieve** | `query_embeddings=[qvec]`, `where={doc_id: {$in: approved_doc_ids}}`, cosine similarity |
| **Deletion** | Only on explicit paper delete (`DELETE /api/collection/{doc_id}`) — never by feedback/revision |

---

## LLM Providers

| Provider | Model (default) | Key | Offline? | Notes |
|----------|-----------------|-----|----------|-------|
| `offline` | `extractive-v1` | — | ✅ | Verbatim sentence extraction; deterministic; always works |
| `openrouter` | `openai/gpt-4o-mini` | `OPENROUTER_API_KEY` | ❌ | Fast, cheap |
| `openrouter-strong` | `anthropic/claude-3.5-sonnet` | `OPENROUTER_API_KEY` | ❌ | Stronger reasoning |

**Honesty rule**: A hosted provider without its key **raises `WorkflowError`** — never silently falls back to offline while keeping the hosted label.

---

## Running Tests

```bash
cd backend
venv\Scripts\python.exe -m pytest tests -q
# 144 tests in ~2 min (106 baseline + 37 new + 1 regression)
```

**Test coverage**: retrieval, reflection, agent (budgets, honesty gates), ingestion, workflow (resume, approval gate), vectorstore (Chroma + fake embedder), feedback (revisions, pause/resume), discovery (arXiv search, refine, dedupe, abstract-only), providers (key presence, eval matrix).

---

## Evaluation Harness

```bash
cd backend
venv\Scripts\python.exe -m eval.run_eval
```

| Matrix | Detail |
|--------|--------|
| **Cells** | 7 questions × 3 modes × 5 providers = 105 |
| **Providers** | `offline` (runs), `gemini`/`openai`/`openrouter`/`openrouter-strong` (PENDING without keys) |
| **Metrics** | Factual accuracy (verbatim gold-fact), Retrieval relevance (P/R/F1), Support rate, Verified, Latency, Consistency, Cost estimate |
| **Output** | `eval/results/latest.json` + markdown table |
| **Honesty** | PENDING cells never invent scores; offline consistency = 1.0 |

---

## Frontend Development

```bash
cd frontend
npm run dev      # http://localhost:5173 (Vite HMR)
npm run build    # TypeScript check + production bundle (dist/)
```

**Key pages**:
- `/report` — Literature Review (main workflow UI)
- `/research` — Research Workspace (session dashboard)
- `/evidence` — Evidence Validation
- `/compare` — Model Comparison

---

## Project Structure

```
Agentic-AI/
├── backend/
│   ├── main.py                    # FastAPI app + router registration
│   ├── config.py                  # Central config, provider registry, limits
│   ├── db.py                      # SQLite schema, migrations, CRUD
│   ├── requirements.txt           # Python deps (incl. chromadb)
│   ├── routers/                   # FastAPI routers (sessions, corpus, discovery, collection, ...)
│   ├── services/
│   │   ├── workflow.py            # State machine (created→approval→run→revision)
│   │   ├── agent/                 # Executor, tools, reflection, offline policy
│   │   ├── embeddings.py          # OpenRouterEmbedder / FakeEmbedder
│   │   ├── vectorstore.py         # ChromaVectorStore (real/fake collections)
│   │   ├── retrieval.py           # BM25 + RRF + coverage gate
│   │   ├── discovery.py           # arXiv search, refine, dedupe, ingest
│   │   ├── ingest.py              # PDF → chunks → metadata
│   │   ├── review_service.py      # Structured review + markdown
│   │   ├── llm/                   # Registry, base, offline, openrouter
│   │   └── ...
│   ├── scripts/fetch_corpus.py    # 7 pinned papers + SHA-256 manifest
│   ├── eval/                      # Evaluation harness (dataset, metrics, runner)
│   └── tests/                     # 144 tests (conftest: temp DB, chroma, offline LLM)
├── frontend/
│   ├── src/
│   │   ├── pages/LiteratureReview.tsx   # Main review UI
│   │   ├── components/                  # SourceApprovalPanel, AgentActivityLog
│   │   ├── services/api.ts              # Typed fetch client
│   │   └── types/index.ts               # SessionView, Review, ReviewCitation, etc.
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── PROJECT_REPORT.md        # Guideline-by-guideline status + live/fake/PENDING table
│   └── FAILURE_CASES.md         # 14 real failures found + fixes + tests
├── .env.example                 # Template for backend/.env
├── start.bat                    # One-click startup (Windows)
└── README.md                    # This file
```

---

## Honest Limitations

| Area | Status | Notes |
|------|--------|-------|
| **Hosted LLM runs** | PENDING | No `OPENROUTER_API_KEY` in CI; matrix structure exists, scores not claimed |
| **Live arXiv discovery** | PENDING | Export API rate-limited from some networks; `RLENS_FAKE_ARXIV=1` runs identical flow with real fixtures |
| **Astra DB vector RAG** | REMOVED | Replaced with local Chroma DB (zero-dep, testable) |
| **Gold-fact recall** | Strict lower bound | Verbatim containment only; paraphrases score 0 even if semantically correct |
| **Extractive mode** | Intentional | Answers are verbatim source sentences — terser than LLM synthesis but fully source-backed |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ModuleNotFoundError: chromadb` | `pip install -r requirements.txt` |
| `OPENROUTER_API_KEY not set` errors | Add key to `backend/.env` or use `offline` provider |
| Rate limit 429 on embeddings | Free tier = 50 req/day; wait for reset or add credits |
| Port 8000/5173 in use | Kill existing `uvicorn`/`vite` processes |
| Tests fail with DB errors | Delete `backend/data/rlens.sqlite3` and `backend/data/chroma/` then re-run |
| Frontend can't reach backend | Ensure backend runs on `http://localhost:8000` (check `API_BASE` in `frontend/src/services/api.ts`) |

---

## Contributing

1. Fork → branch → PR
2. Run tests: `cd backend && venv\Scripts\python.exe -m pytest tests -q`
3. Frontend type-check: `cd frontend && npm run build`
4. Update docs if behavior changes (`README.md`, `docs/PROJECT_REPORT.md`, `docs/FAILURE_CASES.md`)
5. Run `graphify update . --scope all` (optional, for architecture graph)

---

## License

MIT — see `LICENSE` (add one if needed).

---

## Citation

If you use R-Lens in research, please cite:

```bibtex
@software{r-lens-2026,
  title = {R-Lens: Agentic Literature Review Assistant},
  author = {Giridhar U.},
  year = {2026},
  url = {https://github.com/GIRIDHAR-U-47/Agentic-AI}
}
```

---

**Built with honesty**: every number in the pipeline comes from the pipeline. No fabricated scores, no silent fallbacks, no hidden mock data.