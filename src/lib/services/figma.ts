import { getDataMode } from "@/lib/config";
import type { FigmaImportResult } from "@/lib/db/phase4-types";
import {
  createLocalAsset,
  createLocalSource,
} from "@/lib/local/store";
import {
  deterministicFigmaImport,
  parseFigmaFileKey,
} from "@/lib/phase4/deterministic";
import { createAsset } from "@/lib/services/assets";
import { getProject } from "@/lib/services/projects";
import { createSource } from "@/lib/services/sources";

function getFigmaToken(): string | null {
  return process.env.FIGMA_ACCESS_TOKEN || null;
}

async function fetchFigmaFile(fileKey: string): Promise<FigmaImportResult> {
  const token = getFigmaToken();
  if (!token) {
    return deterministicFigmaImport({ fileKey });
  }

  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Figma API error (${response.status}): ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    name?: string;
    document?: { children?: Array<{ id: string; name: string; type: string; children?: unknown[] }> };
  };

  const top = json.document?.children ?? [];
  const nodes = top.slice(0, 20).map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
  }));

  return {
    file_key: fileKey,
    file_name: json.name || `Figma ${fileKey}`,
    nodes,
    source_title: `Figma · ${json.name || fileKey}`,
    notes: [
      "Imported via Figma API.",
      "Frames are stored as source metadata; vision remains on-demand per asset.",
    ],
  };
}

export async function importFigmaFile(
  projectId: string,
  ownerId: string,
  fileUrlOrKey: string,
): Promise<{
  importResult: FigmaImportResult;
  sourceId: string;
  assetIds: string[];
}> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  const fileKey = parseFigmaFileKey(fileUrlOrKey);
  if (!fileKey) {
    throw new Error("Provide a Figma file URL or file key");
  }

  const importResult = await fetchFigmaFile(fileKey);
  const summary = [
    `Figma file: ${importResult.file_name}`,
    `Key: ${importResult.file_key}`,
    `Nodes: ${importResult.nodes.map((node) => node.name).join(", ")}`,
    ...importResult.notes,
  ].join("\n");

  let sourceId: string;
  const assetIds: string[] = [];

  if (getDataMode() === "local") {
    const source = await createLocalSource(ownerId, {
      project_id: projectId,
      source_type: "url",
      title: importResult.source_title,
      content_text: summary,
      content_summary: summary.slice(0, 280),
      filename: `${importResult.file_key}.figma`,
      mime_type: "application/vnd.figma",
    });
    sourceId = source.id;

    for (const node of importResult.nodes.slice(0, 5)) {
      const asset = await createLocalAsset(ownerId, {
        project_id: projectId,
        source_id: source.id,
        title: node.name,
        filename: `${node.id}.figma-frame`,
        mime_type: "image/svg+xml",
        category: "figma-frame",
        phase: node.preview_hint === "problem" ? "discovery" : "design",
        description: `Figma ${node.type} ${node.id}`,
        permission: "internal",
      });
      assetIds.push(asset.id);
    }
  } else {
    const source = await createSource(ownerId, {
      project_id: projectId,
      source_type: "url",
      title: importResult.source_title,
      content_text: summary,
      content_summary: summary.slice(0, 280),
      filename: `${importResult.file_key}.figma`,
      mime_type: "application/vnd.figma",
    });
    sourceId = source.id;

    for (const node of importResult.nodes.slice(0, 5)) {
      const asset = await createAsset(ownerId, {
        project_id: projectId,
        source_id: source.id,
        title: node.name,
        filename: `${node.id}.figma-frame`,
        mime_type: "image/svg+xml",
        category: "figma-frame",
        phase: node.preview_hint === "problem" ? "discovery" : "design",
        description: `Figma ${node.type} ${node.id}`,
        permission: "internal",
      });
      assetIds.push(asset.id);
    }
  }

  return { importResult, sourceId, assetIds };
}

export function figmaStatus() {
  return {
    configured: Boolean(getFigmaToken()),
  };
}
