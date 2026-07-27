import { afterEach, describe, expect, it } from "vitest";

import {
  createLocalProject,
  createLocalSource,
  getLocalUserId,
  listLocalFacts,
  resetLocalDb,
} from "@/lib/local/store";
import { runExtraction } from "@/lib/services/ai-pipeline";

afterEach(async () => {
  await resetLocalDb();
});

describe("runExtraction integration", () => {
  it("persists deterministic facts from a text source", async () => {
    const userId = getLocalUserId();
    const project = await createLocalProject(userId, {
      title: "Onboarding",
    });
    await createLocalSource(userId, {
      project_id: project.id,
      source_type: "text",
      title: "Brief",
      content_text:
        "Problem: Users abandoned onboarding mid-flow. See wireframe.png.",
      content_summary:
        "Problem: Users abandoned onboarding mid-flow. See wireframe.png.",
    });

    const result = await runExtraction(project.id, userId);
    expect(result.meta.used_ai).toBe(false);
    expect(result.extraction.facts.length).toBeGreaterThan(0);

    const facts = await listLocalFacts(project.id);
    expect(facts.length).toBeGreaterThan(0);
    expect(facts.some((fact) => fact.key === "problem")).toBe(true);
  });
});
