# Node Description Batch 27 of 27

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
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "types_index_sessionmetrics": "SessionMetrics" | kind=code-symbol | source=frontend/src/types/index.ts:L373 | neighbors=[index.ts]
- "types_index_sessionstate": "SessionState" | kind=code-symbol | source=frontend/src/types/index.ts:L174 | neighbors=[index.ts]
- "types_index_validationstatus": "ValidationStatus" | kind=code-symbol | source=frontend/src/types/index.ts:L1 | neighbors=[index.ts]
- "backend_debug_agent": "debug_agent.py" | kind=code-symbol | source=backend/debug_agent.py:L1
- "backend_debug_revise": "debug_revise.py" | kind=code-symbol | source=backend/debug_revise.py:L1
- "backend_debug_revise2": "debug_revise2.py" | kind=code-symbol | source=backend/debug_revise2.py:L1
- "backend_debug_revise3": "debug_revise3.py" | kind=code-symbol | source=backend/debug_revise3.py:L1
- "backend_debug_revise4": "debug_revise4.py" | kind=code-symbol | source=backend/debug_revise4.py:L1
- "backend_debug_workflow": "debug_workflow.py" | kind=code-symbol | source=backend/debug_workflow.py:L1
- "backend_debug_workflow2": "debug_workflow2.py" | kind=code-symbol | source=backend/debug_workflow2.py:L1

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-026.json

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
