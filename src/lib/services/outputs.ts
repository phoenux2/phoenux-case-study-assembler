import { getDataMode } from "@/lib/config";
import {
  assembleOutputPayload,
  canPublicExport,
  validatePublicExport,
} from "@/lib/blocks/outputs";
import {
  derivePayloadFromLayout,
  layoutFromLegacyPayload,
} from "@/lib/blocks/layout";
import type {
  OutputLayout,
  OutputRecord,
  OutputType,
} from "@/lib/db/block-types";
import {
  createLocalOutput,
  getLocalOutput,
  listLocalOutputs,
  setLocalApproval,
  updateLocalOutputPayload,
} from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";
import {
  listClaims,
  listContentBlocks,
  listEvidenceForProject,
} from "@/lib/services/blocks";
import { listAssets } from "@/lib/services/assets";
import { getProject } from "@/lib/services/projects";
import type { ApprovalStatus } from "@/lib/db/types";

export async function listOutputs(projectId: string): Promise<OutputRecord[]> {
  if (getDataMode() === "local") {
    return listLocalOutputs(projectId);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outputs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OutputRecord[];
}

export async function getOutput(
  outputId: string,
  projectId: string,
): Promise<OutputRecord | null> {
  if (getDataMode() === "local") {
    return getLocalOutput(outputId, projectId);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outputs")
    .select("*")
    .eq("id", outputId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data as OutputRecord | null;
}

async function loadExportInputs(projectId: string) {
  const [blocks, claims, assets, evidence] = await Promise.all([
    listContentBlocks(projectId),
    listClaims(projectId),
    listAssets(projectId),
    listEvidenceForProject(projectId),
  ]);
  return { blocks, claims, assets, evidence };
}

export async function createOutput(
  projectId: string,
  ownerId: string,
  outputType: OutputType,
): Promise<{ output?: OutputRecord; error?: string; warnings?: string[] }> {
  const project = await getProject(projectId, ownerId);
  if (!project) return { error: "Project not found" };

  const { blocks, claims, assets, evidence } =
    await loadExportInputs(projectId);

  const { payload, validation } = assembleOutputPayload({
    title: project.title,
    outputType,
    blocks,
    claims,
    assets,
    evidence,
    project,
  });

  if (!canPublicExport(validation)) {
    return {
      error: validation.errors.join(" "),
      warnings: validation.warnings,
    };
  }

  if (getDataMode() === "local") {
    const output = await createLocalOutput({
      project_id: projectId,
      output_type: outputType,
      payload,
    });
    return { output, warnings: validation.warnings };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outputs")
    .insert({
      project_id: projectId,
      output_type: outputType,
      payload,
      confidence: "medium",
      approval: "draft",
      provenance: {
        source: "assembly-engine",
        method: "deterministic",
      },
    })
    .select("*")
    .single();
  if (error) throw error;
  return { output: data as OutputRecord, warnings: validation.warnings };
}

/**
 * Persist a tweaked channel layout and re-derive the render payload.
 * Resets output approval to draft so publish re-checks the gate.
 */
export async function updateOutputLayout(input: {
  projectId: string;
  ownerId: string;
  outputId: string;
  layout: OutputLayout;
}): Promise<{ output?: OutputRecord; error?: string }> {
  const project = await getProject(input.projectId, input.ownerId);
  if (!project) return { error: "Project not found" };

  const existing = await getOutput(input.outputId, input.projectId);
  if (!existing) return { error: "Output not found" };

  const blocks = await listContentBlocks(input.projectId);
  const claims = await listClaims(input.projectId);
  const layout: OutputLayout = {
    ...input.layout,
    output_type: existing.output_type,
  };

  const includedBlockIds = new Set(
    layout.slots.filter((slot) => slot.included).map((slot) => slot.block_id),
  );
  const missing = [...includedBlockIds].filter(
    (id) => !blocks.some((block) => block.id === id),
  );
  if (missing.length > 0) {
    return { error: `Layout references missing blocks: ${missing.join(", ")}` };
  }

  const unapprovedIncluded = blocks.filter(
    (block) =>
      includedBlockIds.has(block.id) && block.approval !== "approved",
  );
  if (unapprovedIncluded.length > 0) {
    return {
      error: `Included blocks must be approved: ${unapprovedIncluded
        .map((block) => block.title || block.block_type)
        .join(", ")}`,
    };
  }

  let payload = derivePayloadFromLayout({
    title: existing.payload.title || project.title,
    layout,
    blocks,
    warnings: existing.payload.warnings ?? [],
  });

  const approvedClaims = claims.filter(
    (claim) => claim.approval === "approved",
  );
  if (approvedClaims.length > 0) {
    payload = {
      ...payload,
      sections: [
        ...payload.sections,
        {
          heading: "Supported claims",
          body: approvedClaims.map((claim) => claim.claim_text).join("\n"),
          block_ids: [],
        },
      ],
    };
  }

  if (getDataMode() === "local") {
    const output = await updateLocalOutputPayload(
      input.outputId,
      input.projectId,
      payload,
      { resetApproval: true },
    );
    return output
      ? { output }
      : { error: "Failed to update output layout" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outputs")
    .update({
      payload,
      approval: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.outputId)
    .eq("project_id", input.projectId)
    .select("*")
    .single();
  if (error) return { error: error.message };
  return { output: data as OutputRecord };
}

export function resolveOutputLayout(output: OutputRecord): OutputLayout {
  return (
    output.payload.layout ??
    layoutFromLegacyPayload(output.output_type, output.payload)
  );
}

export async function setApproval(input: {
  entity: "content_block" | "claim" | "asset" | "output";
  id: string;
  projectId: string;
  ownerId: string;
  approval: ApprovalStatus;
}): Promise<{ ok: boolean; error?: string }> {
  const project = await getProject(input.projectId, input.ownerId);
  if (!project) return { ok: false, error: "Project not found" };

  if (input.entity === "output" && input.approval === "approved") {
    const { blocks, claims, assets, evidence } = await loadExportInputs(
      input.projectId,
    );
    const validation = validatePublicExport({
      project,
      blocks,
      claims,
      assets,
      evidence,
    });
    if (!canPublicExport(validation)) {
      return { ok: false, error: validation.errors.join(" ") };
    }
  }

  if (getDataMode() === "local") {
    const ok = await setLocalApproval(input);
    return ok ? { ok: true } : { ok: false, error: "Record not found" };
  }

  const supabase = await createClient();
  const table =
    input.entity === "content_block"
      ? "content_blocks"
      : input.entity === "claim"
        ? "claims"
        : input.entity === "asset"
          ? "assets"
          : "outputs";

  const { error } = await supabase
    .from(table)
    .update({
      approval: input.approval,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("project_id", input.projectId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
