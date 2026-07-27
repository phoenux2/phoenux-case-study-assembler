import type {
  ClaimReviewResult,
  EditorialResult,
  ExtractionResult,
  GapDetectionResult,
  QuestionRefinementResult,
} from "@/lib/db/ai-types";
import type { CoverageGap } from "@/lib/db/question-types";
import type { ContentBlock } from "@/lib/db/block-types";
import { getCoverageField } from "@/lib/questions/coverage";

const METRIC_PATTERN =
  /(?:\+|-)?\d+(?:\.\d+)?%|\b\d+\s*(?:users|customers|signups|revenue|conversion)\b/i;

/**
 * Deterministic extraction — never invents. Only lifts explicit cues from summaries/text.
 */
export function deterministicExtraction(input: {
  contentSummary: string;
  contentText?: string | null;
  existingFactKeys: string[];
}): ExtractionResult {
  const text = `${input.contentSummary}\n${input.contentText ?? ""}`.trim();
  const facts: ExtractionResult["facts"] = [];
  const entities: ExtractionResult["entities"] = [];
  const unsupported_claims: string[] = [];
  const existing = new Set(input.existingFactKeys);

  const clientMatch = text.match(/\bclient[:\s]+([A-Z][\w\s&.-]{1,40})/i);
  if (clientMatch?.[1] && !existing.has("client_name")) {
    facts.push({
      key: "client_name",
      value: clientMatch[1].trim(),
      confidence: "medium",
    });
    entities.push({ type: "organization", value: clientMatch[1].trim() });
  }

  const problemMatch = text.match(
    /\b(problem|challenge|pain)[:\s]+(.{10,160})/i,
  );
  if (problemMatch?.[2] && !existing.has("problem")) {
    facts.push({
      key: "problem",
      value: problemMatch[2].trim().replace(/\s+/g, " "),
      confidence: "medium",
    });
  }

  const metricMatches = text.match(
    /\b[^.\n]{0,40}\d+(\.\d+)?%[^.\n]{0,40}/g,
  );
  if (metricMatches) {
    for (const snippet of metricMatches.slice(0, 3)) {
      const value = snippet.trim();
      if (!existing.has(`metric:${value}`)) {
        facts.push({
          key: "metric_mention",
          value,
          confidence: "low",
        });
        unsupported_claims.push(
          `Metric mention requires evidence review: ${value}`,
        );
      }
    }
  }

  const asset_references =
    text.match(/\b[\w-]+\.(png|jpg|jpeg|webp|pdf)\b/gi) ?? [];

  if (facts.length === 0 && text.length > 0) {
    facts.push({
      key: "source_summary",
      value: text.slice(0, 240),
      confidence: "low",
    });
  }

  return {
    facts,
    entities,
    asset_references: [...new Set(asset_references)],
    unsupported_claims,
  };
}

export function deterministicGapDetection(input: {
  gaps: CoverageGap[];
  coverageScore: number;
  hasApprovedBlocks: boolean;
}): GapDetectionResult {
  return {
    gaps: input.gaps.map((gap) => ({
      category: gap.severity,
      field: gap.field_key,
      severity: gap.severity,
      reason: gap.reason,
    })),
    coverage_score: input.coverageScore,
    blocked_outputs: input.hasApprovedBlocks
      ? []
      : ["website", "linkedin_carousel", "linkedin_post", "upwork", "pdf"],
  };
}

export function deterministicQuestionRefinement(input: {
  gaps: CoverageGap[];
  assetIds: string[];
}): QuestionRefinementResult {
  const questions = input.gaps.map((gap) => {
    const field = getCoverageField(gap.field_key);
    return {
      type: field?.question_type ?? "short_text",
      text: field?.prompt ?? `Provide: ${gap.field_key}`,
      why: gap.reason,
      field_key: gap.field_key,
      asset_ids:
        field?.question_type === "asset_selection" ||
        field?.question_type === "text_image" ||
        field?.question_type === "before_after"
          ? input.assetIds.slice(0, 3)
          : [],
    };
  });

  return {
    questions,
    question_order: questions.map((question) => question.field_key),
  };
}

export function deterministicClaimReview(input: {
  claimText: string;
  evidenceSummaries: string[];
  hasBlockedAssets: boolean;
}): ClaimReviewResult {
  if (input.hasBlockedAssets) {
    return {
      verdict: "blocked",
      reasoning: "Linked asset permission is blocked.",
      missing_evidence: [],
      permission_issues: ["Blocked asset linked to claim context"],
    };
  }

  if (input.evidenceSummaries.length === 0) {
    return {
      verdict: "unsupported",
      reasoning: "No evidence records are attached.",
      missing_evidence: ["Attach a source or asset that supports the claim"],
      permission_issues: [],
    };
  }

  const joined = input.evidenceSummaries.join(" ").toLowerCase();
  const claim = input.claimText.toLowerCase();
  const claimHasMetric = METRIC_PATTERN.test(input.claimText);
  const evidenceHasMetric = METRIC_PATTERN.test(joined);
  const overlap = claim
    .split(/\W+/)
    .filter((token) => token.length > 3)
    .some((token) => joined.includes(token));

  if (claimHasMetric && !evidenceHasMetric) {
    return {
      verdict: "unsupported",
      reasoning:
        "Claim includes a metric that is not present in attached evidence.",
      missing_evidence: ["Evidence containing the stated metric"],
      permission_issues: [],
    };
  }

  if (overlap) {
    return {
      verdict: claimHasMetric ? "partially_supported" : "supported",
      reasoning: claimHasMetric
        ? "Evidence overlaps the claim, but metric support should be confirmed manually."
        : "Evidence text overlaps the claim.",
      missing_evidence: claimHasMetric
        ? ["Confirm metric source document"]
        : [],
      permission_issues: [],
    };
  }

  return {
    verdict: "unsupported",
    reasoning: "Evidence does not clearly overlap the claim text.",
    missing_evidence: ["More specific supporting source excerpt"],
    permission_issues: [],
  };
}

export function deterministicEditorial(input: {
  outputType: string;
  blocks: ContentBlock[];
}): EditorialResult {
  const sections = input.blocks.map((block) => ({
    heading: block.title || block.block_type,
    body: (block.body.text || block.body.metric || "").trim(),
    block_ids: [block.id],
  }));

  const block_map: Record<string, string[]> = {};
  for (const section of sections) {
    block_map[section.heading] = section.block_ids;
  }

  const notes = [
    `Deterministic editorial pass for ${input.outputType}.`,
    "No new facts were introduced.",
  ];

  if (input.outputType === "linkedin_post" && sections.length > 1) {
    return {
      sections: sections.slice(0, 1),
      block_map: {
        [sections[0].heading]: sections[0].block_ids,
      },
      editorial_notes: [
        ...notes,
        "LinkedIn post limited to a single insight section.",
      ],
    };
  }

  return { sections, block_map, editorial_notes: notes };
}
