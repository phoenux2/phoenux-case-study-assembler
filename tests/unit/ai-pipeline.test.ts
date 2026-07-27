import { describe, expect, it } from "vitest";

import {
  deterministicClaimReview,
  deterministicEditorial,
  deterministicExtraction,
  deterministicGapDetection,
  deterministicQuestionRefinement,
} from "@/lib/ai/deterministic";
import { hashPromptInput, renderPrompt } from "@/lib/ai/prompts";
import { isAiEnabled } from "@/lib/ai/config";
import type { ContentBlock } from "@/lib/db/block-types";

describe("prompt registry", () => {
  it("renders extraction@v1 without embedding ad-hoc business prompts", () => {
    const { definition, prompt } = renderPrompt("extraction", {
      content_summary: "Kickoff notes",
      existing_facts: "[]",
    });
    expect(definition.version).toBe("v1");
    expect(prompt).toContain("Kickoff notes");
    expect(prompt).not.toContain("{{content_summary}}");
  });

  it("hashes cache keys by prompt id/version/input", () => {
    const a = hashPromptInput("extraction", "v1", { x: 1 });
    const b = hashPromptInput("extraction", "v1", { x: 1 });
    const c = hashPromptInput("extraction", "v1", { x: 2 });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("deterministic extraction", () => {
  it("extracts explicit problem cues and never invents metrics", () => {
    const result = deterministicExtraction({
      contentSummary: "Problem: Users abandoned onboarding mid-flow.",
      contentText: "See wireframe.png for the before state.",
      existingFactKeys: [],
    });
    expect(result.facts.some((fact) => fact.key === "problem")).toBe(true);
    expect(result.asset_references).toContain("wireframe.png");
    expect(result.facts.every((fact) => fact.value.length > 0)).toBe(true);
  });
});

describe("deterministic gap + question refinement", () => {
  it("maps coverage gaps into why-backed questions", () => {
    const gaps = [
      {
        field_key: "problem",
        severity: "critical" as const,
        reason: "Problem statement missing",
      },
    ];
    const gapResult = deterministicGapDetection({
      gaps,
      coverageScore: 0.2,
      hasApprovedBlocks: false,
    });
    expect(gapResult.blocked_outputs).toContain("website");

    const questions = deterministicQuestionRefinement({
      gaps,
      assetIds: ["a1"],
    });
    expect(questions.questions[0]?.why).toContain("Problem");
    expect(questions.questions[0]?.text.length).toBeGreaterThan(0);
  });
});

describe("deterministic claim review", () => {
  it("rejects metrics not present in evidence", () => {
    const result = deterministicClaimReview({
      claimText: "Activation +22% after redesign",
      evidenceSummaries: ["We redesigned onboarding screens."],
      hasBlockedAssets: false,
    });
    expect(result.verdict).toBe("unsupported");
  });

  it("blocks when linked assets are blocked", () => {
    const result = deterministicClaimReview({
      claimText: "Improved clarity",
      evidenceSummaries: ["Screenshot attached"],
      hasBlockedAssets: true,
    });
    expect(result.verdict).toBe("blocked");
  });
});

describe("deterministic editorial", () => {
  it("does not invent content beyond approved blocks", () => {
    const blocks: ContentBlock[] = [
      {
        id: "b1",
        project_id: "p1",
        block_type: "challenge",
        title: "Challenge",
        body: { text: "Users abandoned onboarding" },
        confidence: "high",
        approval: "approved",
        provenance: { method: "deterministic" },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    const result = deterministicEditorial({
      outputType: "linkedin_post",
      blocks,
    });
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]?.body).toBe("Users abandoned onboarding");
    expect(result.editorial_notes.join(" ")).toContain("No new facts");
  });
});

describe("ai config", () => {
  it("defaults to disabled without keys", () => {
    expect(isAiEnabled()).toBe(false);
  });
});
