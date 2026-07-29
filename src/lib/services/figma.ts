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

function stubFramePreview(title: string, nodeId: string): string {
  const safeTitle = title.replace(/[<>&]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f2937"/>
      <stop offset="100%" stop-color="#4b5563"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#g)"/>
  <text x="32" y="64" fill="#f9fafb" font-family="Georgia, serif" font-size="28">${safeTitle}</text>
  <text x="32" y="104" fill="#d1d5db" font-family="ui-sans-serif, system-ui" font-size="16">Figma frame ${nodeId}</text>
  <rect x="32" y="150" width="576" height="200" rx="12" fill="#111827" opacity="0.55"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
        storage_path: stubFramePreview(node.name, node.id),
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
        storage_path: stubFramePreview(node.name, node.id),
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
