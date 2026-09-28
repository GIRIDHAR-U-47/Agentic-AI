# Failure cases found while building the Research Pilot

Every entry below is a **real failure observed during this work** — none from a
hypothetical — each with how it was found, what reflection/verification changed,
and the test or eval result that proved the fix. These are the "failure examples"
of the brief: the system is built against these, not around them.

## 1. Citation resolution by marker alone (numeric tripwire false-fired on verbatim quotes)

- **Symptom**: a run's support rate was 0.29 — claims mechanically rejected even
  though they quoted the source verbatim. A claim like "…reduces quadratic
  complexity… [S1 p.9]" was checked against the *wrong chunk*: all markers
  `S1` pointed at one chunk no matter which page was cited, so quotes "failed"
  and the numeric containment check tripped on numbers that were perfectly
  present elsewhere.
- **How found**: `tests/test_reflection.py` (per-marker resolution) plus a debug
  script replaying one basic_rag answer end-to-end (0.29 → 1.00 after the fix).
- **Fix**: citations resolve on **(marker, page)** — markers are per-document, so
  resolution keys on the locator; citation records now carry `locator` ("S1 p.9").
- **Verified by**: `test_reflection.py`, whole suite green; eval support_rate 1.0
  for most cells.

## 2. Query refinement shifted the topic (out-of-scope question got answered anyway)

- **Symptom**: in the first eval matrix, `agentic_rag` answered the QCD
  ("asymptotic freedom scale in quantum chromodynamics") question with **1
  citation, support 1.0** — retrievable, verbatim text, but the wrong subject.
  The offline policy's `_refine` broadened each attempt by appending a rotating
  list of canned vocabulary ("self-attention", "benchmark", …); attempt #2's
  expansion injected *self-attention* into a physics question, retrieval happily
  ranked Transformer passages, and the extractive composer quoted them.
- **How found**: `python -m eval.run_eval` — the out-of-scope row was the
  tell (citations > 0, support 1.0).
- **Fix**: `_refine` no longer invents vocabulary. It relaxes the token-length
  filter so refinements add this question's own short terms — the vocabulary
  stays on-topic because it came from the question.
- **Verified by**: eval matrix — agentic QCD now cites 0 passages and pauses for
  the human; `test_agent.py::test_out_of_scope_question_does_not_fabricate`.

## 3. Single-shot retrieval answered out-of-scope questions too

- **Symptom**: `basic_rag` on the QCD question produced 4 citations (support
  0.83) — the baseline RAG cited loosely-related passages because top-k is
  always non-empty. Nothing told it "this corpus does not discuss this topic".
- **How found**: initial eval matrix (basic_rag QCD row).
- **Fix**: a **lexical coverage gate** (`retrieval.coverage_passes`): at least
  half of the query's content terms (minimum 2) must appear in the retrieved
  passages' text/title/abstract, else the tool records a `limit` event and
  returns "Insufficient evidence …". The same gate guards `basic_rag`. QCD:
  matched 1/5 terms → refused. PatchTST question: matched 3/4 → passes.
- **Verified by**: eval matrix — all three modes cite 0 on QCD (out_of_scope
  rows `handled=True`); `test_retrieval.py` coverage tests.

## 4. `db.update_session` silently refused to persist reviews

- **Symptom**: every review save raised `sqlite3.InterfaceError` — the hand
  written JSON-column allow-list did not include `review`, so the whole session
  file (activity, metrics, review) failed to persist and "resume from DB" could
  never load a review.
- **How found**: `tests/test_workflow.py::test_session_resume_from_db` failed
  with the interface error.
- **Fix**: the JSON column set is derived from `PRAGMA table_info` plus a
  declared `_JSON_SESSION_COLUMNS`, never a hand-written allow-list.
- **Verified by**: `test_workflow.py`, `test_api.py` (create → approve → run →
  GET resumes with review intact).

## 5. Extractive mode emits non-self-contained sentences

- **Symptom**: the offline provider quotes verbatim sentences; some are deictic
  openers ("we propose", "as shown") or abstract-noun subjects ("the problem is
  that …") that are not self-contained claims. Without a filter, the review
  shipped sentences that read as claims but could not stand alone.
- **How found**: spot-checking reviews and `test_reflection.py` claim checks.
- **Fix**: `is_self_contained` rejects deictic openers, abstract-subject nouns
  (method nouns like "the model" are deliberately allowed), and leading discourse
  markers. Documented as a mitigation of an inherent extractive limitation —
  deliberately not "fixed" by over-tuning retrieval.
- **Verified by**: `test_reflection.py`; the limitation is noted in README.

## 6. Light-but-real: misc ordering bugs

- **Running-head stripping was positional** (edge lines only), or it destroyed
  table cells; `is_heading` uses terminal-punctuation asymmetry. Fixed in
  `ingest.py`; `test_ingest.py`.
- **`split_claims` stripped `**` captions before checking caption markers**, so
  the provider's own caption was counted as an "uncited claim"; caption filters
  now run first. `test_reflection.py`.

## 7. Frontend shipped fabricated metadata (removed, not patched)

- **Symptom**: `LiteratureReview.tsx` hardcoded a fake review with invented
  citations — including DOI `10.1109/TSG.2024.3389102` and a nonexistent
  "Microgrid Voltage Stability …" paper — and the workspace chat asserted
  "PatchTST … MSE (0.129 at 96h)" with no source. The mock `generateBibTeX()`
  emitted the same fabricated DOI.
- **How found**: audit of the frontend sources (the same fabrication previously
  removed from `backend/services/research_service.py`).
- **Fix**: `LiteratureReview.tsx` rewritten to run the real workflow (sessions →
  approval → agent → verified review); exports and chat rebuilt from real corpus
  metadata only; workspace analyze button now creates/approves/runs a real
  session and navigates to the report. Every value shown comes from the backend.
- **Verified by**: `npm run build` (tsc clean), and the browser smoke test
  (create → approve → run → review on the real corpus).

## 8. The eval harness bypassed its own approval gate (silently)

- **Symptom**: the first eval run showed **0 citations for every agentic cell** —
  the gate worked *too* well: the harness called the agent without an approved
  set, so every cell (correctly) refused.
- **How found**: `python -m eval.run_eval` (table of zeros).
- **Fix**: the harness approves the whole corpus as its document set; the gate's
  behaviour itself stayed covered by `test_agent.py`.
- **Verified by**: eval matrix with real agentic citations (support 0.75–1.0,
  consistency 1.0); the gate test still passes.

## 9. Fake discovery PDFs collapsed under content-hash dedupe

- **Symptom**: in the fresh-topic demo, approving GCN+GAT+GWN ingested only two
  papers — the fake client built every PDF from the same canned text, so
  `ingest_pdf`'s SHA-256 dedupe treated GAT as a duplicate of GCN (its approval
  recorded, but no document materialised, so the agent could never cite it).
