import { describe, expect, it } from "vitest";

import { assembleDraftBlocks } from "@/lib/blocks/assemble";
import {
  assembleOutputPayload,
  canPublicExport,
} from "@/lib/blocks/outputs";
import type { Answer, Question } from "@/lib/db/question-types";
import type { Asset, Project, Source } from "@/lib/db/types";
import type { Claim, ContentBlock } from "@/lib/db/block-types";

const project: Project = {
  id: "p1",
  owner_id: "u1",
  title: "Checkout redesign",
  client_name: "Acme",
  summary: "Reduce abandonment",
  status: "active",
  confidence: "medium",
  approval: "draft",
  provenance: { method: "user" },
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function answer(field: string, value: Answer["value"]): [string, Answer] {
  return [
    field,
    {
      id: `a-${field}`,
      question_id: `q-${field}`,
      project_id: "p1",
      answered_by: "u1",
      value,
      confidence: "high",
      approval: "draft",
      provenance: { method: "user" },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ];
}

describe("assembleDraftBlocks", () => {
  it("builds challenge/role/outcome blocks from answers without inventing metrics", () => {
    const answersByField = new Map<string, Answer>([
      answer("problem", { text: "Users abandoned checkout" }),
      answer("role", { selected: ["product_designer"] }),
      answer("audience", { text: "Returning shoppers" }),
      answer("outcome_metric", { text: "Checkout completion +18%" }),
    ]);

    const draft = assembleDraftBlocks({
      project,
      sources: [] as Source[],
      assets: [] as Asset[],
      questions: [] as Question[],
      answers: [...answersByField.values()],
      answersByField,
    });

    expect(draft.blocks.some((block) => block.block_type === "challenge")).toBe(
      true,
    );
    expect(draft.blocks.find((b) => b.block_type === "role")?.body.text).toBe(
      "Product designer",
    );
    expect(draft.claims[0]?.claim_text).toBe("Checkout completion +18%");
  });
});

describe("assembleOutputPayload", () => {
  const blocks: ContentBlock[] = [
    {
      id: "b1",
      project_id: "p1",
      block_type: "challenge",
      title: "Challenge",
      body: { text: "Users abandoned checkout", asset_ids: ["asset-blocked"] },
      confidence: "high",
      approval: "approved",
      provenance: { method: "deterministic" },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ];

  it("blocks export when a blocked asset is referenced", () => {
    const assets: Asset[] = [
      {
        id: "asset-blocked",
        project_id: "p1",
        source_id: null,
        uploaded_by: "u1",
        title: "Confidential",
        filename: "x.png",
        mime_type: "image/png",
        storage_path: null,
        category: "screenshot",
        phase: "unknown",
        permission: "blocked",
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

    const { validation } = assembleOutputPayload({
      title: project.title,
      outputType: "website",
      blocks,
      claims: [] as Claim[],
      assets,
    });

    expect(canPublicExport(validation)).toBe(false);
    expect(validation.errors[0]).toContain("Blocked asset");
  });

  it("assembles linkedin post from a single approved insight", () => {
    const safeBlocks: ContentBlock[] = [
      {
        ...blocks[0],
        body: { text: "Users abandoned checkout" },
      },
    ];
    const { payload, validation } = assembleOutputPayload({
      title: project.title,
      outputType: "linkedin_post",
      blocks: safeBlocks,
      claims: [],
      assets: [],
    });

    expect(validation.ok).toBe(true);
    expect(payload.sections).toHaveLength(1);
    expect(payload.sections[0]?.body).toContain("abandoned");
  });
});
