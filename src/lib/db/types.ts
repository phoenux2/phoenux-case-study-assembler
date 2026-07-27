export type ApprovalStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "blocked";

export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export type SourceType = "file" | "text" | "url" | "email" | "note";

export type AssetPermission =
  | "public"
  | "internal"
  | "restricted"
  | "blocked";

export type AssetQuality = "high" | "medium" | "low" | "unreviewed";

export type ProjectPhase =
  | "discovery"
  | "design"
  | "build"
  | "launch"
  | "outcome"
  | "unknown";

export type Provenance = {
  source?: string;
  method?: "user" | "deterministic" | "ai";
  notes?: string;
  created_by?: string;
};

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  owner_id: string;
  title: string;
  client_name: string | null;
  summary: string | null;
  status: string;
  confidence: ConfidenceLevel;
  approval: ApprovalStatus;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type Source = {
  id: string;
  project_id: string;
  uploaded_by: string;
  source_type: SourceType;
  title: string;
  filename: string | null;
  mime_type: string | null;
  storage_path: string | null;
  content_text: string | null;
  content_summary: string | null;
  confidence: ConfidenceLevel;
  approval: ApprovalStatus;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type Asset = {
  id: string;
  project_id: string;
  source_id: string | null;
  uploaded_by: string;
  title: string;
  filename: string | null;
  mime_type: string | null;
  storage_path: string | null;
  category: string | null;
  phase: ProjectPhase;
  permission: AssetPermission;
  quality: AssetQuality;
  description: string | null;
  caption: string | null;
  relationships: unknown[];
  annotations: unknown[];
  confidence: ConfidenceLevel;
  approval: ApprovalStatus;
  provenance: Provenance;
  created_at: string;
  updated_at: string;
};

export type CreateProjectInput = {
  title: string;
  client_name?: string;
  summary?: string;
};

export type CreateSourceInput = {
  project_id: string;
  source_type: SourceType;
  title: string;
  filename?: string;
  mime_type?: string;
  storage_path?: string;
  content_text?: string;
  content_summary?: string;
};

export type CreateAssetInput = {
  project_id: string;
  source_id?: string;
  title: string;
  filename?: string;
  mime_type?: string;
  storage_path?: string;
  category?: string;
  phase?: ProjectPhase;
  permission?: AssetPermission;
  description?: string;
  caption?: string;
};
