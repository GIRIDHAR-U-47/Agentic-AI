# Node Description Batch 11 of 27

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

- "backend_config_get_provider": "get_provider()" | kind=code-symbol | source=backend/config.py:L130 | neighbors=[config.py, default_provider()]
- "backend_config_specs": "_specs()" | kind=code-symbol | source=backend/config.py:L101 | neighbors=[config.py, ProviderSpec]
- "backend_db_approved_doc_ids": "approved_doc_ids()" | kind=code-symbol | source=backend/db.py:L551 | neighbors=[db.py, get_approvals()]
- "backend_db_migrate": "_migrate()" | kind=code-symbol | source=backend/db.py:L202 | neighbors=[db.py, init_db()]
- "backend_db_rejected_doc_ids": "rejected_doc_ids()" | kind=code-symbol | source=backend/db.py:L555 | neighbors=[db.py, get_approvals()]
- "backend_main": "main.py" | kind=code-symbol | source=backend/main.py:L1 | neighbors=[root(), d6c5367 commit]
- "branch:repo:github.com/GIRIDHAR-U-47/Agentic-AI#main": "main" | kind=Branch | source=git | neighbors=[170f30e Initial commit, d6c5367 commit]
- "commit:repo:github.com/GIRIDHAR-U-47/Agentic-AI@170f30e3fcdbf2462cfbebc72ee8c995e31f0629": "170f30e Initial commit" | kind=Commit | source=git | neighbors=[main, d6c5367 commit]
- "components_agentactivitylog_agentactivitylog": "AgentActivityLog()" | kind=code-symbol | source=frontend/src/components/AgentActivityLog.tsx:L28 | neighbors=[AgentActivityLog.tsx, LiteratureReview.tsx]
- "components_sourceapprovalpanel_sourceapprovalpanel": "SourceApprovalPanel()" | kind=code-symbol | source=frontend/src/components/SourceApprovalPanel.tsx:L21 | neighbors=[SourceApprovalPanel.tsx, LiteratureReview.tsx]
- "context_researchcontext_researchprovider": "ResearchProvider()" | kind=code-symbol | source=frontend/src/context/ResearchContext.tsx:L81 | neighbors=[ResearchContext.tsx, App.tsx]
- "data_mock_data": "mock_data.py" | kind=code-symbol | source=backend/data/mock_data.py:L1 | neighbors=[d6c5367 commit, schemas.py]
- "eval_metrics_action_taken_when_out_of_scope": "action_taken_when_out_of_scope()" | kind=code-symbol | source=backend/eval/metrics.py:L172 | neighbors=[metrics.py, The out-of-scope question was handled c…]
- "eval_metrics_content": "_content()" | kind=code-symbol | source=backend/eval/metrics.py:L96 | neighbors=[metrics.py, consistency()]
- "eval_metrics_retrieval_relevance": "retrieval_relevance()" | kind=code-symbol | source=backend/eval/metrics.py:L77 | neighbors=[metrics.py, summarize()]
- "eval_run_eval_provider_state": "_provider_state()" | kind=code-symbol | source=backend/eval/run_eval.py:L45 | neighbors=[run_eval.py, run_matrix()]
- "eval_run_eval_table": "_table()" | kind=code-symbol | source=backend/eval/run_eval.py:L169 | neighbors=[run_eval.py, main()]
- "layout_applayout_applayout": "AppLayout()" | kind=code-symbol | source=frontend/src/components/layout/AppLayout.tsx:L7 | neighbors=[AppLayout.tsx, App.tsx]
- "layout_sidebar_sidebar": "Sidebar()" | kind=code-symbol | source=frontend/src/components/layout/Sidebar.tsx:L22 | neighbors=[AppLayout.tsx, Sidebar.tsx]
- "layout_topbar_topbar": "Topbar()" | kind=code-symbol | source=frontend/src/components/layout/Topbar.tsx:L7 | neighbors=[AppLayout.tsx, Topbar.tsx]
- "llm_gemini_geminillm_ensure": "._ensure()" | kind=code-symbol | source=backend/services/llm/gemini.py:L33 | neighbors=[GeminiLLM, .generate()]
- "llm_gemini_geminillm_generate": ".generate()" | kind=code-symbol | source=backend/services/llm/gemini.py:L54 | neighbors=[GeminiLLM, ._ensure()]
- "llm_offline_extractivellm_question": "._question()" | kind=code-symbol | source=backend/services/llm/offline.py:L242 | neighbors=[ExtractiveLLM, .generate()]
- "llm_offline_split_sentences": "split_sentences()" | kind=code-symbol | source=backend/services/llm/offline.py:L48 | neighbors=[offline.py, candidate_sentences()]
- "llm_openai_compat_openaicompatllm_ensure": "._ensure()" | kind=code-symbol | source=backend/services/llm/openai_compat.py:L35 | neighbors=[OpenAICompatLLM, .generate()]
- "llm_openai_compat_openaicompatllm_generate": ".generate()" | kind=code-symbol | source=backend/services/llm/openai_compat.py:L58 | neighbors=[OpenAICompatLLM, ._ensure()]
- "llm_registry_adapter_class": "_adapter_class()" | kind=code-symbol | source=backend/services/llm/registry.py:L48 | neighbors=[registry.py, as_chat_model()]
- "llm_registry_build_llm": "build_llm()" | kind=code-symbol | source=backend/services/llm/registry.py:L19 | neighbors=[registry.py, Instantiate a provider. Never raises fo…]
- "models_schemas_agentinstructionrequest": "AgentInstructionRequest" | kind=code-symbol | source=backend/models/schemas.py:L123 | neighbors=[schemas.py, BaseModel]
- "models_schemas_autopilotrequest": "AutoPilotRequest" | kind=code-symbol | source=backend/models/schemas.py:L126 | neighbors=[schemas.py, BaseModel]
- "models_schemas_evidenceanchor": "EvidenceAnchor" | kind=code-symbol | source=backend/models/schemas.py:L23 | neighbors=[schemas.py, BaseModel]
- "models_schemas_papermetric": "PaperMetric" | kind=code-symbol | source=backend/models/schemas.py:L11 | neighbors=[schemas.py, BaseModel]
- "models_schemas_papermetrics": "PaperMetrics" | kind=code-symbol | source=backend/models/schemas.py:L32 | neighbors=[schemas.py, BaseModel]
- "models_schemas_papersection": "PaperSection" | kind=code-symbol | source=backend/models/schemas.py:L17 | neighbors=[schemas.py, BaseModel]
- "models_schemas_reportcitation": "ReportCitation" | kind=code-symbol | source=backend/models/schemas.py:L129 | neighbors=[schemas.py, BaseModel]
- "models_schemas_updateevidencestatusrequest": "UpdateEvidenceStatusRequest" | kind=code-symbol | source=backend/models/schemas.py:L120 | neighbors=[schemas.py, BaseModel]
- "models_schemas_updatevalidationrequest": "UpdateValidationRequest" | kind=code-symbol | source=backend/models/schemas.py:L117 | neighbors=[schemas.py, BaseModel]
- "pages_agentgallery_agentgallery": "AgentGallery()" | kind=code-symbol | source=frontend/src/pages/AgentGallery.tsx:L81 | neighbors=[AgentGallery.tsx, App.tsx]
- "pages_aidetector_getscorelabel": "getScoreLabel()" | kind=code-symbol | source=frontend/src/pages/AIDetector.tsx:L25 | neighbors=[AIDetector.tsx, AIDetector()]
- "pages_aiwriter_aiwriter": "AIWriter()" | kind=code-symbol | source=frontend/src/pages/AIWriter.tsx:L23 | neighbors=[AIWriter.tsx, App.tsx]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-010.json

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
