import type { ConfidenceLevel, Provenance } from "@/lib/db/types";

export type VisionAnalysis = {
  title_suggestion: string | null;
  category: string | null;
  phase: string | null;
  description: string;
  caption: string | null;
  ui_elements: string[];
  annotations: Array<{ label: string; note: string }>;
  confidence: ConfidenceLevel;
};

export type FigmaImportNode = {
  id: string;
  name: string;
  type: string;
  preview_hint?: string;
};

export type FigmaImportResult = {
  file_key: string;
  file_name: string;
  nodes: FigmaImportNode[];
  source_title: string;
  notes: string[];
};

export type KnowledgeEntry = {
  id: string;
  project_id: string;
  kind: "fact" | "block" | "claim" | "source" | "asset" | "note";
  title: string;
  body: string;
  tags: string[];
  ref_id: string | null;
  confidence: ConfidenceLevel;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type RetrievalHit = {
  entry_id: string;
  kind: KnowledgeEntry["kind"];
  title: string;
  snippet: string;
  score: number;
  ref_id: string | null;
};

export type RetrievalResult = {
  query: string;
  hits: RetrievalHit[];
  notes: string[];
};
