import type { Asset, Project, Source } from "@/lib/db/types";
import type {
  Answer,
  CoverageGap,
  QuestionOption,
  QuestionType,
} from "@/lib/db/question-types";

export type CoverageField = {
  field_key: string;
  severity: "critical" | "important" | "optional";
  question_type: QuestionType;
  prompt: string;
  why: (ctx: CoverageContext) => string;
  options?: QuestionOption[];
  isApplicable: (ctx: CoverageContext) => boolean;
  isSatisfied: (ctx: CoverageContext) => boolean;
};

export type CoverageContext = {
  project: Project;
  sources: Source[];
  assets: Asset[];
  answersByField: Map<string, Answer>;
};

export const COVERAGE_FIELDS: CoverageField[] = [
  {
    field_key: "problem",
    severity: "critical",
    question_type: "long_text",
    prompt: "What problem did this project solve?",
    why: (ctx) =>
      ctx.assets.length > 0
        ? `I found ${ctx.assets.length} image asset${ctx.assets.length === 1 ? "" : "s"}, but I don't know what problem they relate to.`
        : ctx.sources.length > 0
          ? `I have ${ctx.sources.length} source${ctx.sources.length === 1 ? "" : "s"}, but the core problem statement is still missing.`
          : "A case study needs a clear problem before anything else can be assembled.",
    isApplicable: () => true,
    isSatisfied: (ctx) => Boolean(getAnswerText(ctx, "problem")),
  },
  {
    field_key: "role",
    severity: "critical",
    question_type: "single_select",
    prompt: "What was your primary role?",
    why: () =>
      "Role framing changes how we write Challenge, Decision, and Outcome blocks.",
    options: [
      { value: "product_designer", label: "Product designer" },
      { value: "ux_researcher", label: "UX researcher" },
      { value: "engineer", label: "Engineer" },
      { value: "product_manager", label: "Product manager" },
      { value: "founding_team", label: "Founding / leadership" },
      { value: "agency_lead", label: "Agency / studio lead" },
      { value: "other", label: "Other" },
    ],
    isApplicable: () => true,
    isSatisfied: (ctx) => Boolean(getSelected(ctx, "role")[0]),
  },
  {
    field_key: "audience",
    severity: "important",
    question_type: "short_text",
    prompt: "Who was the primary audience or user?",
    why: () =>
      "Audience context keeps Challenge and Solution blocks from sounding generic.",
    isApplicable: () => true,
    isSatisfied: (ctx) => Boolean(getAnswerText(ctx, "audience")),
  },
  {
    field_key: "has_measurable_outcome",
    severity: "important",
    question_type: "boolean",
    prompt: "Do you have a measurable outcome for this project?",
    why: () =>
      "We only ask for metrics when they exist — invented numbers are never allowed.",
    isApplicable: () => true,
    isSatisfied: (ctx) => getAnswerBoolean(ctx, "has_measurable_outcome") !== null,
  },
  {
    field_key: "outcome_metric",
    severity: "important",
    question_type: "short_text",
    prompt: "What measurable outcome can you support with evidence?",
    why: () =>
      "You said there is a measurable outcome. We need the claim text before it can be reviewed.",
    isApplicable: (ctx) =>
      getAnswerBoolean(ctx, "has_measurable_outcome") === true,
    isSatisfied: (ctx) => Boolean(getAnswerText(ctx, "outcome_metric")),
  },
  {
    field_key: "primary_asset",
    severity: "important",
    question_type: "asset_selection",
    prompt: "Which image best represents the solution?",
    why: (ctx) =>
      `You uploaded ${ctx.assets.length} image${ctx.assets.length === 1 ? "" : "s"}. Pairing one as the primary solution visual unlocks gallery and outcome blocks.`,
    isApplicable: (ctx) => ctx.assets.length > 0,
    isSatisfied: (ctx) => getAssetIds(ctx, "primary_asset").length > 0,
  },
  {
    field_key: "problem_visual",
    severity: "important",
    question_type: "text_image",
    prompt: "What problem does this screen illustrate?",
    why: (ctx) =>
      ctx.assets.length > 0
        ? "I found screenshots but I don't know what problem they solved."
        : "Attach a before/problem visual and explain the issue.",
    isApplicable: (ctx) => ctx.assets.length > 0,
    isSatisfied: (ctx) =>
      Boolean(getAnswerText(ctx, "problem_visual")) &&
      getAssetIds(ctx, "problem_visual").length > 0,
  },
  {
    field_key: "before_after",
    severity: "optional",
    question_type: "before_after",
    prompt: "Pick a before and after pair that shows the change.",
    why: () =>
      "Before/after pairs are reusable across website, carousel, and PDF outputs.",
    isApplicable: (ctx) => ctx.assets.length >= 2,
    isSatisfied: (ctx) => {
      const answer = ctx.answersByField.get("before_after");
      return Boolean(
        answer?.value.before_asset_id && answer.value.after_asset_id,
      );
    },
  },
  {
    field_key: "export_permission",
    severity: "critical",
    question_type: "permission",
    prompt: "What is the strictest export permission for these assets?",
    why: (ctx) =>
      `${ctx.assets.length} asset${ctx.assets.length === 1 ? "" : "s"} still need an explicit permission decision before public export.`,
    options: [
      { value: "public", label: "Public — safe to publish" },
      { value: "internal", label: "Internal only" },
      { value: "restricted", label: "Restricted — named audiences only" },
      { value: "blocked", label: "Blocked — never export" },
    ],
    isApplicable: (ctx) =>
      ctx.assets.some((asset) => asset.permission === "internal"),
    isSatisfied: (ctx) =>
      getAnswerPermission(ctx, "export_permission") !== null ||
      ctx.assets.every((asset) => asset.permission !== "internal"),
  },
  {
    field_key: "overall_confidence",
    severity: "optional",
    question_type: "confidence",
    prompt: "How confident are you in this reconstruction so far?",
    why: () =>
      "Confidence stays attached to the project so exports can show review state.",
    options: [
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
    isApplicable: () => true,
    isSatisfied: (ctx) => getAnswerConfidence(ctx, "overall_confidence") !== null,
  },
];

function getAnswerText(ctx: CoverageContext, fieldKey: string): string | null {
  const text = ctx.answersByField.get(fieldKey)?.value.text?.trim();
  return text || null;
}

function getAnswerBoolean(
  ctx: CoverageContext,
  fieldKey: string,
): boolean | null {
  const value = ctx.answersByField.get(fieldKey)?.value.boolean;
  return typeof value === "boolean" ? value : null;
}

function getSelected(ctx: CoverageContext, fieldKey: string): string[] {
  return ctx.answersByField.get(fieldKey)?.value.selected ?? [];
}

function getAssetIds(ctx: CoverageContext, fieldKey: string): string[] {
  return ctx.answersByField.get(fieldKey)?.value.asset_ids ?? [];
}

function getAnswerPermission(
  ctx: CoverageContext,
  fieldKey: string,
): string | null {
  return ctx.answersByField.get(fieldKey)?.value.permission ?? null;
}

function getAnswerConfidence(
  ctx: CoverageContext,
  fieldKey: string,
): string | null {
  return ctx.answersByField.get(fieldKey)?.value.confidence ?? null;
}

export function evaluateCoverage(ctx: CoverageContext): {
  gaps: CoverageGap[];
  applicable: CoverageField[];
  answered: CoverageField[];
} {
  const applicable = COVERAGE_FIELDS.filter((field) => field.isApplicable(ctx));
  const gaps: CoverageGap[] = [];
  const answered: CoverageField[] = [];

  for (const field of applicable) {
    if (field.isSatisfied(ctx)) {
      answered.push(field);
    } else {
      gaps.push({
        field_key: field.field_key,
        severity: field.severity,
        reason: field.why(ctx),
      });
    }
  }

  return { gaps, applicable, answered };
}

export function coverageScore(answered: number, total: number): number {
  if (total === 0) return 1;
  return Number((answered / total).toFixed(2));
}

export function getCoverageField(fieldKey: string): CoverageField | undefined {
  return COVERAGE_FIELDS.find((field) => field.field_key === fieldKey);
}
