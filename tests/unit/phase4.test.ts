import { describe, expect, it } from "vitest";

import {
  deterministicFigmaImport,
  deterministicVision,
  parseFigmaFileKey,
  retrieveFromKnowledge,
} from "@/lib/phase4/deterministic";
import type { Asset } from "@/lib/db/types";
import type { KnowledgeEntry } from "@/lib/db/phase4-types";

const asset: Asset = {
  id: "a1",
  project_id: "p1",
  source_id: null,
  uploaded_by: "u1",
  title: "Onboarding dashboard before",
  filename: "onboarding-dashboard-before.png",
  mime_type: "image/png",
  storage_path: null,
  category: null,
  phase: "unknown",
  permission: "internal",
  quality: "unreviewed",
  description: null,
  caption: null,
  relationships: [],
  annotations: [],
  confidence: "unknown",
  approval: "draft",
  provenance: { method: "user" },
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("vision deterministic", () => {
  it("extracts UI cues from metadata without inventing outcomes", () => {
    const analysis = deterministicVision(asset);
    expect(analysis.ui_elements).toEqual(
      expect.arrayContaining(["dashboard", "onboarding"]),
    );
    expect(analysis.phase).toBe("discovery");
    expect(analysis.description.toLowerCase()).not.toContain("increased revenue");
  });
});

describe("figma import helpers", () => {
  it("parses file keys from design URLs", () => {
    expect(
      parseFigmaFileKey("https://www.figma.com/design/AbCdEf12345/My-File"),
    ).toBe("AbCdEf12345");
    expect(parseFigmaFileKey("AbCdEf12345")).toBe("AbCdEf12345");
  });

  it("returns stub frames without API token", () => {
    const result = deterministicFigmaImport({ fileKey: "AbCdEf12345" });
    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.notes.join(" ")).toContain("FIGMA_ACCESS_TOKEN");
  });
});

describe("knowledge retrieval", () => {
  it("ranks overlapping entries", () => {
    const entries: KnowledgeEntry[] = [
      {
        id: "k1",
        project_id: "p1",
        kind: "fact",
        title: "problem",
        body: "Users abandoned onboarding mid-flow",
        tags: ["fact", "problem"],
        ref_id: "f1",
        confidence: "medium",
        provenance: { method: "deterministic" },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "k2",
        project_id: "p1",
        kind: "asset",
        title: "Pricing table",
        body: "Billing screenshot",
        tags: ["asset"],
        ref_id: "a2",
        confidence: "low",
        provenance: { method: "deterministic" },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const result = retrieveFromKnowledge({
      query: "onboarding problem",
      entries,
    });
    expect(result.hits[0]?.entry_id).toBe("k1");
    expect(result.hits[0]?.score).toBeGreaterThan(0);
  });
});
