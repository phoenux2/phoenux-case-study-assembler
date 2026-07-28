import { describe, expect, it } from "vitest";

import {
  decodeLocalDb,
  encodeLocalDb,
  usesCookieLocalStore,
} from "@/lib/local/store";

describe("cookie local store helpers", () => {
  it("round-trips a project through compressed encoding", () => {
    const encoded = encodeLocalDb({
      profiles: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          email: "local@phoenux.dev",
          display_name: "Local User",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      projects: [
        {
          id: "p1",
          owner_id: "00000000-0000-4000-8000-000000000001",
          title: "Phone smoke",
          client_name: null,
          summary: "Create then open",
          status: "active",
          confidence: "unknown",
          approval: "draft",
          provenance: { method: "user" },
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      sources: [],
      assets: [],
      questions: [],
      answers: [],
      answer_assets: [],
      content_blocks: [],
      claims: [],
      evidence: [],
      outputs: [],
      facts: [],
      knowledge_entries: [],
    });

    const decoded = decodeLocalDb(encoded);
    expect(decoded.projects[0]?.title).toBe("Phone smoke");
    expect(encoded.length).toBeGreaterThan(10);
  });

  it("does not use cookie backend outside Vercel", () => {
    expect(usesCookieLocalStore()).toBe(false);
  });
});
