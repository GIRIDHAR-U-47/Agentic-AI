# Node Description Batch 8 of 27

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

- "data_mockresearchdata_mock_evidence_rows": "MOCK_EVIDENCE_ROWS" | kind=code-symbol | source=frontend/src/data/mockResearchData.ts:L461 | neighbors=[mockResearchData.ts, EvidenceValidation.tsx, researchService.ts]
- "eval_metrics_consistency": "consistency()" | kind=code-symbol | source=backend/eval/metrics.py:L100 | neighbors=[metrics.py, _content(), summarize()]
- "eval_metrics_estimate_cost_usd": "estimate_cost_usd()" | kind=code-symbol | source=backend/eval/metrics.py:L118 | neighbors=[metrics.py, Return (usd, known). Offline and anythi…, summarize()]
- "eval_metrics_factual_accuracy": "factual_accuracy()" | kind=code-symbol | source=backend/eval/metrics.py:L63 | neighbors=[metrics.py, fact_hit(), summarize()]
- "eval_metrics_norm": "_norm()" | kind=code-symbol | source=backend/eval/metrics.py:L34 | neighbors=[metrics.py, fact_hit(), Normalise for containment: fold ligatur…]
- "eval_run_eval_main": "main()" | kind=code-symbol | source=backend/eval/run_eval.py:L205 | neighbors=[run_eval.py, run_matrix(), _table()]
- "eval_run_eval_run_cell": "_run_cell()" | kind=code-symbol | source=backend/eval/run_eval.py:L62 | neighbors=[run_eval.py, Run one cell safely. Never lets a provi…, run_matrix()]
- "llm_base_timer": "_Timer" | kind=code-symbol | source=backend/services/llm/base.py:L71 | neighbors=[base.py, .__enter__(), .__exit__()]
- "llm_gemini": "gemini.py" | kind=code-symbol | source=backend/services/llm/gemini.py:L1 | neighbors=[available(), GeminiLLM, Google Gemini provider.  Uses the LangC…]
- "llm_offline_content_tokens": "_content_tokens()" | kind=code-symbol | source=backend/services/llm/offline.py:L194 | neighbors=[offline.py, ._compose(), _mmr()]
- "llm_offline_is_heading": "is_heading()" | kind=code-symbol | source=backend/services/llm/offline.py:L79 | neighbors=[offline.py, candidate_sentences(), True when a `sentence` is really a sect…]
- "llm_offline_is_self_contained": "is_self_contained()" | kind=code-symbol | source=backend/services/llm/offline.py:L135 | neighbors=[offline.py, candidate_sentences(), True when a sentence reads unambiguousl…]
- "llm_offline_parse_evidence": "parse_evidence()" | kind=code-symbol | source=backend/services/llm/offline.py:L164 | neighbors=[offline.py, .generate(), Pull `[EVIDENCE n] Source: ... | Page N…]
- "llm_offline_rationale_1": "Deterministic extractive provider -- works with zero API credentials.  This is N" | kind=entity | source=backend/services/llm/offline.py:L1 | neighbors=[BaseLLM, LLMResult, offline.py]
- "llm_offline_rationale_136": "True when a sentence reads unambiguously with no surrounding context.      Rejec" | kind=entity | source=backend/services/llm/offline.py:L136 | neighbors=[BaseLLM, LLMResult, is_self_contained()]
- "llm_offline_rationale_158": "Sentences that could plausibly be cited as a claim." | kind=entity | source=backend/services/llm/offline.py:L158 | neighbors=[BaseLLM, LLMResult, candidate_sentences()]
- "llm_offline_rationale_165": "Pull `[EVIDENCE n] Source: ... | Page N | ...` blocks out of a prompt." | kind=entity | source=backend/services/llm/offline.py:L165 | neighbors=[BaseLLM, LLMResult, parse_evidence()]
- "llm_offline_rationale_204": "Maximal Marginal Relevance selection to avoid repeating one idea." | kind=entity | source=backend/services/llm/offline.py:L204 | neighbors=[BaseLLM, LLMResult, _mmr()]
- "llm_offline_rationale_233": "Composes an answer from verbatim source sentences only." | kind=entity | source=backend/services/llm/offline.py:L233 | neighbors=[BaseLLM, LLMResult, ExtractiveLLM]
- "llm_offline_rationale_80": "True when a `sentence` is really a section/subsection heading.      The rule tha" | kind=entity | source=backend/services/llm/offline.py:L80 | neighbors=[BaseLLM, LLMResult, is_heading()]
- "llm_openai_compat": "openai_compat.py" | kind=code-symbol | source=backend/services/llm/openai_compat.py:L1 | neighbors=[available(), OpenAICompatLLM, OpenAI provider, also covering any Open…]
- "llm_openrouter": "openrouter.py" | kind=code-symbol | source=backend/services/llm/openrouter.py:L1 | neighbors=[available(), OpenRouterLLM, OpenRouter provider: one key, many mode…]
- "llm_openrouter_rationale_1": "OpenRouter provider: one key, many model families.  OpenRouter exposes OpenAI-co" | kind=entity | source=backend/services/llm/openrouter.py:L1 | neighbors=[LLMError, OpenAICompatLLM, openrouter.py]
- "llm_openrouter_rationale_39": "ChatOpenAI pointed at OpenRouter, tagged with the app identity." | kind=entity | source=backend/services/llm/openrouter.py:L39 | neighbors=[LLMError, OpenAICompatLLM, OpenRouterLLM]
- "pages_aidetector_aidetector": "AIDetector()" | kind=code-symbol | source=frontend/src/pages/AIDetector.tsx:L41 | neighbors=[AIDetector.tsx, getScoreLabel(), App.tsx]
- "routers_corpus_suggest": "suggest()" | kind=code-symbol | source=backend/routers/corpus.py:L70 | neighbors=[corpus.py, Rank the corpus for a question. Used to…, Rank the corpus for a question. Used to…]
- "routers_corpus_upload": "upload()" | kind=code-symbol | source=backend/routers/corpus.py:L124 | neighbors=[corpus.py, Ingest an uploaded PDF. Fails loudly on…, Ingest an uploaded PDF. Fails loudly on…]
- "routers_pdf_rationale_16": "Returns list of currently indexed PDF documents in this session" | kind=entity | source=backend/routers/pdf.py:L16 | neighbors=[get_all_documents(), AgenticRAGResponse, PDFDocument]
- "routers_pdf_rationale_30": "Upload a PDF. Extracts real text via PyMuPDF, chunks it, and indexes it.\r     Re" | kind=entity | source=backend/routers/pdf.py:L30 | neighbors=[upload_pdf(), AgenticRAGResponse, PDFDocument]
- "routers_pdf_rationale_51": "Multi-step Agentic RAG over the uploaded PDF session.\r     Retrieval is strictly" | kind=entity | source=backend/routers/pdf.py:L51 | neighbors=[query_pdf_rag(), AgenticRAGResponse, PDFDocument]
- "routers_pdf_rationale_62": "Removes a document from the active session" | kind=entity | source=backend/routers/pdf.py:L62 | neighbors=[delete_document(), AgenticRAGResponse, PDFDocument]
- "routers_sessions_approvalin": "ApprovalIn" | kind=code-symbol | source=backend/routers/sessions.py:L43 | neighbors=[sessions.py, BaseModel, LLMError]
- "routers_sessions_decision": "Decision" | kind=code-symbol | source=backend/routers/sessions.py:L37 | neighbors=[sessions.py, BaseModel, LLMError]
- "routers_sessions_feedbackin": "FeedbackIn" | kind=code-symbol | source=backend/routers/sessions.py:L57 | neighbors=[sessions.py, BaseModel, LLMError]
- "routers_sessions_replyin": "ReplyIn" | kind=code-symbol | source=backend/routers/sessions.py:L53 | neighbors=[sessions.py, BaseModel, LLMError]
- "routers_sessions_runin": "RunIn" | kind=code-symbol | source=backend/routers/sessions.py:L47 | neighbors=[sessions.py, BaseModel, LLMError]
- "routers_sessions_startsessionin": "StartSessionIn" | kind=code-symbol | source=backend/routers/sessions.py:L27 | neighbors=[sessions.py, BaseModel, LLMError]
- "services_agent_service_agentservice_add_instruction": ".add_instruction()" | kind=code-symbol | source=backend/services/agent_service.py:L88 | neighbors=[AgentService, .get_steps(), Record a researcher instruction on a se…]
- "services_agent_service_agentservice_get_steps": ".get_steps()" | kind=code-symbol | source=backend/services/agent_service.py:L45 | neighbors=[AgentService, .add_instruction(), _duration()]
- "services_agent_service_rationale_1": "Agent provenance, repointed from mock steps to the real activity log.  The origi" | kind=entity | source=backend/services/agent_service.py:L1 | neighbors=[ActivityEvent, AgentProvenanceStep, agent_service.py]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-007.json

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
