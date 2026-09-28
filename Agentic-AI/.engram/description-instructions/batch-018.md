# Node Description Batch 19 of 27

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

- "routers_evidence_get_evidence_matrix": "get_evidence_matrix()" | kind=code-symbol | source=backend/routers/evidence.py:L24 | neighbors=[evidence.py]
- "routers_evidence_rationale_1": "Evidence + citation export endpoints.  These now require an optional `session_id" | kind=entity | source=backend/routers/evidence.py:L1 | neighbors=[evidence.py]
- "routers_evidence_rationale_50": "BibTeX from real document metadata. No invented DOIs or entries." | kind=entity | source=backend/routers/evidence.py:L50 | neighbors=[export_bibtex()]
- "routers_evidence_update_matrix_row_status": "update_matrix_row_status()" | kind=code-symbol | source=backend/routers/evidence.py:L31 | neighbors=[evidence.py]
- "routers_papers_get_paper": "get_paper()" | kind=code-symbol | source=backend/routers/papers.py:L27 | neighbors=[papers.py]
- "routers_papers_list_papers": "list_papers()" | kind=code-symbol | source=backend/routers/papers.py:L9 | neighbors=[papers.py]
- "routers_papers_update_validation": "update_validation()" | kind=code-symbol | source=backend/routers/papers.py:L34 | neighbors=[papers.py]
- "routers_pdf_get_document": "get_document()" | kind=code-symbol | source=backend/routers/pdf.py:L21 | neighbors=[pdf.py]
- "routers_sessions_create_session": "create_session()" | kind=code-symbol | source=backend/routers/sessions.py:L80 | neighbors=[sessions.py]
- "routers_sessions_delete_session": "delete_session()" | kind=code-symbol | source=backend/routers/sessions.py:L104 | neighbors=[sessions.py]
- "routers_sessions_get_session": "get_session()" | kind=code-symbol | source=backend/routers/sessions.py:L96 | neighbors=[sessions.py]
- "routers_sessions_health": "health()" | kind=code-symbol | source=backend/routers/sessions.py:L63 | neighbors=[sessions.py]
- "routers_sessions_list_sessions": "list_sessions()" | kind=code-symbol | source=backend/routers/sessions.py:L91 | neighbors=[sessions.py]
- "routers_sessions_reply": "reply()" | kind=code-symbol | source=backend/routers/sessions.py:L135 | neighbors=[sessions.py]
- "routers_sessions_review_markdown": "review_markdown()" | kind=code-symbol | source=backend/routers/sessions.py:L165 | neighbors=[sessions.py]
- "routers_sessions_run": "run()" | kind=code-symbol | source=backend/routers/sessions.py:L121 | neighbors=[sessions.py]
- "routers_sessions_set_approval": "set_approval()" | kind=code-symbol | source=backend/routers/sessions.py:L111 | neighbors=[sessions.py]
- "scripts_fetch_corpus_rationale_1": "Download and ingest the pinned evaluation/demo corpus from arXiv.  The mini proj" | kind=entity | source=backend/scripts/fetch_corpus.py:L1 | neighbors=[fetch_corpus.py]
- "services_agent_service_agentservice_get_sessions": ".get_sessions()" | kind=code-symbol | source=backend/services/agent_service.py:L71 | neighbors=[AgentService]
- "services_agent_service_agentservice_init": ".__init__()" | kind=code-symbol | source=backend/services/agent_service.py:L41 | neighbors=[AgentService]
- "services_agent_service_agentservice_is_autopilot_mode": ".is_autopilot_mode()" | kind=code-symbol | source=backend/services/agent_service.py:L75 | neighbors=[AgentService]
- "services_agentservice_agentservice_addinstruction": ".addInstruction()" | kind=code-symbol | source=frontend/src/services/agentService.ts:L20 | neighbors=[AgentService]
- "services_agentservice_agentservice_getsteps": ".getSteps()" | kind=code-symbol | source=frontend/src/services/agentService.ts:L8 | neighbors=[AgentService]
- "services_agentservice_agentservice_isautopilotmode": ".isAutoPilotMode()" | kind=code-symbol | source=frontend/src/services/agentService.ts:L12 | neighbors=[AgentService]
- "services_agentservice_agentservice_setautopilotmode": ".setAutoPilotMode()" | kind=code-symbol | source=frontend/src/services/agentService.ts:L16 | neighbors=[AgentService]
- "services_api_request": "request()" | kind=code-symbol | source=frontend/src/services/api.ts:L22 | neighbors=[api.ts]
- "services_arxiv_rationale_1": "Minimal arXiv client: metadata lookup + search.  The arXiv API needs no credenti" | kind=entity | source=backend/services/arxiv.py:L1 | neighbors=[arxiv.py]
- "services_arxiv_rationale_116": "Download a paper PDF. Returns bytes; caller records the checksum." | kind=entity | source=backend/services/arxiv.py:L116 | neighbors=[download_pdf()]
- "services_arxiv_rationale_89": "Fetch authoritative metadata for one arXiv id (version suffix optional)." | kind=entity | source=backend/services/arxiv.py:L89 | neighbors=[lookup()]
- "services_arxiv_rationale_95": "Free-text arXiv search. Used by the agent's `search_papers` tool." | kind=entity | source=backend/services/arxiv.py:L95 | neighbors=[search()]
- "services_discovery_arxivclient_download_pdf": ".download_pdf()" | kind=code-symbol | source=backend/services/discovery.py:L37 | neighbors=[ArxivClient]
- "services_discovery_arxivclient_search": ".search()" | kind=code-symbol | source=backend/services/discovery.py:L34 | neighbors=[ArxivClient]
- "services_discovery_fakearxivclient_init": ".__init__()" | kind=code-symbol | source=backend/services/discovery.py:L127 | neighbors=[_FakeArxivClient]
- "services_discovery_fakearxivclient_search": ".search()" | kind=code-symbol | source=backend/services/discovery.py:L149 | neighbors=[_FakeArxivClient]
- "services_discovery_rationale_1": "Fresh-topic discovery: search arXiv for a question the corpus cannot answer.  Th" | kind=entity | source=backend/services/discovery.py:L1 | neighbors=[discovery.py]
- "services_discovery_rationale_116": "Deterministic in-process client used by tests (and the RLENS_FAKE_ARXIV     demo" | kind=entity | source=backend/services/discovery.py:L116 | neighbors=[_FakeArxivClient]
- "services_discovery_rationale_197": "A minimal single-page PDF that PyMuPDF can open and extract text from.      The" | kind=entity | source=backend/services/discovery.py:L197 | neighbors=[_minimal_pdf()]
- "services_discovery_rationale_224": "Normalise an arXiv entry into the candidate shape the UI renders." | kind=entity | source=backend/services/discovery.py:L224 | neighbors=[_canonical()]
- "services_discovery_rationale_249": "True when barely any of the top candidates lexically covers the question." | kind=entity | source=backend/services/discovery.py:L249 | neighbors=[_poor_coverage()]
- "services_discovery_rationale_271": "Search arXiv for `question`, refining once when results look poor.      Never ra" | kind=entity | source=backend/services/discovery.py:L271 | neighbors=[discover()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-018.json

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
