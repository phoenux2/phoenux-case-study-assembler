import { describe, expect, it } from "vitest";

import type { Asset, Project, Source } from "@/lib/db/types";
import type { Answer } from "@/lib/db/question-types";
import {
  coverageScore,
  evaluateCoverage,
  type CoverageContext,
} from "@/lib/questions/coverage";
import { parseAnswerFromFormData } from "@/lib/services/questions";
import type { Question } from "@/lib/db/question-types";

function baseProject(): Project {
  return {
    id: "p1",
    owner_id: "u1",
    title: "Test",
    client_name: null,
    summary: null,
    status: "active",
    confidence: "unknown",
    approval: "draft",
    provenance: { method: "user" },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function ctx(partial: Partial<CoverageContext> = {}): CoverageContext {
  return {
    project: baseProject(),
    sources: [],
    assets: [],
    answersByField: new Map(),
    ...partial,
  };
}

describe("evaluateCoverage", () => {
  it("starts with critical gaps and no giant form", () => {
    const result = evaluateCoverage(ctx());
    expect(result.gaps[0]?.field_key).toBe("problem");
    expect(result.gaps.some((gap) => gap.field_key === "problem")).toBe(true);
    expect(result.applicable.length).toBeGreaterThan(0);
    expect(result.answered).toHaveLength(0);
  });

  it("only asks outcome_metric after measurable outcome is true", () => {
    const withoutMetric = evaluateCoverage(ctx());
    expect(
      withoutMetric.gaps.some((gap) => gap.field_key === "outcome_metric"),
    ).toBe(false);

    const answersByField = new Map<string, Answer>([
      [
        "has_measurable_outcome",
        {
          id: "a1",
          question_id: "q1",
          project_id: "p1",
          answered_by: "u1",
          value: { boolean: true },
          confidence: "high",
          approval: "draft",
          provenance: { method: "user" },
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    ]);

    const withFlag = evaluateCoverage(ctx({ answersByField }));
    expect(
      withFlag.gaps.some((gap) => gap.field_key === "outcome_metric"),
    ).toBe(true);
  });

  it("requires assets before visual questions apply", () => {
    const noAssets = evaluateCoverage(ctx());
    expect(
      noAssets.applicable.some((field) => field.field_key === "primary_asset"),
    ).toBe(false);

    const assets: Asset[] = [
      {
        id: "asset-1",
        project_id: "p1",
        source_id: null,
        uploaded_by: "u1",
        title: "Dashboard",
        filename: "dash.png",
        mime_type: "image/png",
        storage_path: null,
        category: "screenshot",
        phase: "unknown",
        permission: "internal",
        quality: "unreviewed",
        description: null,
        caption: null,
        relationships: [],
        annotations: [],
        confidence: "medium",
        approval: "draft",
        provenance: { method: "user" },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const withAssets = evaluateCoverage(ctx({ assets }));
    expect(
      withAssets.applicable.some((field) => field.field_key === "primary_asset"),
    ).toBe(true);
    expect(
      withAssets.gaps.some((gap) => gap.field_key === "export_permission"),
    ).toBe(true);
  });

  it("keeps export_permission in the total after permission is answered", () => {
    const asset = {
      id: "asset-1",
      project_id: "p1",
      source_id: null,
      uploaded_by: "u1",
      title: "Dashboard",
      filename: "dash.png",
      mime_type: "image/png",
      storage_path: null,
      category: "screenshot",
      phase: "unknown" as const,
      permission: "restricted" as const,
      quality: "unreviewed" as const,
      description: null,
      caption: null,
      relationships: [],
      annotations: [],
      confidence: "medium" as const,
      approval: "draft" as const,
      provenance: { method: "user" as const },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    const answersByField = new Map<string, Answer>([
      [
        "export_permission",
        {
          id: "a-perm",
          question_id: "q-perm",
          project_id: "p1",
          answered_by: "u1",
          value: { permission: "restricted", selected: ["restricted"] },
          confidence: "high",
          approval: "draft",
          provenance: { method: "user" },
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    ]);

    const result = evaluateCoverage(
      ctx({ assets: [asset], answersByField }),
    );
    expect(
      result.applicable.some((field) => field.field_key === "export_permission"),
    ).toBe(true);
    expect(
      result.answered.some((field) => field.field_key === "export_permission"),
    ).toBe(true);
  });

  it("explains why a gap exists using available evidence", () => {
    const sources: Source[] = [
      {
        id: "s1",
        project_id: "p1",
        uploaded_by: "u1",
        source_type: "text",
        title: "Notes",
        filename: null,
        mime_type: null,
        storage_path: null,
        content_text: "Kickoff",
        content_summary: "Kickoff",
        confidence: "medium",
        approval: "draft",
        provenance: { method: "user" },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    const result = evaluateCoverage(ctx({ sources }));
    const problem = result.gaps.find((gap) => gap.field_key === "problem");
    expect(problem?.reason).toContain("source");
  });
});

describe("coverageScore", () => {
  it("returns 1 when nothing applies", () => {
    expect(coverageScore(0, 0)).toBe(1);
  });

  it("returns a rounded ratio", () => {
    expect(coverageScore(1, 4)).toBe(0.25);
  });
});

describe("parseAnswerFromFormData", () => {
  const question = (type: Question["question_type"]): Question => ({
    id: "q1",
    project_id: "p1",
    field_key: "problem",
    question_type: type,
    prompt: "Prompt",
    why: "Why",
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
    status: "open",
    confidence: "unknown",
    approval: "draft",
    provenance: { method: "deterministic" },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  });

  it("parses long text", () => {
    const formData = new FormData();
    formData.set("text", "Checkout drop-off");
    const parsed = parseAnswerFromFormData(question("long_text"), formData);
    expect(parsed).toMatchObject({
      value: { text: "Checkout drop-off" },
    });
  });

  it("rejects identical before/after assets", () => {
    const formData = new FormData();
    formData.set("before_asset_id", "a1");
    formData.set("after_asset_id", "a1");
    const parsed = parseAnswerFromFormData(question("before_after"), formData);
    expect(parsed).toEqual({
      error: "Before and after must be different assets",
    });
  });
});
