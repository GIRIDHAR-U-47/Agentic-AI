# Node Description Batch 17 of 27

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

- "eval_metrics_rationale_173": "The out-of-scope question was handled correctly iff the run refused." | kind=entity | source=backend/eval/metrics.py:L173 | neighbors=[action_taken_when_out_of_scope()]
- "eval_metrics_rationale_35": "Normalise for containment: fold ligatures, drop LaTeX, punctuation,     casing a" | kind=entity | source=backend/eval/metrics.py:L35 | neighbors=[_norm()]
- "eval_metrics_rationale_50": "A gold fact is hit if its quote survives normalisation inside the answer,     or" | kind=entity | source=backend/eval/metrics.py:L50 | neighbors=[fact_hit()]
- "eval_run_eval_rationale_1": "Run the R-Lens evaluation matrix.  Usage (from backend/):      $env:PYTHONIOENCO" | kind=entity | source=backend/eval/run_eval.py:L1 | neighbors=[run_eval.py]
- "eval_run_eval_rationale_64": "Run one cell safely. Never lets a provider crash the whole matrix.      `doc_ids" | kind=entity | source=backend/eval/run_eval.py:L64 | neighbors=[_run_cell()]
- "frontend_postcss_config": "postcss.config.js" | kind=code-symbol | source=frontend/postcss.config.js:L1 | neighbors=[d6c5367 commit]
- "frontend_tailwind_config": "tailwind.config.js" | kind=code-symbol | source=frontend/tailwind.config.js:L1 | neighbors=[d6c5367 commit]
- "frontend_vite_config": "vite.config.ts" | kind=code-symbol | source=frontend/vite.config.ts:L1 | neighbors=[d6c5367 commit]
- "layout_sidebar_primarynavitems": "primaryNavItems" | kind=code-symbol | source=frontend/src/components/layout/Sidebar.tsx:L5 | neighbors=[Sidebar.tsx]
- "layout_sidebar_secondarynavitems": "secondaryNavItems" | kind=code-symbol | source=frontend/src/components/layout/Sidebar.tsx:L15 | neighbors=[Sidebar.tsx]
- "llm_base_basellm_generate": ".generate()" | kind=code-symbol | source=backend/services/llm/base.py:L57 | neighbors=[BaseLLM]
- "llm_base_basellm_health": ".health()" | kind=code-symbol | source=backend/services/llm/base.py:L67 | neighbors=[BaseLLM]
- "llm_base_llmresult_to_dict": ".to_dict()" | kind=code-symbol | source=backend/services/llm/base.py:L36 | neighbors=[LLMResult]
- "llm_base_llmresult_usage_known": ".usage_known()" | kind=code-symbol | source=backend/services/llm/base.py:L33 | neighbors=[LLMResult]
- "llm_base_rationale_1": "Provider-agnostic LLM contract.  Every provider returns the same `LLMResult`, so" | kind=entity | source=backend/services/llm/base.py:L1 | neighbors=[base.py]
- "llm_base_rationale_18": "Raised when a provider call fails in a way the caller must handle." | kind=entity | source=backend/services/llm/base.py:L18 | neighbors=[LLMError]
- "llm_base_rationale_49": "One-shot text generation. Chat/tool-calling layers build on this." | kind=entity | source=backend/services/llm/base.py:L49 | neighbors=[BaseLLM]
- "llm_base_timer_enter": ".__enter__()" | kind=code-symbol | source=backend/services/llm/base.py:L72 | neighbors=[_Timer]
- "llm_base_timer_exit": ".__exit__()" | kind=code-symbol | source=backend/services/llm/base.py:L76 | neighbors=[_Timer]
- "llm_gemini_available": "available()" | kind=code-symbol | source=backend/services/llm/gemini.py:L16 | neighbors=[gemini.py]
- "llm_gemini_geminillm_init": ".__init__()" | kind=code-symbol | source=backend/services/llm/gemini.py:L29 | neighbors=[GeminiLLM]
- "llm_init": "__init__.py" | kind=code-symbol | source=backend/services/llm/__init__.py:L1 | neighbors=[LLM provider layer.  `from services.llm…]
- "llm_offline_extractivellm_init": ".__init__()" | kind=code-symbol | source=backend/services/llm/offline.py:L238 | neighbors=[ExtractiveLLM]
- "llm_openai_compat_available": "available()" | kind=code-symbol | source=backend/services/llm/openai_compat.py:L17 | neighbors=[openai_compat.py]
- "llm_openai_compat_openaicompatllm_init": ".__init__()" | kind=code-symbol | source=backend/services/llm/openai_compat.py:L30 | neighbors=[OpenAICompatLLM]
- "llm_openrouter_available": "available()" | kind=code-symbol | source=backend/services/llm/openrouter.py:L28 | neighbors=[openrouter.py]
- "llm_openrouter_openrouterllm_ensure": "._ensure()" | kind=code-symbol | source=backend/services/llm/openrouter.py:L48 | neighbors=[OpenRouterLLM]
- "llm_openrouter_openrouterllm_init": ".__init__()" | kind=code-symbol | source=backend/services/llm/openrouter.py:L43 | neighbors=[OpenRouterLLM]
- "llm_registry_is_real": "is_real()" | kind=code-symbol | source=backend/services/llm/registry.py:L41 | neighbors=[registry.py]
- "openaicompatllm": "OpenAICompatLLM" | kind=code-symbol | neighbors=[OpenRouterLLM]
- "pages_agentgallery_agents": "AGENTS" | kind=code-symbol | source=frontend/src/pages/AgentGallery.tsx:L4 | neighbors=[AgentGallery.tsx]
- "pages_agentgallery_filters": "FILTERS" | kind=code-symbol | source=frontend/src/pages/AgentGallery.tsx:L79 | neighbors=[AgentGallery.tsx]
- "pages_aidetector_analysisresult": "AnalysisResult" | kind=code-symbol | source=frontend/src/pages/AIDetector.tsx:L3 | neighbors=[AIDetector.tsx]
- "pages_aidetector_gethighlightcolor": "getHighlightColor()" | kind=code-symbol | source=frontend/src/pages/AIDetector.tsx:L32 | neighbors=[AIDetector.tsx]
- "pages_aidetector_mock_result": "MOCK_RESULT" | kind=code-symbol | source=frontend/src/pages/AIDetector.tsx:L9 | neighbors=[AIDetector.tsx]
- "pages_aiwriter_suggestions": "SUGGESTIONS" | kind=code-symbol | source=frontend/src/pages/AIWriter.tsx:L14 | neighbors=[AIWriter.tsx]
- "pages_aiwriter_templates": "TEMPLATES" | kind=code-symbol | source=frontend/src/pages/AIWriter.tsx:L6 | neighbors=[AIWriter.tsx]
- "pages_aiwriter_writingmode": "WritingMode" | kind=code-symbol | source=frontend/src/pages/AIWriter.tsx:L4 | neighbors=[AIWriter.tsx]
- "pages_chatwithpdf_chatmessage": "ChatMessage" | kind=code-symbol | source=frontend/src/pages/ChatWithPDF.tsx:L7 | neighbors=[ChatWithPDF.tsx]
- "pages_chatwithpdf_suggested_questions": "SUGGESTED_QUESTIONS" | kind=code-symbol | source=frontend/src/pages/ChatWithPDF.tsx:L16 | neighbors=[ChatWithPDF.tsx]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-016.json

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
