import { createHash } from "crypto";

export type PromptId =
  | "extraction"
  | "gap-detection"
  | "question-refinement"
  | "claim-review"
  | "editorial"
  | "compression"
  | "vision";

export type PromptDefinition = {
  id: PromptId;
  version: string;
  task: string;
  template: string;
};

/**
 * Canonical prompt registry — IDs/versions match docs/PROMPTS.md.
 * Business logic references these IDs; it does not embed ad-hoc prompts.
 */
export const PROMPT_REGISTRY: Record<PromptId, PromptDefinition> = {
  extraction: {
    id: "extraction",
    version: "v1",
    task: "Extract structured facts from sources",
    template: `You extract structured facts from project source material.

Rules:
- Output only information present in or directly implied by the source.
- Do not invent metrics, results, or client names.
- Assign confidence: high | medium | low.
- Return JSON matching the extraction output schema.

Input:
{{content_summary}}

Existing facts (do not duplicate):
{{existing_facts}}`,
  },
  "gap-detection": {
    id: "gap-detection",
    version: "v1",
    task: "Identify missing information for coverage",
    template: `You identify missing information needed to complete a project case study.

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
{{content_blocks}}`,
  },
  "question-refinement": {
    id: "question-refinement",
    version: "v1",
    task: "Turn gaps into user-facing questions",
    template: `You turn missing-information gaps into user-facing questions.

Rules:
- Every question must explain WHY it is being asked.
- Prefer pairing questions with relevant images when assets exist.
- One question per gap when possible.
- Do not ask for information already in structured facts.
- Return JSON matching the question refinement output schema.

Gaps:
{{gaps}}

Related assets:
{{related_assets}}`,
  },
  "claim-review": {
    id: "claim-review",
    version: "v1",
    task: "Validate claims against evidence",
    template: `You review whether a claim is supported by evidence.

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
{{permission_context}}`,
  },
  editorial: {
    id: "editorial",
    version: "v1",
    task: "Polish approved blocks for a target output",
    template: `You polish approved content blocks into platform-ready narrative.

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
{{style_guide}}`,
  },
  compression: {
    id: "compression",
    version: "v1",
    task: "Summarize context for token-efficient AI calls",
    template: `You compress project context for a specific downstream AI task.

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
{{max_tokens}}`,
  },
  vision: {
    id: "vision",
    version: "v1",
    task: "Analyze one image asset on demand",
    template: `You analyze a single project image asset.

Rules:
- Use only provided metadata and any attached summary.
- Do not invent metrics, research, or outcomes.
- Suggest category/phase/description only when grounded.
- Return JSON matching the vision output schema.

Asset metadata:
{{asset_metadata}}`,
  },
};

export function renderPrompt(
  id: PromptId,
  vars: Record<string, string>,
): { definition: PromptDefinition; prompt: string } {
  const definition = PROMPT_REGISTRY[id];
  let prompt = definition.template;
  for (const [key, value] of Object.entries(vars)) {
    prompt = prompt.replaceAll(`{{${key}}}`, value);
  }
  return { definition, prompt };
}

export function hashPromptInput(
  promptId: PromptId,
  version: string,
  input: unknown,
): string {
  return createHash("sha256")
    .update(promptId)
    .update(version)
    .update(JSON.stringify(input))
    .digest("hex");
}
