# AI Prompts

## Purpose

This file is the **single source of truth** for every AI prompt used in Phoenux Case Study Assembler.

Prompts live here—not scattered as string literals in source code—because:

- **Prompt history** — Each version is named and retained so changes are traceable.
- **A/B testing** — Compare `Extraction v1` vs `Extraction v2` without code churn.
- **Cleaner reviews** — Editorial and safety changes are reviewed in one document.
- **Lower maintenance** — One place to update when models, schemas, or policies change.
- **Consistent AI behaviour** — All services reference the same canonical prompt definitions.

For an AI-heavy application, this document is as important as `DATABASE.md`. The AI layer is a first-class part of the architecture, not an implementation detail buried in the codebase.

Implementation code should **reference** prompt IDs and versions (e.g. `extraction@v1`) and load templates from this spec or from a generated registry derived from it—never embed ad-hoc prompt text in business logic.

See also: `AI_PIPELINE.md`, `AGENTS.md`, `SECURITY.md`.

---

## Versioning Rules

1. **Never edit a published version in place.** Create a new version (`v2`, `v3`, …) when behaviour, schema, or safety requirements change.
2. **One task per prompt.** Each prompt does exactly one job with one input schema and one output schema.
3. **Version naming:** `{TaskName} v{N}` (e.g. `Extraction v1`, `Gap Detection v2`).
4. **Deprecation:** Mark old versions as `deprecated` with a replacement pointer; keep them in this file for audit history.
5. **Active version:** Document which version each environment uses in deployment config—not in this file alone.
6. **Changelog:** Each new version includes a short `Changes from previous` note.

---

## Prompt Registry

| ID | Task | Active version | Status |
|----|------|----------------|--------|
| `extraction` | Extract structured facts from sources | v1 | draft |
| `gap-detection` | Identify missing information for coverage | v1 | draft |
| `question-refinement` | Turn gaps into user-facing questions | v1 | draft |
| `claim-review` | Validate claims against evidence | v1 | draft |
| `editorial` | Polish approved blocks for a target output | v1 | draft |
| `compression` | Summarize context for token-efficient AI calls | v1 | draft |

---

## Extraction v1

**Task:** Parse uploaded or pasted source material and extract structured facts without editorial invention.

### Input schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `project_id` | string | Target project |
| `source_id` | string | Source record being processed |
| `source_type` | enum | `file`, `text`, `url`, `email` |
| `content_summary` | string | Deterministic pre-parse summary (not raw file) |
| `existing_facts` | array | Known facts to avoid duplication |

### Output schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `facts` | array | Structured fact objects with `key`, `value`, `confidence` |
| `entities` | array | People, products, dates, metrics mentioned |
| `asset_references` | array | Links to assets or filenames cited in source |
| `unsupported_claims` | array | Statements that cannot be grounded in source |

### Prompt template

```
[PLACEHOLDER — Extraction v1]

You extract structured facts from project source material.

Rules:
- Output only information present in or directly implied by the source.
- Do not invent metrics, results, or client names.
- Assign confidence: high | medium | low.
- Return JSON matching the extraction output schema.

Input:
{{content_summary}}

Existing facts (do not duplicate):
{{existing_facts}}
```

### Changes from previous

Initial version.

---

## Gap Detection v1

**Task:** Compare structured project data against coverage requirements and list missing information.

### Input schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `project_id` | string | Target project |
| `coverage_model` | object | Required fields and block types for this project |
| `structured_facts` | array | Current facts in database |
| `content_blocks` | array | Existing approved blocks |
| `assets` | array | Asset metadata summaries |

### Output schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `gaps` | array | Missing items with `category`, `field`, `severity` |
| `coverage_score` | number | 0–1 deterministic coverage estimate |
| `blocked_outputs` | array | Output types that cannot be generated yet |

### Prompt template

```
[PLACEHOLDER — Gap Detection v1]

You identify missing information needed to complete a project case study.

Rules:
- Compare structured facts and blocks against the coverage model.
- Do not suggest questions yet—only list gaps.
- Severity: critical | important | optional.
- Return JSON matching the gap detection output schema.

Coverage model:
{{coverage_model}}

Current facts:
{{structured_facts}}

Current blocks:
{{content_blocks}}
```

### Changes from previous

Initial version.

---

## Question Refinement v1

**Task:** Convert gap records into clear, contextual questions for the user—never a giant form.

### Input schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `project_id` | string | Target project |
| `gaps` | array | Output from gap detection |
| `related_assets` | array | Asset summaries that may pair with questions |
| `prior_answers` | array | Recent answers for tone and deduplication |

