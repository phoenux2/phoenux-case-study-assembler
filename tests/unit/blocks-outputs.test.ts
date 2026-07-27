import { describe, expect, it } from "vitest";

import { assembleDraftBlocks } from "@/lib/blocks/assemble";
import {
  assembleOutputPayload,
  canPublicExport,
  validatePublicExport,
} from "@/lib/blocks/outputs";
import type { Answer, Question } from "@/lib/db/question-types";
import type { Asset, Project, Source } from "@/lib/db/types";
import type { Claim, ContentBlock, Evidence } from "@/lib/db/block-types";

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

function asset(overrides: Partial<Asset> & Pick<Asset, "id" | "title">): Asset {
  return {
    project_id: "p1",
    source_id: null,
    uploaded_by: "u1",
    filename: "x.png",
    mime_type: "image/png",
    storage_path: null,
    category: "screenshot",
    phase: "unknown",
    permission: "public",
    quality: "unreviewed",
    description: null,
    caption: null,
    relationships: [],
    annotations: [],
    confidence: "medium",
    approval: "approved",
    provenance: { method: "user" },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
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
      asset({
        id: "asset-blocked",
        title: "Confidential",
        permission: "blocked",
        approval: "draft",
      }),
    ];

    const { validation } = assembleOutputPayload({
      title: project.title,
      outputType: "website",
      blocks,
      claims: [] as Claim[],
      assets,
      project,
    });

    expect(canPublicExport(validation)).toBe(false);
    expect(validation.errors.some((error) => error.includes("Blocked asset"))).toBe(
      true,
    );
  });

  it("blocks export when referenced assets are internal or unapproved", () => {
    const validation = validatePublicExport({
      project,
      blocks: [
        {
          ...blocks[0],
          body: { text: "Users abandoned checkout", asset_ids: ["a1"] },
        },
      ],
      claims: [],
      assets: [
        asset({
          id: "a1",
          title: "Internal shot",
          permission: "internal",
          approval: "draft",
        }),
      ],
    });

    expect(validation.ok).toBe(false);
    expect(
      validation.errors.some((error) => error.includes("Internal asset")),
    ).toBe(true);
    expect(
      validation.errors.some((error) => error.includes("must be approved")),
    ).toBe(true);
  });

  it("blocks approved claims that lack evidence or unsupported metrics", () => {
    const claims: Claim[] = [
      {
        id: "c1",
        project_id: "p1",
        claim_text: "Checkout completion +18%",
        confidence: "high",
        approval: "approved",
        provenance: { method: "user" },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const missingEvidence = validatePublicExport({
      project,
      blocks: [{ ...blocks[0], body: { text: "Users abandoned checkout" } }],
      claims,
      assets: [],
      evidence: [],
    });
    expect(missingEvidence.ok).toBe(false);
    expect(
      missingEvidence.errors.some((error) => error.includes("lacks evidence")),
    ).toBe(true);

    const weakEvidence: Evidence[] = [
      {
        id: "e1",
        claim_id: "c1",
        source_id: "s1",
        asset_id: null,
        summary: "Users liked the redesign",
        confidence: "medium",
        approval: "approved",
        provenance: { method: "user" },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    const unsupportedMetric = validatePublicExport({
      project,
      blocks: [{ ...blocks[0], body: { text: "Users abandoned checkout" } }],
      claims,
      assets: [],
      evidence: weakEvidence,
    });
    expect(unsupportedMetric.ok).toBe(false);
    expect(
      unsupportedMetric.errors.some((error) =>
        error.includes("not grounded in evidence"),
      ),
    ).toBe(true);
  });

  it("allows export when assets and metric claims are fully gated", () => {
    const claims: Claim[] = [
      {
        id: "c1",
        project_id: "p1",
        claim_text: "Checkout completion +18%",
        confidence: "high",
        approval: "approved",
        provenance: { method: "user" },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    const evidence: Evidence[] = [
      {
        id: "e1",
        claim_id: "c1",
        source_id: "s1",
        asset_id: null,
        summary: "Analytics export showed checkout completion +18%",
        confidence: "high",
        approval: "approved",
        provenance: { method: "user" },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    const assets = [
      asset({
        id: "a-public",
        title: "Public before",
        permission: "public",
        approval: "approved",
      }),
    ];

    const { payload, validation } = assembleOutputPayload({
      title: project.title,
      outputType: "website",
      blocks: [
        {
          ...blocks[0],
          body: {
            text: "Users abandoned checkout",
            asset_ids: ["a-public"],
          },
        },
      ],
      claims,
      assets,
      evidence,
      project,
    });

    expect(canPublicExport(validation)).toBe(true);
    expect(payload.sections.some((section) => section.heading === "Supported claims")).toBe(
      true,
    );
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
      project,
    });

    expect(validation.ok).toBe(true);
    expect(payload.sections).toHaveLength(1);
    expect(payload.sections[0]?.body).toContain("abandoned");
  });
});