- **How found**: the UI approval toast said "duplicate" for GAT; corpus had no
  `arxiv_1801_07606` after its approval.
- **Fix**: `_FakeArxivClient.download_pdf` now builds **per-paper** page text
  (title + abstract), padded past the ingest text gate with a shared filler so the
  full-text path stays exercised; each paper's PDF sha256 is distinct. Also added
  a guard so short test-fixture abstracts still pass the full-text path.
- **Verified by**: `tests/test_discovery.py` (12 tests incl. distinct ingests);
  the demo session now materialises GAT as full text.

## 10. Rejecting an unmaterialised discovery candidate dropped the decision

- **Symptom**: `set_approvals` raised 400 for a rejected fresh-topic candidate
  that had never been materialised ("Unknown document"), so the researcher's
  rejection was silently dropped and partly-written approvals were saved.
- **How found**: clicking Reject on N-BEATS/TFT in the discovery demo returned 400
  and `rejected=[]`.
- **Fix**: rejected candidate ids are whitelisted (not materialised — but the
  decision is recorded); only *rejected* ids are added so approved candidates still
  pass the ingest gate.
- **Verified by**: new `test_rejecting_an_unmaterialised_discovery_candidate_is_recorded`;
  the demo session records `rejected=[1905.10437, 1912.09363]`.

## 11. (Self-review catch) a fix that would have skipped discovery ingest entirely

- **Symptom**: an early version of the fix above added **all** discovery candidate
  ids to the `valid` document set before the ingest loop — which would have made
  every approved candidate skip materialisation (the exact bug it was meant to
  avoid, inverted).
- **How found**: re-reading the loop before restarting the server; the checkpoint
  review flagged `doc_id not in valid` would never hold for approved candidates.
- **Fix**: only *rejected* ids are whitelisted (verified by the same regression
  test — ingest fires exactly once, for the approved candidate).
- **Verified by**: `tests/test_discovery.py` 12/12 green.

## 12. Full-text discovery ingest dropped source_url

- **Symptom**: GCN/GAT (full-text discovery papers) had empty `source_url` in the
  DB, so citation cards lost their arXiv link while the abstract-only GWN kept it.
- **How found**: corpus API showed `src:` empty for full-text papers, populated
  for abstract-only; `ingest.py` had no `source_url` column writes at all.
- **Fix**: `ingest_pdf` persists `metadata.source_url` on the record; the corpus
  API (`DocumentOut`) now exposes `source_url` + `full_text_available`.
- **Verified by**: re-materialising through the approval path — all three demo
  papers now carry their arXiv URLs; corpus API returns both fields.

## 13. Citation API wire mismatch broke UI source links / badges

- **Symptom**: the session view returned citations with `doc_source_url` /
  `doc_full_text_available`, while the frontend reads `source_url` /
  `full_text_available` — citation source links and abstract-only badges never
  rendered.
- **How found**: contrast between the stored review's `sources` (correct fields
  via `_enrich_citations`) and the API view's citation rows (alias-mismatched).
- **Fix**: `db.get_citations` aliases the join columns to `source_url` /
  `full_text_available` / `arxiv_id`.
- **Verified by**: session view now returns the evidence fields; UI "Cited
  passages" cards link to `https://arxiv.org/abs/...` with page + badge data.

## 14. Environment: localhost ephemeral-port exhaustion (transient)

- **Symptom**: repeated "fetch failed / non-101 status / EADDRINUSE" from curl,
  node and the CDP WebSocket against 127.0.0.1 ports; the backend itself was fine
  (direct curl 200).
- **How found**: `Get-NetTCPConnection -State TimeWait` showed 15,354 TIME_WAIT
  sockets against a 16,384-port dynamic range — the port space was nearly
  exhausted by connection churn (browser polling + many one-shot curl/node calls).
- **Fix**: not a product bug — reduced connection churn (single-round-trip CDP
  evals, browser-pooled fetches) and let TIME_WAIT decay (~2 min).
- **Verified by**: TIME_WAIT back to ~90; all UI/API steps resumed.