### Output schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `questions` | array | Question objects with `type`, `text`, `why`, `asset_ids` |
| `question_order` | array | Recommended presentation order |

Supported question types: `boolean`, `single_select`, `multiple_select`, `short_text`, `long_text`, `number`, `asset_selection`, `text_image`, `before_after`, `confidence`, `permission`.

### Prompt template

```
[PLACEHOLDER — Question Refinement v1]

You turn missing-information gaps into user-facing questions.

Rules:
- Every question must explain WHY it is being asked.
- Prefer pairing questions with relevant images when assets exist.
- One question per gap when possible.
- Do not ask for information already in structured facts.
- Return JSON matching the question refinement output schema.

Gaps:
{{gaps}}

Related assets:
{{related_assets}}
```

### Changes from previous

Initial version.

---

## Claim Review v1

**Task:** Evaluate whether a claim is supported by linked evidence before approval or export.

### Input schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `claim_id` | string | Claim under review |
| `claim_text` | string | The claim statement |
| `evidence` | array | Evidence records with source summaries |
| `permission_context` | object | Client and asset permission flags |

### Output schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `verdict` | enum | `supported`, `partially_supported`, `unsupported`, `blocked` |
| `reasoning` | string | Brief audit trail |
| `missing_evidence` | array | What would be needed to support the claim |
| `permission_issues` | array | Export or confidentiality blockers |

### Prompt template

```
[PLACEHOLDER — Claim Review v1]

You review whether a claim is supported by evidence.

Rules:
- A claim must be grounded in provided evidence.
- Flag unsupported metrics and confidential client references.
- Never approve blocked permission contexts.
- Return JSON matching the claim review output schema.

Claim:
{{claim_text}}

Evidence:
{{evidence}}

Permission context:
{{permission_context}}
```

### Changes from previous

Initial version.

---

## Editorial v1

**Task:** Polish approved content blocks into narrative text for a specific output format—without adding new facts.

### Input schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `output_type` | enum | `website`, `linkedin_carousel`, `linkedin_post`, `upwork`, `pdf` |
| `approved_blocks` | array | Content blocks with provenance |
| `approved_claims` | array | Claims already validated |
| `style_guide` | object | Tone, length, platform constraints |

### Output schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `sections` | array | Platform-specific sections or slides |
| `block_map` | object | Maps output sections to source block IDs |
| `editorial_notes` | array | Non-exportable notes for human review |

### Prompt template

```
[PLACEHOLDER — Editorial v1]

You polish approved content blocks into platform-ready narrative.

Rules:
- Use only approved blocks and claims—do not invent information.
- Preserve provenance mapping for every section.
- Match output_type constraints (length, slide count, tone).
- Return JSON matching the editorial output schema.

Output type:
{{output_type}}

Approved blocks:
{{approved_blocks}}

Style guide:
{{style_guide}}
```

### Changes from previous

Initial version.

---

## Compression v1

**Task:** Summarize project context for downstream AI calls to minimize token usage.

### Input schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `purpose` | enum | Which downstream task will consume this summary |
| `facts` | array | Structured facts |
| `blocks` | array | Content block summaries |
| `assets` | array | Asset metadata (not images) |
| `max_tokens` | number | Target summary length budget |

### Output schema (summary)

| Field | Type | Description |
|-------|------|-------------|
| `summary` | string | Compressed context for the target task |
| `included_ids` | array | Fact, block, and asset IDs retained in summary |
| `omitted_ids` | array | IDs dropped due to budget—with reason |

### Prompt template

```
[PLACEHOLDER — Compression v1]

You compress project context for a specific downstream AI task.

Rules:
- Preserve facts critical to the stated purpose.
- Never drop permission or approval metadata.
- Do not add interpretation—summarize only.
- Stay within max_tokens budget.
- Return JSON matching the compression output schema.

Purpose:
{{purpose}}

Facts:
{{facts}}

Max tokens:
{{max_tokens}}
```

### Changes from previous

Initial version.

---

## A/B Testing & Reviews

- **A/B testing:** Run two prompt versions against the same fixture inputs; compare output schema validity, fact fidelity, and human review scores. Record results in PR or experiment notes—not by overwriting versions here.
- **Reviews:** Prompt changes require the same scrutiny as schema changes. Security-sensitive prompts (`claim-review`, `editorial`) need explicit approval before activation.
- **Consistent behaviour:** All services must declare which prompt ID and version they invoke. Drift between services using different unversioned strings is a defect.

---

## Implementation Notes

- Cache AI responses keyed by `(prompt_id, version, input_hash)`.
- Raw project files must not be re-sent on every call—use compression summaries.
- When AI is disabled, features that depend on these prompts must degrade gracefully (manual entry, deterministic fallbacks).
