# Node Description Batch 15 of 27

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

- "types_index_approvaldecision": "ApprovalDecision" | kind=code-symbol | source=frontend/src/types/index.ts:L419 | neighbors=[api.ts, index.ts] | lang=en
- "types_index_corpusstats": "CorpusStats" | kind=code-symbol | source=frontend/src/types/index.ts:L200 | neighbors=[api.ts, index.ts] | lang=en
- "types_index_createsessionresponse": "CreateSessionResponse" | kind=code-symbol | source=frontend/src/types/index.ts:L398 | neighbors=[api.ts, index.ts] | lang=en
- "types_index_pdfragcitation": "PDFRAGCitation" | kind=code-symbol | source=frontend/src/types/index.ts:L152 | neighbors=[ChatWithPDF.tsx, index.ts] | lang=en
- "types_index_pdfragresult": "PDFRAGResult" | kind=code-symbol | source=frontend/src/types/index.ts:L161 | neighbors=[pdfService.ts, index.ts] | lang=en
- "types_index_pdfsectioninfo": "PDFSectionInfo" | kind=code-symbol | source=frontend/src/types/index.ts:L122 | neighbors=[ChatWithPDF.tsx, index.ts] | lang=en
- "types_index_review": "Review" | kind=code-symbol | source=frontend/src/types/index.ts:L323 | neighbors=[LiteratureReview.tsx, index.ts] | lang=en
- "types_index_reviewcitation": "ReviewCitation" | kind=code-symbol | source=frontend/src/types/index.ts:L288 | neighbors=[LiteratureReview.tsx, index.ts] | lang=en
- "types_index_revision": "Revision" | kind=code-symbol | source=frontend/src/types/index.ts:L267 | neighbors=[LiteratureReview.tsx, index.ts] | lang=en
- "agent_callbacks_activityevent_to_dict": ".to_dict()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L38 | neighbors=[ActivityEvent] | lang=en
- "agent_callbacks_activityrecorder_as_dicts": ".as_dicts()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L131 | neighbors=[ActivityRecorder] | lang=en
- "agent_callbacks_activityrecorder_budget_left": ".budget_left()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L118 | neighbors=[ActivityRecorder] | lang=en
- "agent_callbacks_activityrecorder_init": ".__init__()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L80 | neighbors=[ActivityRecorder] | lang=en
- "agent_callbacks_activityrecorder_refinement_count": ".refinement_count()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L115 | neighbors=[ActivityRecorder] | lang=en
- "agent_callbacks_activityrecorder_summary": ".summary()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L134 | neighbors=[ActivityRecorder] | lang=en
- "agent_callbacks_activityrecorder_tool_call_count": ".tool_call_count()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L111 | neighbors=[ActivityRecorder] | lang=en
- "agent_callbacks_agentneedsuser_init": ".__init__()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L62 | neighbors=[AgentNeedsUser] | lang=en
- "agent_callbacks_agentneedsuser_to_dict": ".to_dict()" | kind=code-symbol | source=backend/services/agent/callbacks.py:L69 | neighbors=[AgentNeedsUser] | lang=en
- "agent_callbacks_rationale_1": "Structured activity log captured from the LangChain callback interface.  `AgentE" | kind=entity | source=backend/services/agent/callbacks.py:L1 | neighbors=[callbacks.py] | lang=en
- "agent_callbacks_rationale_105": "Manually record a non-callback step (plan, decision, limit)." | kind=entity | source=backend/services/agent/callbacks.py:L105 | neighbors=[.note()] | lang=pt
- "agent_callbacks_rationale_122": "Whitespace-token count for providers that report no usage.          Deliberately" | kind=entity | source=backend/services/agent/callbacks.py:L122 | neighbors=[.estimate_usage()] | lang=en
- "agent_callbacks_rationale_27": "One observable step in the agent's reasoning." | kind=entity | source=backend/services/agent/callbacks.py:L27 | neighbors=[ActivityEvent] | lang=en
- "agent_callbacks_rationale_52": "Raised by the tool layer when the per-run tool budget is spent." | kind=entity | source=backend/services/agent/callbacks.py:L52 | neighbors=[ToolBudgetExceeded] | lang=en
- "agent_callbacks_rationale_56": "Raised when the agent decides it must ask the human something.      Carries the" | kind=entity | source=backend/services/agent/callbacks.py:L56 | neighbors=[AgentNeedsUser] | lang=en
- "agent_callbacks_rationale_78": "Collects the agent's observable behaviour into `ActivityEvent`s." | kind=entity | source=backend/services/agent/callbacks.py:L78 | neighbors=[ActivityRecorder] | lang=en
- "agent_init": "__init__.py" | kind=code-symbol | source=backend/services/agent/__init__.py:L1 | neighbors=[Agentic literature-review engine.  `fro…] | lang=en
- "agent_offline_policy_offlinereactpolicy_init": ".__init__()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L116 | neighbors=[OfflineReactPolicy] | lang=en
- "agent_offline_policy_offlinereactpolicy_llm_type": ".llm_type()" | kind=code-symbol | source=backend/services/agent/offline_policy.py:L170 | neighbors=[OfflineReactPolicy] | lang=en
- "agent_prompts": "prompts.py" | kind=code-symbol | source=backend/services/agent/prompts.py:L1 | neighbors=[Prompts for the agentic stages.  The gr…] | lang=en
- "agent_prompts_rationale_1": "Prompts for the agentic stages.  The grounded-answer prompt is preserved from th" | kind=entity | source=backend/services/agent/prompts.py:L1 | neighbors=[prompts.py] | lang=en
- "agent_reflection_claimcheck_ok": ".ok()" | kind=code-symbol | source=backend/services/agent/reflection.py:L78 | neighbors=[ClaimCheck] | lang=en
- "agent_reflection_claimcheck_to_dict": ".to_dict()" | kind=code-symbol | source=backend/services/agent/reflection.py:L81 | neighbors=[ClaimCheck] | lang=en
- "agent_reflection_rationale_1": "Reflection / self-correction: verify that every claim is actually supported.  Th" | kind=entity | source=backend/services/agent/reflection.py:L1 | neighbors=[reflection.py] | lang=en
- "agent_reflection_rationale_127": "Split an answer into checkable claim units (bullets, then sentences).      Markd" | kind=entity | source=backend/services/agent/reflection.py:L127 | neighbors=[split_claims()] | lang=en
- "agent_reflection_rationale_181": "`0.129` and `.129` should compare equal; drop trailing zeros." | kind=entity | source=backend/services/agent/reflection.py:L181 | neighbors=[normalise_number()] | lang=en
- "agent_reflection_rationale_218": "`[S1 p.9]` -> `[(\"S1\", 9)]`; `[S1, S3]` -> `[(\"S1\", None), (\"S3\", None)]`." | kind=entity | source=backend/services/agent/reflection.py:L218 | neighbors=[_parse_citations()] | lang=en
- "agent_reflection_rationale_229": "Two indexes: by marker, and by (marker, page).      A marker names a paper, so i" | kind=entity | source=backend/services/agent/reflection.py:L229 | neighbors=[_index_evidence()] | lang=en
- "agent_reflection_rationale_252": "Map claim citations onto the exact passages they name.      Returns `(passages," | kind=entity | source=backend/services/agent/reflection.py:L252 | neighbors=[_resolve()] | lang=en
- "agent_reflection_rationale_284": "Check `answer` against `evidence`; optionally strip unsupported claims." | kind=entity | source=backend/services/agent/reflection.py:L284 | neighbors=[verify()] | lang=en
- "agent_reflection_rationale_41": "True when `text` contains no section headings.      Exposed so the review assemb" | kind=entity | source=backend/services/agent/reflection.py:L41 | neighbors=[is_heading_free()] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Agentic-Ai\Agentic-AI\.engram\description-instructions\batch-014.json

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
