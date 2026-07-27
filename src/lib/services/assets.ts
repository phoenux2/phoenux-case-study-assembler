import { getDataMode } from "@/lib/config";
import type { Asset, CreateAssetInput } from "@/lib/db/types";
import {
  createLocalAsset,
  listLocalAssets,
  updateLocalAsset,
} from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";

export async function listAssets(projectId: string): Promise<Asset[]> {
  if (getDataMode() === "local") {
    return listLocalAssets(projectId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Asset[];
}

export async function createAsset(
  userId: string,
  input: CreateAssetInput,
): Promise<Asset> {
  if (getDataMode() === "local") {
    return createLocalAsset(userId, input);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .insert({
      project_id: input.project_id,
      source_id: input.source_id ?? null,
      uploaded_by: userId,
      title: input.title.trim(),
      filename: input.filename ?? null,
      mime_type: input.mime_type ?? null,
      storage_path: input.storage_path ?? null,
      category: input.category ?? null,
      phase: input.phase ?? "unknown",
      permission: input.permission ?? "internal",
      quality: "unreviewed",
      description: input.description ?? null,
      caption: input.caption ?? null,
      relationships: [],
      annotations: [],
      confidence: "medium",
      approval: "draft",
      provenance: {
        source: "user-upload",
        method: "user",
        created_by: userId,
      },
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Asset;
}

export async function updateAssetMetadata(
  assetId: string,
  projectId: string,
  patch: Partial<
    Pick<
      Asset,
      | "title"
      | "category"
      | "phase"
      | "permission"
      | "description"
      | "caption"
    >
  >,
): Promise<Asset | null> {
  if (getDataMode() === "local") {
    return updateLocalAsset(assetId, projectId, patch);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .eq("project_id", projectId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data as Asset | null;
}

export function isImageMimeType(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}
