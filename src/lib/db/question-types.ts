import type {
  ApprovalStatus,
  ConfidenceLevel,
  Provenance,
} from "@/lib/db/types";

export type QuestionType =
  | "boolean"
  | "single_select"
  | "multiple_select"
  | "short_text"
  | "long_text"
  | "number"
  | "asset_selection"
  | "text_image"
  | "before_after"
  | "confidence"
  | "permission";

export type QuestionStatus = "open" | "answered" | "skipped";

export type QuestionOption = {
  value: string;
  label: string;
};

export type Question = {
  id: string;
  project_id: string;
  field_key: string;
  question_type: QuestionType;
  prompt: string;
  why: string | null;
  options: QuestionOption[];
  status: QuestionStatus;
  confidence: ConfidenceLevel;
  approval: ApprovalStatus;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type AnswerValue = {
  text?: string;
  boolean?: boolean;
  number?: number;
  selected?: string[];
  asset_ids?: string[];
  before_asset_id?: string;
  after_asset_id?: string;
  confidence?: ConfidenceLevel;
  permission?: "public" | "internal" | "restricted" | "blocked";
};

export type Answer = {
  id: string;
  question_id: string;
  project_id: string;
  answered_by: string;
  value: AnswerValue;
  confidence: ConfidenceLevel;
  approval: ApprovalStatus;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type AnswerAsset = {
  answer_id: string;
  asset_id: string;
  role: string;
};

export type CreateQuestionInput = {
  project_id: string;
  field_key: string;
  question_type: QuestionType;
  prompt: string;
  why?: string;
  options?: QuestionOption[];
};

export type CreateAnswerInput = {
  question_id: string;
  project_id: string;
  value: AnswerValue;
  confidence?: ConfidenceLevel;
  asset_links?: Array<{ asset_id: string; role: string }>;
};

export type CoverageGap = {
  field_key: string;
  severity: "critical" | "important" | "optional";
  reason: string;
};

export type CoverageSnapshot = {
  score: number;
  answered: number;
  total: number;
  gaps: CoverageGap[];
  next_question: Question | null;
};
