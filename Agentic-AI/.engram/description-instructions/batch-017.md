# Node Description Batch 18 of 27

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

- "pages_citationgenerator_citationresult": "CitationResult" | kind=code-symbol | source=frontend/src/pages/CitationGenerator.tsx:L6 | neighbors=[CitationGenerator.tsx]
- "pages_citationgenerator_formats": "FORMATS" | kind=code-symbol | source=frontend/src/pages/CitationGenerator.tsx:L4 | neighbors=[CitationGenerator.tsx]
- "pages_citationgenerator_sample_citations": "SAMPLE_CITATIONS" | kind=code-symbol | source=frontend/src/pages/CitationGenerator.tsx:L11 | neighbors=[CitationGenerator.tsx]
- "pages_extractdata_colors": "COLORS" | kind=code-symbol | source=frontend/src/pages/ExtractData.tsx:L33 | neighbors=[ExtractData.tsx]
- "pages_extractdata_extract_options": "EXTRACT_OPTIONS" | kind=code-symbol | source=frontend/src/pages/ExtractData.tsx:L11 | neighbors=[ExtractData.tsx]
- "pages_extractdata_extracteditem": "ExtractedItem" | kind=code-symbol | source=frontend/src/pages/ExtractData.tsx:L4 | neighbors=[ExtractData.tsx]
- "pages_extractdata_icons": "ICONS" | kind=code-symbol | source=frontend/src/pages/ExtractData.tsx:L26 | neighbors=[ExtractData.tsx]
- "pages_extractdata_mock_results": "MOCK_RESULTS" | kind=code-symbol | source=frontend/src/pages/ExtractData.tsx:L18 | neighbors=[ExtractData.tsx]
- "pages_findtopics_topic_cards": "TOPIC_CARDS" | kind=code-symbol | source=frontend/src/pages/FindTopics.tsx:L15 | neighbors=[FindTopics.tsx]
- "pages_findtopics_trending_topics": "TRENDING_TOPICS" | kind=code-symbol | source=frontend/src/pages/FindTopics.tsx:L4 | neighbors=[FindTopics.tsx]
- "pages_paraphraser_modes": "MODES" | kind=code-symbol | source=frontend/src/pages/Paraphraser.tsx:L4 | neighbors=[Paraphraser.tsx]
- "pages_researchhome_tool_row": "TOOL_ROW" | kind=code-symbol | source=frontend/src/pages/ResearchHome.tsx:L15 | neighbors=[ResearchHome.tsx]
- "pages_researchhome_tools": "TOOLS" | kind=code-symbol | source=frontend/src/pages/ResearchHome.tsx:L6 | neighbors=[ResearchHome.tsx]
- "pages_researchhome_workspace_cards": "WORKSPACE_CARDS" | kind=code-symbol | source=frontend/src/pages/ResearchHome.tsx:L35 | neighbors=[ResearchHome.tsx]
- "pages_researchhome_workspacecard": "WorkspaceCard" | kind=code-symbol | source=frontend/src/pages/ResearchHome.tsx:L24 | neighbors=[ResearchHome.tsx]
- "pages_templates_categories": "CATEGORIES" | kind=code-symbol | source=frontend/src/pages/Templates.tsx:L4 | neighbors=[Templates.tsx]
- "routers_agents_get_provenance_steps": "get_provenance_steps()" | kind=code-symbol | source=backend/routers/agents.py:L26 | neighbors=[agents.py]
- "routers_agents_list_agent_sessions": "list_agent_sessions()" | kind=code-symbol | source=backend/routers/agents.py:L33 | neighbors=[agents.py]
- "routers_agents_rationale_1": "Agent provenance endpoints.  The original returned six hardcoded `MOCK_AGENT_STE" | kind=entity | source=backend/routers/agents.py:L1 | neighbors=[agents.py]
- "routers_agents_rationale_50": "Always false: R-Lens is human-in-the-loop by design." | kind=entity | source=backend/routers/agents.py:L50 | neighbors=[get_autopilot_status()]
- "routers_agents_set_autopilot_status": "set_autopilot_status()" | kind=code-symbol | source=backend/routers/agents.py:L55 | neighbors=[agents.py]
- "routers_agents_submit_instruction": "submit_instruction()" | kind=code-symbol | source=backend/routers/agents.py:L38 | neighbors=[agents.py]
- "routers_collection_collection_health": "collection_health()" | kind=code-symbol | source=backend/routers/collection.py:L22 | neighbors=[collection.py]
- "routers_collection_rationale_1": "Vector collection management.  Vectors are upserted when a paper is ingested/syn" | kind=entity | source=backend/routers/collection.py:L1 | neighbors=[collection.py]
- "routers_collection_rationale_58": "Explicitly delete a paper from the collection: vectors + document." | kind=entity | source=backend/routers/collection.py:L58 | neighbors=[delete_paper()]
- "routers_collection_sync_all": "sync_all()" | kind=code-symbol | source=backend/routers/collection.py:L39 | neighbors=[collection.py]
- "routers_collection_sync_paper": "sync_paper()" | kind=code-symbol | source=backend/routers/collection.py:L47 | neighbors=[collection.py]
- "routers_corpus_arxiv_lookup": "arxiv_lookup()" | kind=code-symbol | source=backend/routers/corpus.py:L148 | neighbors=[corpus.py]
- "routers_corpus_get_doc": "get_doc()" | kind=code-symbol | source=backend/routers/corpus.py:L95 | neighbors=[corpus.py]
- "routers_corpus_rationale_1": "Corpus endpoints: what is in the collection, and how to add to it.  The legacy `" | kind=entity | source=backend/routers/corpus.py:L1 | neighbors=[corpus.py]
- "routers_corpus_rationale_110": "Ingest an uploaded PDF. Fails loudly on scans rather than indexing blanks." | kind=entity | source=backend/routers/corpus.py:L110 | neighbors=[upload()]
- "routers_corpus_rationale_125": "Ingest an uploaded PDF. Fails loudly on scans rather than indexing blanks." | kind=entity | source=backend/routers/corpus.py:L125 | neighbors=[upload()]
- "routers_corpus_rationale_67": "Rank the corpus for a question. Used to populate the approval panel." | kind=entity | source=backend/routers/corpus.py:L67 | neighbors=[suggest()]
- "routers_corpus_rationale_71": "Rank the corpus for a question. Used to populate the approval panel." | kind=entity | source=backend/routers/corpus.py:L71 | neighbors=[suggest()]
- "routers_corpus_remove_doc": "remove_doc()" | kind=code-symbol | source=backend/routers/corpus.py:L106 | neighbors=[corpus.py]
- "routers_discovery_cache": "cache()" | kind=code-symbol | source=backend/routers/discovery.py:L28 | neighbors=[discovery.py]
- "routers_discovery_discover": "discover()" | kind=code-symbol | source=backend/routers/discovery.py:L20 | neighbors=[discovery.py]
- "routers_discovery_rationale_1": "Fresh-topic discovery endpoint: search arXiv, refine, cache." | kind=entity | source=backend/routers/discovery.py:L1 | neighbors=[discovery.py]
- "routers_evidence_export_matrix_csv": "export_matrix_csv()" | kind=code-symbol | source=backend/routers/evidence.py:L59 | neighbors=[evidence.py]
- "routers_evidence_get_citations": "get_citations()" | kind=code-symbol | source=backend/routers/evidence.py:L42 | neighbors=[evidence.py]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-017.json

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
