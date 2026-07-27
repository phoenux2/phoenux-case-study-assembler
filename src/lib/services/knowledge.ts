import { getDataMode } from "@/lib/config";
import type {
  KnowledgeEntry,
  RetrievalResult,
} from "@/lib/db/phase4-types";
import {
  listLocalAssets,
  listLocalClaims,
  listLocalContentBlocks,
  listLocalFacts,
  listLocalKnowledge,
  listLocalSources,
  replaceLocalKnowledge,
} from "@/lib/local/store";
import { retrieveFromKnowledge } from "@/lib/phase4/deterministic";
import { createClient } from "@/lib/supabase/server";
import { listClaims, listContentBlocks } from "@/lib/services/blocks";
import { listAssets } from "@/lib/services/assets";
import { getProject } from "@/lib/services/projects";
import { listSources } from "@/lib/services/sources";
import { listFacts } from "@/lib/services/ai-pipeline";

export async function listKnowledge(
  projectId: string,
): Promise<KnowledgeEntry[]> {
  if (getDataMode() === "local") {
    return listLocalKnowledge(projectId);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as KnowledgeEntry[];
}

export async function rebuildKnowledgeBase(
  projectId: string,
  ownerId: string,
): Promise<KnowledgeEntry[]> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  const [sources, assets, facts, blocks, claims] = await Promise.all([
    getDataMode() === "local"
      ? listLocalSources(projectId)
      : listSources(projectId),
    getDataMode() === "local"
      ? listLocalAssets(projectId)
      : listAssets(projectId),
    getDataMode() === "local"
      ? listLocalFacts(projectId)
      : listFacts(projectId),
    getDataMode() === "local"
      ? listLocalContentBlocks(projectId)
      : listContentBlocks(projectId),
    getDataMode() === "local"
      ? listLocalClaims(projectId)
      : listClaims(projectId),
  ]);

  const drafts: Array<Omit<KnowledgeEntry, "id" | "created_at" | "updated_at">> =
    [];

  drafts.push({
    project_id: projectId,
    kind: "note",
    title: project.title,
    body: [
      project.summary,
      project.client_name ? `Client: ${project.client_name}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    tags: ["project", "snapshot"],
    ref_id: project.id,
    confidence: project.confidence,
    provenance: { source: "knowledge-rebuild", method: "deterministic" },
  });

  for (const fact of facts) {
    drafts.push({
      project_id: projectId,
      kind: "fact",
      title: fact.key,
      body: fact.value,
      tags: ["fact", fact.key],
      ref_id: fact.id,
      confidence: fact.confidence,
      provenance: {
        source: "fact",
        method: fact.provenance.method,
      },
    });
  }

  for (const source of sources) {
    drafts.push({
      project_id: projectId,
      kind: "source",
      title: source.title,
      body: source.content_summary || source.content_text || source.filename || "",
      tags: ["source", source.source_type],
      ref_id: source.id,
      confidence: source.confidence,
      provenance: { source: "source", method: "deterministic" },
    });
  }

  for (const asset of assets) {
    drafts.push({
      project_id: projectId,
      kind: "asset",
      title: asset.title,
      body: [
        asset.description,
        asset.caption,
        asset.category,
        asset.phase,
      ]
        .filter(Boolean)
        .join(" · "),
      tags: ["asset", asset.phase, asset.permission],
      ref_id: asset.id,
      confidence: asset.confidence,
      provenance: { source: "asset", method: "deterministic" },
    });
  }

  for (const block of blocks) {
    drafts.push({
      project_id: projectId,
      kind: "block",
      title: block.title || block.block_type,
      body: block.body.text || block.body.metric || "",
      tags: ["block", block.block_type, block.approval],
      ref_id: block.id,
      confidence: block.confidence,
      provenance: { source: "content-block", method: "deterministic" },
    });
  }

  for (const claim of claims) {
    drafts.push({
      project_id: projectId,
      kind: "claim",
      title: "Claim",
      body: claim.claim_text,
      tags: ["claim", claim.approval],
      ref_id: claim.id,
      confidence: claim.confidence,
      provenance: { source: "claim", method: "deterministic" },
    });
  }

  if (getDataMode() === "local") {
    return replaceLocalKnowledge(projectId, drafts);
  }

  const supabase = await createClient();
  await supabase.from("knowledge_entries").delete().eq("project_id", projectId);
  const { data, error } = await supabase
    .from("knowledge_entries")
    .insert(drafts)
    .select("*");
  if (error) throw error;
  return (data ?? []) as KnowledgeEntry[];
}

export async function searchKnowledge(
  projectId: string,
  ownerId: string,
  query: string,
): Promise<RetrievalResult> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  let entries = await listKnowledge(projectId);
  if (entries.length === 0) {
    entries = await rebuildKnowledgeBase(projectId, ownerId);
  }

  return retrieveFromKnowledge({ query, entries });
}
