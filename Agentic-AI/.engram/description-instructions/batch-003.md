# Node Description Batch 4 of 27

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

- "backend_config_default_provider": "default_provider()" | kind=code-symbol | source=backend/config.py:L141 | neighbors=[config.py, get_provider(), .key_present(), llm_status(), Pick the best provider that actually ha…, Pick the best provider that actually ha…]
- "backend_config_providerspec": "ProviderSpec" | kind=code-symbol | source=backend/config.py:L82 | neighbors=[config.py, .key_present(), A concrete LLM the system can talk to., _specs(), A concrete LLM the system can talk to., A concrete LLM the system can talk to.]
- "backend_db_record_eval_run": "record_eval_run()" | kind=code-symbol | source=backend/db.py:L603 | neighbors=[db.py, _dumps(), init_db(), new_id(), now(), transaction()]
- "backend_db_reset_db": "reset_db()" | kind=code-symbol | source=backend/db.py:L209 | neighbors=[db.py, Drop and rebuild every table. Used by t…, init_db(), transaction(), Drop and rebuild every table. Used by t…, Drop and rebuild every table. Used by t…]
- "backend_db_sessions_json_columns": "_sessions_json_columns()" | kind=code-symbol | source=backend/db.py:L428 | neighbors=[db.py, The declared JSON columns, checked agai…, cursor(), update_session(), The declared JSON columns, checked agai…, The declared JSON columns, checked agai…]
- "backend_db_update_session": "update_session()" | kind=code-symbol | source=backend/db.py:L445 | neighbors=[db.py, _dumps(), init_db(), now(), _sessions_json_columns(), transaction()]
- "eval_metrics_summarize": "summarize()" | kind=code-symbol | source=backend/eval/metrics.py:L131 | neighbors=[metrics.py, One evaluatable row from one agent run., consistency(), estimate_cost_usd(), factual_accuracy(), retrieval_relevance()]
- "eval_run_eval": "run_eval.py" | kind=code-symbol | source=backend/eval/run_eval.py:L1 | neighbors=[main(), _provider_state(), _run_cell(), run_matrix(), _table(), Run the R-Lens evaluation matrix.  Usag…]
- "llm_base": "base.py" | kind=code-symbol | source=backend/services/llm/base.py:L1 | neighbors=[ABC, BaseLLM, LLMError, LLMResult, _Timer, Provider-agnostic LLM contract.  Every …]
- "llm_offline_candidate_sentences": "candidate_sentences()" | kind=code-symbol | source=backend/services/llm/offline.py:L157 | neighbors=[offline.py, is_heading(), is_self_contained(), split_sentences(), ._compose(), Sentences that could plausibly be cited…]
- "models_schemas_agentprovenancestep": "AgentProvenanceStep" | kind=code-symbol | source=backend/models/schemas.py:L107 | neighbors=[schemas.py, BaseModel, AgentService, Agent provenance, repointed from mock s…, Fully autonomous runs are not supported…, Record a researcher instruction on a se…]
- "models_schemas_paper": "Paper" | kind=code-symbol | source=backend/models/schemas.py:L43 | neighbors=[schemas.py, BaseModel, PaperService, Paper service, repointed from mock data…, Validation status is per-session (see a…, Coarse classification from the paper's …]
- "pages_paraphraser": "Paraphraser.tsx" | kind=code-symbol | source=frontend/src/pages/Paraphraser.tsx:L1 | neighbors=[d6c5367 commit, ResearchContext.tsx, useResearch(), MODES, Paraphraser(), App.tsx]
- "routers_papers": "papers.py" | kind=code-symbol | source=backend/routers/papers.py:L1 | neighbors=[d6c5367 commit, schemas.py, get_paper(), list_papers(), update_validation(), paper_service.py]
- "services_agent_service": "agent_service.py" | kind=code-symbol | source=backend/services/agent_service.py:L1 | neighbors=[d6c5367 commit, agents.py, schemas.py, AgentService, _duration(), Agent provenance, repointed from mock s…]
- "services_agentservice": "agentService.ts" | kind=code-symbol | source=frontend/src/services/agentService.ts:L1 | neighbors=[d6c5367 commit, mockResearchData.ts, MOCK_AGENT_STEPS, AgentService, index.ts, AgentProvenanceStep]
- "services_arxiv_query": "_query()" | kind=code-symbol | source=backend/services/arxiv.py:L78 | neighbors=[arxiv.py, lookup(), ArxivError, _get(), _parse_entry(), search()]
- "services_embeddings_build_embedder": "build_embedder()" | kind=code-symbol | source=backend/services/embeddings.py:L151 | neighbors=[embeddings.py, FakeEmbedder, OpenRouterEmbedder, Return the real embedder when OPENROUTE…, OpenAIEmbedder, Return the real embedder when a key exi…]
- "services_embeddings_openaiembedder": "OpenAIEmbedder" | kind=code-symbol | source=backend/services/embeddings.py:L59 | neighbors=[embeddings.py, build_embedder(), Embedder, .embed(), .__init__(), text-embedding-3-small via the OpenAI c…]
- "services_intentservice": "intentService.ts" | kind=code-symbol | source=frontend/src/services/intentService.ts:L1 | neighbors=[d6c5367 commit, ResearchHome.tsx, analyzeIntent(), generateSubQueries(), IntentAnalysisResult, IntentType]
- "services_pdfservice": "pdfService.ts" | kind=code-symbol | source=frontend/src/services/pdfService.ts:L1 | neighbors=[d6c5367 commit, ChatWithPDF.tsx, PDFService, index.ts, PDFDocumentModel, PDFRAGResult]
- "services_pdfservice_pdfservice": "PDFService" | kind=code-symbol | source=frontend/src/services/pdfService.ts:L5 | neighbors=[ChatWithPDF.tsx, pdfService.ts, .deleteDocument(), .getDocuments(), .queryAgenticRAG(), .uploadPDF()]
- "services_research_service_build_evidence_matrix": "build_evidence_matrix()" | kind=code-symbol | source=backend/services/research_service.py:L43 | neighbors=[research_service.py, _session_status(), One row per paper that was actually cit…, .export_matrix_csv(), .get_evidence_matrix(), .update_evidence_status()]
- "services_retrieval_content_terms": "content_terms()" | kind=code-symbol | source=backend/services/retrieval.py:L86 | neighbors=[retrieval.py, tokenize(), lexical_coverage(), rank_papers(), Query terms in order, duplicates remove…, retrieve()]
- "services_retrieval_rank_papers": "rank_papers()" | kind=code-symbol | source=backend/services/retrieval.py:L342 | neighbors=[retrieval.py, BM25, .score(), content_terms(), tokenize(), Rank whole papers (used for the candida…]
- "services_retrieval_tokenize": "tokenize()" | kind=code-symbol | source=backend/services/retrieval.py:L73 | neighbors=[retrieval.py, content_terms(), lexical_coverage(), rank_papers(), retrieve(), token_set()]
- "services_workflow_resolve_provider": "_resolve_provider()" | kind=code-symbol | source=backend/services/workflow.py:L85 | neighbors=[workflow.py, Pick the provider for a session/run, re…, WorkflowError, run_review(), _run_with_question(), start_session()]
- "agent_callbacks_activityrecorder_add": "._add()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L100 | neighbors=[ActivityRecorder, .note(), .on_llm_error(), .on_tool_error(), .on_tool_start()]
- "backend_config_llm_status": "llm_status()" | kind=code-symbol | source=backend/config.py:L159 | neighbors=[config.py, default_provider(), .key_present(), Machine-readable provider status, surfa…, Machine-readable provider status, surfa…]
- "backend_db_create_session": "create_session()" | kind=code-symbol | source=backend/db.py:L399 | neighbors=[db.py, init_db(), new_id(), now(), transaction()]
- "backend_db_get_approvals": "get_approvals()" | kind=code-symbol | source=backend/db.py:L541 | neighbors=[db.py, approved_doc_ids(), cursor(), init_db(), rejected_doc_ids()]
- "backend_db_new_id": "new_id()" | kind=code-symbol | source=backend/db.py:L223 | neighbors=[db.py, create_session(), record_eval_run(), replace_citations(), set_approval()]
- "backend_db_set_approval": "set_approval()" | kind=code-symbol | source=backend/db.py:L506 | neighbors=[db.py, init_db(), new_id(), now(), transaction()]
- "components_agentactivitylog": "AgentActivityLog.tsx" | kind=code-symbol | source=frontend/src/components/AgentActivityLog.tsx:L1 | neighbors=[AgentActivityLog(), KIND_META, index.ts, ActivityEvent, LiteratureReview.tsx]
- "components_sourceapprovalpanel": "SourceApprovalPanel.tsx" | kind=code-symbol | source=frontend/src/components/SourceApprovalPanel.tsx:L1 | neighbors=[Props, SourceApprovalPanel(), index.ts, CandidatePaper, LiteratureReview.tsx]
- "layout_sidebar": "Sidebar.tsx" | kind=code-symbol | source=frontend/src/components/layout/Sidebar.tsx:L1 | neighbors=[d6c5367 commit, AppLayout.tsx, primaryNavItems, secondaryNavItems, Sidebar()]
- "llm_init_rationale_1": "LLM provider layer.  `from services.llm import build_llm` is the only import cal" | kind=entity | source=backend/services/llm/__init__.py:L1 | neighbors=[BaseLLM, LLMError, LLMResult, __init__.py, ExtractiveLLM]
- "llm_offline_extractivellm_compose": "._compose()" | kind=code-symbol | source=backend/services/llm/offline.py:L283 | neighbors=[ExtractiveLLM, candidate_sentences(), _content_tokens(), _mmr(), .generate()]
- "llm_registry": "registry.py" | kind=code-symbol | source=backend/services/llm/registry.py:L1 | neighbors=[_adapter_class(), as_chat_model(), build_llm(), is_real(), Provider factory and the LangChain adap…]
- "llm_registry_as_chat_model": "as_chat_model()" | kind=code-symbol | source=backend/services/llm/registry.py:L127 | neighbors=[registry.py, _adapter_class(), Wrap (and memoise) a BaseLLM as a LangC…, Wrap (and memoise) a BaseLLM as a LangC…, Wrap (and memoise) a BaseLLM as a LangC…]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-003.json

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
