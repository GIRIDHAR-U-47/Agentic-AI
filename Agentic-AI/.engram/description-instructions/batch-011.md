# Node Description Batch 12 of 27

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

- "pages_chatwithpdf_chatwithpdf": "ChatWithPDF()" | kind=code-symbol | source=frontend/src/pages/ChatWithPDF.tsx:L26 | neighbors=[ChatWithPDF.tsx, App.tsx]
- "pages_citationgenerator_citationgenerator": "CitationGenerator()" | kind=code-symbol | source=frontend/src/pages/CitationGenerator.tsx:L20 | neighbors=[CitationGenerator.tsx, App.tsx]
- "pages_comparison_comparison": "Comparison()" | kind=code-symbol | source=frontend/src/pages/Comparison.tsx:L5 | neighbors=[Comparison.tsx, App.tsx]
- "pages_evidencevalidation_evidencevalidation": "EvidenceValidation()" | kind=code-symbol | source=frontend/src/pages/EvidenceValidation.tsx:L8 | neighbors=[EvidenceValidation.tsx, App.tsx]
- "pages_extractdata_extractdata": "ExtractData()" | kind=code-symbol | source=frontend/src/pages/ExtractData.tsx:L40 | neighbors=[ExtractData.tsx, App.tsx]
- "pages_findtopics_findtopics": "FindTopics()" | kind=code-symbol | source=frontend/src/pages/FindTopics.tsx:L42 | neighbors=[FindTopics.tsx, App.tsx]
- "pages_literaturereview_inline": "inline()" | kind=code-symbol | source=frontend/src/pages/LiteratureReview.tsx:L45 | neighbors=[LiteratureReview.tsx, Markdown()]
- "pages_literaturereview_literaturereview": "LiteratureReview()" | kind=code-symbol | source=frontend/src/pages/LiteratureReview.tsx:L151 | neighbors=[LiteratureReview.tsx, App.tsx]
- "pages_literaturereview_markdown": "Markdown()" | kind=code-symbol | source=frontend/src/pages/LiteratureReview.tsx:L58 | neighbors=[LiteratureReview.tsx, inline()]
- "pages_paperanalysis_paperanalysis": "PaperAnalysis()" | kind=code-symbol | source=frontend/src/pages/PaperAnalysis.tsx:L6 | neighbors=[PaperAnalysis.tsx, App.tsx]
- "pages_paraphraser_paraphraser": "Paraphraser()" | kind=code-symbol | source=frontend/src/pages/Paraphraser.tsx:L14 | neighbors=[Paraphraser.tsx, App.tsx]
- "pages_researchhome_researchhome": "ResearchHome()" | kind=code-symbol | source=frontend/src/pages/ResearchHome.tsx:L68 | neighbors=[ResearchHome.tsx, App.tsx]
- "pages_researchworkspace_researchworkspace": "ResearchWorkspace()" | kind=code-symbol | source=frontend/src/pages/ResearchWorkspace.tsx:L9 | neighbors=[ResearchWorkspace.tsx, App.tsx]
- "pages_templates_templates": "TEMPLATES" | kind=code-symbol | source=frontend/src/pages/Templates.tsx:L6 | neighbors=[Templates.tsx, App.tsx]
- "routers_agents_autopilotin": "AutoPilotIn" | kind=code-symbol | source=backend/routers/agents.py:L21 | neighbors=[agents.py, BaseModel]
- "routers_agents_get_autopilot_status": "get_autopilot_status()" | kind=code-symbol | source=backend/routers/agents.py:L49 | neighbors=[agents.py, Always false: R-Lens is human-in-the-lo…]
- "routers_agents_instructionin": "InstructionIn" | kind=code-symbol | source=backend/routers/agents.py:L16 | neighbors=[agents.py, BaseModel]
- "routers_collection_delete_paper": "delete_paper()" | kind=code-symbol | source=backend/routers/collection.py:L57 | neighbors=[collection.py, Explicitly delete a paper from the coll…]
- "routers_corpus_arxivlookupin": "ArxivLookupIn" | kind=code-symbol | source=backend/routers/corpus.py:L41 | neighbors=[corpus.py, BaseModel]
- "routers_corpus_corpus_stats": "corpus_stats()" | kind=code-symbol | source=backend/routers/corpus.py:L63 | neighbors=[corpus.py, list_corpus()]
- "routers_corpus_documentout": "DocumentOut" | kind=code-symbol | source=backend/routers/corpus.py:L22 | neighbors=[corpus.py, BaseModel]
- "routers_corpus_list_corpus": "list_corpus()" | kind=code-symbol | source=backend/routers/corpus.py:L46 | neighbors=[corpus.py, corpus_stats()]
- "routers_discovery_discoverin": "DiscoverIn" | kind=code-symbol | source=backend/routers/discovery.py:L14 | neighbors=[discovery.py, BaseModel]
- "routers_evidence_export_bibtex": "export_bibtex()" | kind=code-symbol | source=backend/routers/evidence.py:L49 | neighbors=[evidence.py, BibTeX from real document metadata. No …]
- "routers_evidence_statusupdate": "StatusUpdate" | kind=code-symbol | source=backend/routers/evidence.py:L18 | neighbors=[evidence.py, BaseModel]
- "routers_pdf_delete_document": "delete_document()" | kind=code-symbol | source=backend/routers/pdf.py:L61 | neighbors=[pdf.py, Removes a document from the active sess…]
- "routers_pdf_get_all_documents": "get_all_documents()" | kind=code-symbol | source=backend/routers/pdf.py:L15 | neighbors=[pdf.py, Returns list of currently indexed PDF d…]
- "routers_pdf_query_pdf_rag": "query_pdf_rag()" | kind=code-symbol | source=backend/routers/pdf.py:L50 | neighbors=[pdf.py, Multi-step Agentic RAG over the uploade…]
- "routers_pdf_upload_pdf": "upload_pdf()" | kind=code-symbol | source=backend/routers/pdf.py:L29 | neighbors=[pdf.py, Upload a PDF. Extracts real text via Py…]
- "routers_sessions_feedback": "feedback()" | kind=code-symbol | source=backend/routers/sessions.py:L144 | neighbors=[sessions.py, Researcher feedback on a completed revi…]
- "routers_sessions_rationale_1": "Session + review workflow endpoints.  Route map (the demo path is exactly this o" | kind=entity | source=backend/routers/sessions.py:L1 | neighbors=[LLMError, sessions.py]
- "routers_sessions_rationale_145": "Researcher feedback on a completed review -> revised draft.      The earlier dra" | kind=entity | source=backend/routers/sessions.py:L145 | neighbors=[LLMError, feedback()]
- "scripts_fetch_corpus_load_manifest": "load_manifest()" | kind=code-symbol | source=backend/scripts/fetch_corpus.py:L57 | neighbors=[fetch_corpus.py, main()]
- "scripts_fetch_corpus_save_manifest": "save_manifest()" | kind=code-symbol | source=backend/scripts/fetch_corpus.py:L66 | neighbors=[fetch_corpus.py, main()]
- "scripts_fetch_corpus_sha256": "sha256()" | kind=code-symbol | source=backend/scripts/fetch_corpus.py:L53 | neighbors=[fetch_corpus.py, main()]
- "services_agent_service_agentservice_set_autopilot_mode": ".set_autopilot_mode()" | kind=code-symbol | source=backend/services/agent_service.py:L78 | neighbors=[AgentService, Fully autonomous runs are not supported…]
- "services_agent_service_duration": "_duration()" | kind=code-symbol | source=backend/services/agent_service.py:L31 | neighbors=[agent_service.py, .get_steps()]
- "services_api_mode_descriptions": "MODE_DESCRIPTIONS" | kind=code-symbol | source=frontend/src/services/api.ts:L147 | neighbors=[LiteratureReview.tsx, api.ts]
- "services_arxiv_pdf_url": "pdf_url()" | kind=code-symbol | source=backend/services/arxiv.py:L111 | neighbors=[arxiv.py, download_pdf()]
- "services_arxiv_text": "_text()" | kind=code-symbol | source=backend/services/arxiv.py:L44 | neighbors=[arxiv.py, _parse_entry()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-011.json

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
