import type { ConfidenceLevel } from "@/lib/db/types";

export type ExtractedFact = {
  key: string;
  value: string;
  confidence: ConfidenceLevel;
};

export type ExtractionResult = {
  facts: ExtractedFact[];
  entities: Array<{ type: string; value: string }>;
  asset_references: string[];
  unsupported_claims: string[];
};

export type GapDetectionResult = {
  gaps: Array<{
    category: string;
    field: string;
    severity: "critical" | "important" | "optional";
    reason: string;
  }>;
  coverage_score: number;
  blocked_outputs: string[];
};

export type QuestionRefinementResult = {
  questions: Array<{
    type: string;
    text: string;
    why: string;
    field_key: string;
    asset_ids: string[];
  }>;
  question_order: string[];
};

export type ClaimReviewResult = {
  verdict: "supported" | "partially_supported" | "unsupported" | "blocked";
  reasoning: string;
  missing_evidence: string[];
  permission_issues: string[];
};

export type EditorialResult = {
  sections: Array<{
    heading: string;
    body: string;
    block_ids: string[];
  }>;
  block_map: Record<string, string[]>;
  editorial_notes: string[];
};

export type StructuredFactRecord = {
  id: string;
  project_id: string;
  source_id: string | null;
  key: string;
  value: string;
  confidence: ConfidenceLevel;
  provenance: {
    source: string;
    method: "deterministic" | "ai";
    prompt_id?: string;
    prompt_version?: string;
  };
  created_at: string;
  updated_at: string;
};
