import type {
  ApprovalStatus,
  ConfidenceLevel,
  Provenance,
} from "@/lib/db/types";

export type ContentBlockType =
  | "project_snapshot"
  | "context"
  | "challenge"
  | "role"
  | "decision"
  | "before_after"
  | "process"
  | "design_system"
  | "solution"
  | "outcome"
  | "quote"
  | "reflection"
  | "gallery";

export type ContentBlockBody = {
  text?: string;
  items?: string[];
  asset_ids?: string[];
  before_asset_id?: string;
  after_asset_id?: string;
  metric?: string;
  answer_ids?: string[];
  claim_ids?: string[];
};

export type ContentBlock = {
  id: string;
  project_id: string;
  block_type: ContentBlockType;
  title: string | null;
  body: ContentBlockBody;
  confidence: ConfidenceLevel;
  approval: ApprovalStatus;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type Claim = {
  id: string;
  project_id: string;
  claim_text: string;
  confidence: ConfidenceLevel;
  approval: ApprovalStatus;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type Evidence = {
  id: string;
  claim_id: string;
  source_id: string | null;
  asset_id: string | null;
  summary: string;
  confidence: ConfidenceLevel;
  approval: ApprovalStatus;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type OutputType =
  | "website"
  | "linkedin_carousel"
  | "linkedin_post"
  | "upwork"
  | "pdf";

export type OutputSection = {
  heading: string;
  body: string;
  block_ids: string[];
  asset_ids?: string[];
};

export type OutputPayload = {
  title: string;
  sections: OutputSection[];
  slides?: Array<{ title: string; body: string; block_ids: string[] }>;
  warnings: string[];
};

export type OutputRecord = {
  id: string;
  project_id: string;
  output_type: OutputType;
  payload: OutputPayload;
  confidence: ConfidenceLevel;
  approval: ApprovalStatus;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type ExportValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};
