# Node Description Batch 16 of 27

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

- "agent_reflection_rationale_411": "One citation record per *passage* a surviving claim actually leaned on.      Key" | kind=entity | source=backend/services/agent/reflection.py:L411 | neighbors=[_build_citations()] | lang=en
- "agent_reflection_reflectionresult_to_dict": ".to_dict()" | kind=code-symbol | source=backend/services/agent/reflection.py:L104 | neighbors=[ReflectionResult] | lang=en
- "agent_tools_fmt_passage": "_fmt_passage()" | kind=code-symbol | source=backend/services/agent/tools.py:L57 | neighbors=[tools.py] | lang=en
- "agent_tools_re_insufficient": "re_insufficient()" | kind=code-symbol | source=backend/services/agent/tools.py:L289 | neighbors=[tools.py] | lang=en
- "agent_tools_toolcontext_top_chunks": ".top_chunks()" | kind=code-symbol | source=backend/services/agent/tools.py:L50 | neighbors=[ToolContext] | lang=en
- "agent_tools_toolcontext_unique_docs": ".unique_docs()" | kind=code-symbol | source=backend/services/agent/tools.py:L53 | neighbors=[ToolContext] | lang=en
- "backend_config_ensure_dirs": "ensure_dirs()" | kind=code-symbol | source=backend/config.py:L176 | neighbors=[config.py] | lang=en
- "backend_config_limits": "Limits" | kind=code-symbol | source=backend/config.py:L184 | neighbors=[config.py] | lang=en
- "backend_config_rationale_1": "Central configuration for R-Lens, sourced from environment / .env.  No new depen" | kind=entity | source=backend/config.py:L1 | neighbors=[config.py] | lang=en
- "backend_config_rationale_100": "Pick the best provider that actually has credentials.      Preference order hono" | kind=entity | source=backend/config.py:L100 | neighbors=[default_provider()] | lang=en
- "backend_config_rationale_118": "Machine-readable provider status, surfaced at /api/health." | kind=entity | source=backend/config.py:L118 | neighbors=[llm_status()] | lang=en
- "backend_config_rationale_142": "Pick the best provider that actually has credentials.      Preference order hono" | kind=entity | source=backend/config.py:L142 | neighbors=[default_provider()] | lang=en
- "backend_config_rationale_160": "Machine-readable provider status, surfaced at /api/health." | kind=entity | source=backend/config.py:L160 | neighbors=[llm_status()] | lang=en
- "backend_config_rationale_46": "A concrete LLM the system can talk to." | kind=entity | source=backend/config.py:L46 | neighbors=[ProviderSpec] | lang=en
- "backend_config_rationale_72": "A concrete LLM the system can talk to." | kind=entity | source=backend/config.py:L72 | neighbors=[ProviderSpec] | lang=en
- "backend_config_rationale_83": "A concrete LLM the system can talk to." | kind=entity | source=backend/config.py:L83 | neighbors=[ProviderSpec] | lang=en
- "backend_db_rationale_1": "SQLite persistence for R-Lens (stdlib `sqlite3` only, no ORM).  Why this exists" | kind=entity | source=backend/db.py:L1 | neighbors=[db.py] | lang=en
- "backend_db_rationale_190": "Drop and rebuild every table. Used by the test-suite and `eval --reset`." | kind=entity | source=backend/db.py:L190 | neighbors=[reset_db()] | lang=en
- "backend_db_rationale_210": "Drop and rebuild every table. Used by the test-suite and `eval --reset`." | kind=entity | source=backend/db.py:L210 | neighbors=[reset_db()] | lang=en
- "backend_db_rationale_222": "Drop and rebuild every table. Used by the test-suite and `eval --reset`." | kind=entity | source=backend/db.py:L222 | neighbors=[reset_db()] | lang=en
- "backend_db_rationale_401": "The declared JSON columns, checked against the live table definition.      Valid" | kind=entity | source=backend/db.py:L401 | neighbors=[_sessions_json_columns()] | lang=en
- "backend_db_rationale_429": "The declared JSON columns, checked against the live table definition.      Valid" | kind=entity | source=backend/db.py:L429 | neighbors=[_sessions_json_columns()] | lang=en
- "backend_db_rationale_441": "The declared JSON columns, checked against the live table definition.      Valid" | kind=entity | source=backend/db.py:L441 | neighbors=[_sessions_json_columns()] | lang=en
- "backend_db_rationale_657": "Store a fresh-topic search result so re-opening a session does not     re-hit ar" | kind=entity | source=backend/db.py:L657 | neighbors=[cache_discovery()] | lang=pt
- "backend_db_rationale_669": "Store a fresh-topic search result so re-opening a session does not     re-hit ar" | kind=entity | source=backend/db.py:L669 | neighbors=[cache_discovery()] | lang=pt
- "backend_main_root": "root()" | kind=code-symbol | source=backend/main.py:L57 | neighbors=[main.py] | lang=en
- "basecallbackhandler": "BaseCallbackHandler" | kind=code-symbol | neighbors=[ActivityRecorder] | lang=en
- "components_agentactivitylog_kind_meta": "KIND_META" | kind=code-symbol | source=frontend/src/components/AgentActivityLog.tsx:L19 | neighbors=[AgentActivityLog.tsx] | lang=en
- "components_sourceapprovalpanel_props": "Props" | kind=code-symbol | source=frontend/src/components/SourceApprovalPanel.tsx:L12 | neighbors=[SourceApprovalPanel.tsx] | lang=en
- "context_researchcontext_default_chat_messages": "DEFAULT_CHAT_MESSAGES" | kind=code-symbol | source=frontend/src/context/ResearchContext.tsx:L65 | neighbors=[ResearchContext.tsx] | lang=en
- "context_researchcontext_defaultfilters": "defaultFilters" | kind=code-symbol | source=frontend/src/context/ResearchContext.tsx:L55 | neighbors=[ResearchContext.tsx] | lang=en
- "context_researchcontext_intentpayload": "IntentPayload" | kind=code-symbol | source=frontend/src/context/ResearchContext.tsx:L15 | neighbors=[ResearchContext.tsx] | lang=en
- "context_researchcontext_researchchatmessage": "ResearchChatMessage" | kind=code-symbol | source=frontend/src/context/ResearchContext.tsx:L5 | neighbors=[ResearchContext.tsx] | lang=en
- "context_researchcontext_researchcontext": "ResearchContext" | kind=code-symbol | source=frontend/src/context/ResearchContext.tsx:L79 | neighbors=[ResearchContext.tsx] | lang=en
- "context_researchcontext_researchcontexttype": "ResearchContextType" | kind=code-symbol | source=frontend/src/context/ResearchContext.tsx:L24 | neighbors=[ResearchContext.tsx] | lang=en
- "data_mockresearchdata_mock_report_citations": "MOCK_REPORT_CITATIONS" | kind=code-symbol | source=frontend/src/data/mockResearchData.ts:L714 | neighbors=[mockResearchData.ts] | lang=en
- "dict": "dict" | kind=code-symbol | neighbors=[RetrievedChunk] | lang=en
- "eval_metrics_rationale_1": "Scoring functions for the R-Lens evaluation harness.  Deliberately mechanical. E" | kind=entity | source=backend/eval/metrics.py:L1 | neighbors=[metrics.py] | lang=en
- "eval_metrics_rationale_120": "Return (usd, known). Offline and anything unlisted -> (None, False)." | kind=entity | source=backend/eval/metrics.py:L120 | neighbors=[estimate_cost_usd()] | lang=en
- "eval_metrics_rationale_132": "One evaluatable row from one agent run." | kind=entity | source=backend/eval/metrics.py:L132 | neighbors=[summarize()] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-015.json

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
