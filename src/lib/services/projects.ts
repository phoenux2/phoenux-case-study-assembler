import { getDataMode } from "@/lib/config";
import type { CreateProjectInput, Project } from "@/lib/db/types";
import {
  createLocalProject,
  getLocalProject,
  listLocalProjects,
} from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";

export async function listProjects(ownerId: string): Promise<Project[]> {
  if (getDataMode() === "local") {
    return listLocalProjects(ownerId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getProject(
  id: string,
  ownerId: string,
): Promise<Project | null> {
  if (getDataMode() === "local") {
    return getLocalProject(id, ownerId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data as Project | null;
}

export async function createProject(
  ownerId: string,
  input: CreateProjectInput,
): Promise<Project> {
  if (getDataMode() === "local") {
    return createLocalProject(ownerId, input);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: ownerId,
      title: input.title.trim(),
      client_name: input.client_name?.trim() || null,
      summary: input.summary?.trim() || null,
      confidence: "unknown",
      approval: "draft",
      provenance: {
        source: "user",
        method: "user",
        created_by: ownerId,
      },
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Project;
}
