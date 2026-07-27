import type {
  FigmaImportResult,
  RetrievalResult,
  VisionAnalysis,
} from "@/lib/db/phase4-types";
import type { Asset } from "@/lib/db/types";
import type { KnowledgeEntry } from "@/lib/db/phase4-types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+%]+/i)
    .filter((token) => token.length > 1);
}

/**
 * On-demand vision fallback from asset metadata only — never invents product results.
 */
export function deterministicVision(asset: Asset): VisionAnalysis {
  const haystack = [
    asset.title,
    asset.filename,
    asset.category,
    asset.description,
    asset.caption,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const ui_elements: string[] = [];
  for (const cue of [
    "dashboard",
    "modal",
    "form",
    "nav",
    "chart",
    "table",
    "button",
    "onboarding",
    "checkout",
  ]) {
    if (haystack.includes(cue)) ui_elements.push(cue);
  }

  const phase =
    asset.phase !== "unknown"
      ? asset.phase
      : haystack.includes("before")
        ? "discovery"
        : haystack.includes("after") || haystack.includes("final")
          ? "outcome"
          : "unknown";

  const category =
    asset.category ||
    (haystack.includes("wireframe")
      ? "wireframe"
      : haystack.includes("screenshot")
        ? "screenshot"
        : "image");

  return {
    title_suggestion: asset.title || asset.filename || "Untitled asset",
    category,
    phase,
    description:
      asset.description ||
      `Deterministic vision summary for ${asset.title || asset.filename || "asset"}. UI cues: ${
        ui_elements.join(", ") || "none detected from metadata"
      }.`,
    caption: asset.caption || asset.title || asset.filename,
    ui_elements,
    annotations: ui_elements.map((label) => ({
      label,
      note: `Detected from filename/metadata cue: ${label}`,
    })),
    confidence: ui_elements.length > 0 ? "medium" : "low",
  };
}

export function parseFigmaFileKey(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9]{10,}$/.test(trimmed) && !trimmed.includes("/")) {
    return trimmed;
  }
  const match = trimmed.match(
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/i,
  );
  return match?.[1] ?? null;
}

/**
 * Deterministic Figma import from URL/file key metadata when API token is absent.
 */
export function deterministicFigmaImport(input: {
  fileKey: string;
  fileName?: string;
}): FigmaImportResult {
  return {
    file_key: input.fileKey,
    file_name: input.fileName || `Figma ${input.fileKey}`,
    nodes: [
      {
        id: "1:1",
        name: "Cover",
        type: "FRAME",
        preview_hint: "cover",
      },
      {
        id: "1:2",
        name: "Problem flow",
        type: "FRAME",
        preview_hint: "problem",
      },
      {
        id: "1:3",
        name: "Solution screens",
        type: "FRAME",
        preview_hint: "solution",
      },
    ],
    source_title: `Figma import · ${input.fileName || input.fileKey}`,
    notes: [
      "Imported without Figma API token — structure is a deterministic stub.",
      "Set FIGMA_ACCESS_TOKEN to fetch live file nodes.",
      "Vision is still on-demand per asset; frames are not auto-scanned.",
    ],
  };
}

export function retrieveFromKnowledge(input: {
  query: string;
  entries: KnowledgeEntry[];
  limit?: number;
}): RetrievalResult {
  const queryTokens = tokenize(input.query);
  if (queryTokens.length === 0) {
    return {
      query: input.query,
      hits: [],
      notes: ["Empty query"],
    };
  }

  const scored = input.entries
    .map((entry) => {
      const corpus = tokenize(`${entry.title} ${entry.body} ${entry.tags.join(" ")}`);
      const overlap = queryTokens.filter((token) => corpus.includes(token));
      const score =
        overlap.length / queryTokens.length +
        (entry.title.toLowerCase().includes(input.query.toLowerCase())
          ? 0.25
          : 0);
      return {
        entry,
        score,
        overlap,
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 8);

  return {
    query: input.query,
    hits: scored.map((row) => ({
      entry_id: row.entry.id,
      kind: row.entry.kind,
      title: row.entry.title,
      snippet: row.entry.body.slice(0, 220),
      score: Number(row.score.toFixed(3)),
      ref_id: row.entry.ref_id,
    })),
    notes: [
      "Deterministic token retrieval over the project knowledge base.",
      "No embeddings required; AI retrieval can replace this later without changing callers.",
    ],
  };
}
