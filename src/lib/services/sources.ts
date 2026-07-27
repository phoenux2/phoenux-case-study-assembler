import { getDataMode } from "@/lib/config";
import type { CreateSourceInput, Source } from "@/lib/db/types";
import { createLocalSource, listLocalSources } from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";

function summarizeText(text: string, max = 280): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

export async function listSources(projectId: string): Promise<Source[]> {
  if (getDataMode() === "local") {
    return listLocalSources(projectId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Source[];
}

export async function createSource(
  userId: string,
  input: CreateSourceInput,
): Promise<Source> {
  const contentSummary =
    input.content_summary ??
    (input.content_text ? summarizeText(input.content_text) : null);

  if (getDataMode() === "local") {
    return createLocalSource(userId, {
      ...input,
      content_summary: contentSummary ?? undefined,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .insert({
      project_id: input.project_id,
      uploaded_by: userId,
      source_type: input.source_type,
      title: input.title.trim(),
      filename: input.filename ?? null,
      mime_type: input.mime_type ?? null,
      storage_path: input.storage_path ?? null,
      content_text: input.content_text ?? null,
      content_summary: contentSummary,
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
  return data as Source;
}

export { summarizeText };
