# R-Lens evaluation harness

Mechanical, reproducible comparison of the three retrieval modes (`no_rag`,
`basic_rag`, `agentic_rag`) across providers.

## Run

```bat
cd backend
$env:PYTHONIOENCODING="utf-8"
venv\Scripts\python.exe -m eval.run_eval
```

Outputs `eval/results/latest.json` (full rows) and `eval/results/latest.md`
(human-readable table). Requires the corpus to be ingested
(`venv\Scripts\python.exe scripts\fetch_corpus.py`).

## Dataset (`dataset.json`)

7 questions over the 7-paper corpus. Every gold fact carries:

- `source_quote` — a substring of the **abstract the ingest pipeline extracted**
  from the pinned arXiv PDF (not written from memory of the papers);
- `keywords` — for facts whose LaTeX does not survive extraction;
- `gold_papers` — the papers a correct answer must cite.

A pre-check confirmed every `source_quote` appears in at least one single chunk,
so a correct extractive answer *can* hit it. `out_of_scope_qcd` deliberately has
no gold facts and expects a refusal (`*_rag` must cite nothing).

## Metrics (`metrics.py`) — deliberately mechanical

- `factual_accuracy` — gold-fact containment in the delivered answer after
  NFKC ligature folding and full punctuation/hyphen stripping. A paraphrase that
  is equally true scores a miss; this is an intentional strict lower bound.
- `retrieval_relevance` — precision/recall/F1 of *cited* papers vs gold papers.
- `citation support` — the reflection module's own `support_rate` (marker
  resolution + quote fidelity + numeric containment).
- `consistency` — 1.0 when two runs of one (question, provider) are identical;
  the offline provider is deterministic so divergence is treated as a bug.
- `latency_s`, estimated `cost_usd` (offline is free), token usage.
- Out-of-scope handling — refusal with zero citations.

## Provider matrix

- `offline` (deterministic extractive) — always runs.
- `gemini` / `openai` — run only when the API key is present; otherwise each cell
  is recorded as **PENDING with the reason** ("no GEMINI_API_KEY set …"). The
  harness never invents a score for a provider that was not called. See
  `backend/.env.example`.

## Current results summary (offline provider)

- In-scope: support_rate 0.75–1.00; verified 8/10 basic_rag cells (support 1.00
  on 10 of 12 in-scope RAG cells); consistency 1.0 on all agentic cells.
- Out-of-scope (QCD): 0 citations in every mode (all `handled=True`).
- `gemini`/`openai` cells and cross-LLM consistency: **PENDING** (no keys).