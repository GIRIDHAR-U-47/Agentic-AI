# Node Description Batch 20 of 27

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

- "services_discovery_rationale_29": "Thin seam over the network calls so tests can inject a fake.      Everything a t" | kind=entity | source=backend/services/discovery.py:L29 | neighbors=[ArxivClient] | lang=pt
- "services_discovery_rationale_376": "Dedupe by arXiv id (and, weakly, by normalised title), dropping papers     alrea" | kind=entity | source=backend/services/discovery.py:L376 | neighbors=[_dedupe_and_filter()] | lang=en
- "services_discovery_rationale_402": "Materialise an approved discovery candidate into the corpus.      Downloads and" | kind=entity | source=backend/services/discovery.py:L402 | neighbors=[ingest_candidate()] | lang=en
- "services_discovery_rationale_466": "Persist a paper we could not fetch full text for, clearly labelled." | kind=entity | source=backend/services/discovery.py:L466 | neighbors=[_ingest_abstract_only()] | lang=en
- "services_discovery_rationale_511": "The last few fresh-topic searches, for health/labelling (no payloads)." | kind=entity | source=backend/services/discovery.py:L511 | neighbors=[list_cached_discoveries()] | lang=en
- "services_embeddings_embedder_embed": ".embed()" | kind=code-symbol | source=backend/services/embeddings.py:L32 | neighbors=[Embedder] | lang=en
- "services_embeddings_embedder_label": ".label()" | kind=code-symbol | source=backend/services/embeddings.py:L39 | neighbors=[Embedder] | lang=en
- "services_embeddings_fakeembedder_embed": ".embed()" | kind=code-symbol | source=backend/services/embeddings.py:L58 | neighbors=[FakeEmbedder] | lang=en
- "services_embeddings_openaiembedder_embed": ".embed()" | kind=code-symbol | source=backend/services/embeddings.py:L73 | neighbors=[OpenAIEmbedder] | lang=en
- "services_embeddings_openaiembedder_init": ".__init__()" | kind=code-symbol | source=backend/services/embeddings.py:L67 | neighbors=[OpenAIEmbedder] | lang=en
- "services_embeddings_openrouterembedder_embed": ".embed()" | kind=code-symbol | source=backend/services/embeddings.py:L92 | neighbors=[OpenRouterEmbedder] | lang=en
- "services_embeddings_openrouterembedder_init": ".__init__()" | kind=code-symbol | source=backend/services/embeddings.py:L80 | neighbors=[OpenRouterEmbedder] | lang=en
- "services_embeddings_openrouterembedder_label": ".label()" | kind=code-symbol | source=backend/services/embeddings.py:L141 | neighbors=[OpenRouterEmbedder] | lang=en
- "services_embeddings_rationale_1": "Embeddings: one documented model via OpenRouter, honest fallback.  The documente" | kind=entity | source=backend/services/embeddings.py:L1 | neighbors=[embeddings.py] | lang=en
- "services_embeddings_rationale_152": "Return the real embedder when OPENROUTER_API_KEY exists, else the fake one." | kind=entity | source=backend/services/embeddings.py:L152 | neighbors=[build_embedder()] | lang=en
- "services_embeddings_rationale_20": "A text -> vector function with an honest identity." | kind=entity | source=backend/services/embeddings.py:L20 | neighbors=[Embedder] | lang=en
- "services_embeddings_rationale_25": "A text -> vector function with an honest identity." | kind=entity | source=backend/services/embeddings.py:L25 | neighbors=[Embedder] | lang=en
- "services_embeddings_rationale_36": "Default batch implementation (sequential). Subclasses can optimize." | kind=entity | source=backend/services/embeddings.py:L36 | neighbors=[.embed_batch()] | lang=en
- "services_embeddings_rationale_40": "Deterministic, hashing-based, offline. Test/demo only -- never real." | kind=entity | source=backend/services/embeddings.py:L40 | neighbors=[FakeEmbedder] | lang=en
- "services_embeddings_rationale_50": "Deterministic, hashing-based, offline. Test/demo only -- never real." | kind=entity | source=backend/services/embeddings.py:L50 | neighbors=[FakeEmbedder] | lang=en
- "services_embeddings_rationale_60": "text-embedding-3-small via the OpenAI client. Requires EMBEDDING_API_KEY." | kind=entity | source=backend/services/embeddings.py:L60 | neighbors=[OpenAIEmbedder] | lang=en
- "services_embeddings_rationale_71": "OpenRouter embeddings via the OpenAI-compatible embeddings endpoint.     Require" | kind=entity | source=backend/services/embeddings.py:L71 | neighbors=[OpenRouterEmbedder] | lang=en
- "services_embeddings_rationale_79": "Return the real embedder when a key exists, else the fake one." | kind=entity | source=backend/services/embeddings.py:L79 | neighbors=[build_embedder()] | lang=en
- "services_embeddings_rationale_96": "Batch embed via OpenRouter's OpenAI-compatible endpoint." | kind=entity | source=backend/services/embeddings.py:L96 | neighbors=[.embed_batch()] | lang=en
- "services_ingest_rationale_1": "PDF ingestion: real text extraction, section detection, chunking.\r \r This is the" | kind=entity | source=backend/services/ingest.py:L1 | neighbors=[ingest.py] | lang=en
- "services_ingest_rationale_138": "Best-effort author line, or `\"\"` when the PDF does not make it obvious.\r \r     A" | kind=entity | source=backend/services/ingest.py:L138 | neighbors=[guess_authors()] | lang=en
- "services_ingest_rationale_161": "Publication year, or `\"\"` when absent. Never guessed from the filename." | kind=entity | source=backend/services/ingest.py:L161 | neighbors=[guess_year()] | lang=en
- "services_ingest_rationale_167": "DOI printed in the PDF, or `\"\"`.\r \r     A PDF usually carries no DOI at all, so" | kind=entity | source=backend/services/ingest.py:L167 | neighbors=[guess_doi()] | lang=en
- "services_ingest_rationale_188": "Best-effort abstract capture from the earliest pages." | kind=entity | source=backend/services/ingest.py:L188 | neighbors=[extract_abstract()] | lang=en
- "services_ingest_rationale_204": "Identify repeating page headers/footers so they can be stripped.\r \r     Every pa" | kind=entity | source=backend/services/ingest.py:L204 | neighbors=[find_running_heads()] | lang=en
- "services_ingest_rationale_346": "Heuristic 0..1 score for \"is this real prose rather than PDF debris\".\r \r     Cal" | kind=entity | source=backend/services/ingest.py:L346 | neighbors=[prose_score()] | lang=en
- "services_ingest_rationale_401": "Sentence-aware chunking with overlap.\r \r     The original used 500/50 on paragra" | kind=entity | source=backend/services/ingest.py:L401 | neighbors=[split_chunks()] | lang=en
- "services_ingest_rationale_440": "Extract, chunk, persist. Returns the stored document record.\r \r     `metadata` (" | kind=entity | source=backend/services/ingest.py:L440 | neighbors=[ingest_pdf()] | lang=en
- "services_ingest_rationale_85": "Return {page_number: text} plus the page count. Raises ValueError on failure." | kind=entity | source=backend/services/ingest.py:L85 | neighbors=[extract_pages()] | lang=en
- "services_intentservice_intenttype": "IntentType" | kind=code-symbol | source=frontend/src/services/intentService.ts:L1 | neighbors=[intentService.ts] | lang=en
- "services_paperservice_paperservice_getpaperbyid": ".getPaperById()" | kind=code-symbol | source=frontend/src/services/paperService.ts:L60 | neighbors=[PaperService] | lang=en
- "services_paperservice_paperservice_getpapers": ".getPapers()" | kind=code-symbol | source=frontend/src/services/paperService.ts:L7 | neighbors=[PaperService] | lang=en
- "services_paperservice_paperservice_updatepapervalidation": ".updatePaperValidation()" | kind=code-symbol | source=frontend/src/services/paperService.ts:L64 | neighbors=[PaperService] | lang=en
- "services_pdf_rag_service_pdfragservice_delete_document": ".delete_document()" | kind=code-symbol | source=backend/services/pdf_rag_service.py:L96 | neighbors=[PDFRAGService] | lang=en
- "services_pdf_rag_service_rationale_1": "Backward-compatible facade over the new ingestion/retrieval/agent stack.  The or" | kind=entity | source=backend/services/pdf_rag_service.py:L1 | neighbors=[pdf_rag_service.py] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-019.json

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
