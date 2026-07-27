import type { Answer, Question } from "@/lib/db/question-types";
import type { Asset, Project, Source } from "@/lib/db/types";
import type {
  Claim,
  ContentBlock,
  ContentBlockBody,
  ContentBlockType,
} from "@/lib/db/block-types";

export type AssemblyContext = {
  project: Project;
  sources: Source[];
  assets: Asset[];
  questions: Question[];
  answers: Answer[];
  answersByField: Map<string, Answer>;
};

export type AssembledDraft = {
  blocks: Array<{
    block_type: ContentBlockType;
    title: string;
    body: ContentBlockBody;
    confidence: ContentBlock["confidence"];
  }>;
  claims: Array<{
    claim_text: string;
    confidence: Claim["confidence"];
    evidence_summary: string;
    source_id?: string | null;
    asset_id?: string | null;
  }>;
};

function textOf(ctx: AssemblyContext, fieldKey: string): string | null {
  return ctx.answersByField.get(fieldKey)?.value.text?.trim() || null;
}

function selectedOf(ctx: AssemblyContext, fieldKey: string): string | null {
  return ctx.answersByField.get(fieldKey)?.value.selected?.[0] ?? null;
}

function roleLabel(value: string | null): string | null {
  if (!value) return null;
  const labels: Record<string, string> = {
    product_designer: "Product designer",
    ux_researcher: "UX researcher",
    engineer: "Engineer",
    product_manager: "Product manager",
    founding_team: "Founding / leadership",
    agency_lead: "Agency / studio lead",
    other: "Other",
  };
  return labels[value] ?? value;
}

/**
 * Deterministically assemble reusable content blocks from structured answers.
 * Never invents metrics, research, or results.
 */
export function assembleDraftBlocks(ctx: AssemblyContext): AssembledDraft {
  const blocks: AssembledDraft["blocks"] = [];
  const claims: AssembledDraft["claims"] = [];

  const problem = textOf(ctx, "problem");
  const audience = textOf(ctx, "audience");
  const role = roleLabel(selectedOf(ctx, "role"));
  const outcomeMetric = textOf(ctx, "outcome_metric");
  const problemVisual = ctx.answersByField.get("problem_visual");
  const primaryAsset = ctx.answersByField.get("primary_asset");
  const beforeAfter = ctx.answersByField.get("before_after");

  blocks.push({
    block_type: "project_snapshot",
    title: "Project snapshot",
    body: {
      text: [
        ctx.project.title,
        ctx.project.client_name ? `Client: ${ctx.project.client_name}` : null,
        ctx.project.summary,
      ]
        .filter(Boolean)
        .join("\n"),
      answer_ids: [],
    },
    confidence: ctx.project.confidence,
  });

  if (audience || ctx.project.summary) {
    blocks.push({
      block_type: "context",
      title: "Context",
      body: {
        text: [audience ? `Audience: ${audience}` : null, ctx.project.summary]
          .filter(Boolean)
          .join("\n"),
        answer_ids: [ctx.answersByField.get("audience")?.id].filter(
          Boolean,
        ) as string[],
      },
      confidence: "medium",
    });
  }

  if (problem) {
    blocks.push({
      block_type: "challenge",
      title: "Challenge",
      body: {
        text: problem,
        asset_ids: problemVisual?.value.asset_ids ?? [],
        answer_ids: [
          ctx.answersByField.get("problem")?.id,
          problemVisual?.id,
        ].filter(Boolean) as string[],
      },
      confidence: "high",
    });
  }

  if (role) {
    blocks.push({
      block_type: "role",
      title: "Role",
      body: {
        text: role,
        answer_ids: [ctx.answersByField.get("role")?.id].filter(
          Boolean,
        ) as string[],
      },
      confidence: "high",
    });
  }

  if (beforeAfter?.value.before_asset_id && beforeAfter.value.after_asset_id) {
    blocks.push({
      block_type: "before_after",
      title: "Before / after",
      body: {
        text: beforeAfter.value.text ?? undefined,
        before_asset_id: beforeAfter.value.before_asset_id,
        after_asset_id: beforeAfter.value.after_asset_id,
        asset_ids: [
          beforeAfter.value.before_asset_id,
          beforeAfter.value.after_asset_id,
        ],
        answer_ids: [beforeAfter.id],
      },
      confidence: "medium",
    });
  }

  if (primaryAsset?.value.asset_ids?.length) {
    blocks.push({
      block_type: "solution",
      title: "Solution",
      body: {
        text: problem
          ? `Primary solution visual for: ${problem}`
          : "Primary solution visual",
        asset_ids: primaryAsset.value.asset_ids,
        answer_ids: [primaryAsset.id],
      },
      confidence: "medium",
    });
  }

  if (ctx.assets.length > 0) {
    blocks.push({
      block_type: "gallery",
      title: "Gallery",
      body: {
        asset_ids: ctx.assets
          .filter((asset) => asset.permission !== "blocked")
          .map((asset) => asset.id),
      },
      confidence: "medium",
    });
  }

  if (outcomeMetric) {
    blocks.push({
      block_type: "outcome",
      title: "Outcome",
      body: {
        text: outcomeMetric,
        metric: outcomeMetric,
        answer_ids: [
          ctx.answersByField.get("outcome_metric")?.id,
        ].filter(Boolean) as string[],
      },
      confidence: "medium",
    });

    claims.push({
      claim_text: outcomeMetric,
      confidence: "medium",
      evidence_summary:
        ctx.sources[0]?.content_summary ||
        "User-supplied measurable outcome — requires evidence review before export.",
      source_id: ctx.sources[0]?.id ?? null,
      asset_id: primaryAsset?.value.asset_ids?.[0] ?? null,
    });
  }

  return { blocks, claims };
}
