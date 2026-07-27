import { afterEach, describe, expect, it } from "vitest";

import {
  createLocalAsset,
  createLocalProject,
  createLocalSource,
  getLocalUserId,
  listLocalAssets,
  listLocalProjects,
  listLocalSources,
  resetLocalDb,
} from "@/lib/local/store";
import { summarizeText } from "@/lib/services/sources";
import { isImageMimeType } from "@/lib/services/assets";
import { createProjectSchema } from "@/lib/db/schemas";

afterEach(async () => {
  await resetLocalDb();
});

describe("createProjectSchema", () => {
  it("requires a title", () => {
    const result = createProjectSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid project", () => {
    const result = createProjectSchema.safeParse({
      title: "Checkout redesign",
      client_name: "Acme",
      summary: "Rebuild checkout",
    });
    expect(result.success).toBe(true);
  });
});

describe("summarizeText", () => {
  it("returns short text unchanged", () => {
    expect(summarizeText("Hello world")).toBe("Hello world");
  });

  it("truncates long text", () => {
    const long = "a".repeat(400);
    const summary = summarizeText(long, 50);
    expect(summary.length).toBeLessThanOrEqual(50);
    expect(summary.endsWith("…")).toBe(true);
  });
});

describe("isImageMimeType", () => {
  it("detects images", () => {
    expect(isImageMimeType("image/png")).toBe(true);
    expect(isImageMimeType("application/pdf")).toBe(false);
  });
});

describe("local store", () => {
  it("creates projects, sources, and image assets with provenance", async () => {
    const userId = getLocalUserId();
    const project = await createLocalProject(userId, {
      title: "Brand site",
      client_name: "Northwind",
    });

    expect(project.approval).toBe("draft");
    expect(project.provenance.method).toBe("user");

    const source = await createLocalSource(userId, {
      project_id: project.id,
      source_type: "text",
      title: "Brief",
      content_text: "We needed a clearer homepage.",
      content_summary: "We needed a clearer homepage.",
    });

    const asset = await createLocalAsset(userId, {
      project_id: project.id,
      source_id: source.id,
      title: "Homepage before",
      mime_type: "image/png",
      permission: "internal",
    });

    const projects = await listLocalProjects(userId);
    const sources = await listLocalSources(project.id);
    const assets = await listLocalAssets(project.id);

    expect(projects).toHaveLength(1);
    expect(sources[0]?.id).toBe(source.id);
    expect(assets[0]?.id).toBe(asset.id);
    expect(assets[0]?.permission).toBe("internal");
  });
});
