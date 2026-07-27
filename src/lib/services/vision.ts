import { runAiTask } from "@/lib/ai/provider";
import { getDataMode } from "@/lib/config";
import type { VisionAnalysis } from "@/lib/db/phase4-types";
import type { Asset, ProjectPhase } from "@/lib/db/types";
import {
  listLocalAssets,
  updateLocalAssetVision,
} from "@/lib/local/store";
import { deterministicVision } from "@/lib/phase4/deterministic";
import { createClient } from "@/lib/supabase/server";
import { listAssets } from "@/lib/services/assets";
import { getProject } from "@/lib/services/projects";

async function getAsset(
  projectId: string,
  assetId: string,
): Promise<Asset | null> {
  const assets =
    getDataMode() === "local"
      ? await listLocalAssets(projectId)
      : await listAssets(projectId);
  return assets.find((asset) => asset.id === assetId) ?? null;
}

export async function analyzeAssetVision(
  projectId: string,
  ownerId: string,
  assetId: string,
): Promise<{
  analysis: VisionAnalysis;
  asset: Asset;
  meta: { used_ai: boolean; provider: string; cached: boolean; error?: string };
}> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  const asset = await getAsset(projectId, assetId);
  if (!asset) throw new Error("Asset not found");

  const call = await runAiTask<VisionAnalysis>({
    promptId: "vision",
    variables: {
      asset_metadata: JSON.stringify({
        title: asset.title,
        filename: asset.filename,
        category: asset.category,
        phase: asset.phase,
        description: asset.description,
        caption: asset.caption,
        permission: asset.permission,
      }),
    },
    cacheInput: {
      assetId: asset.id,
      title: asset.title,
      filename: asset.filename,
      category: asset.category,
      phase: asset.phase,
      description: asset.description,
    },
    parse: (value) => value as VisionAnalysis,
    fallback: () => deterministicVision(asset),
  });

  const analysis = call.result!;
  const phase = (analysis.phase || asset.phase || "unknown") as ProjectPhase;

  const patch = {
    title: analysis.title_suggestion || asset.title,
    category: analysis.category || asset.category,
    phase,
    description: analysis.description,
    caption: analysis.caption,
    annotations: analysis.annotations,
    confidence: analysis.confidence,
  };

  let updated: Asset | null;
  if (getDataMode() === "local") {
    updated = await updateLocalAssetVision(assetId, projectId, patch);
  } else {
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
    updated = data as Asset | null;
  }

  if (!updated) throw new Error("Failed to update asset vision metadata");

  return {
    analysis,
    asset: updated,
    meta: {
      used_ai: call.used_ai,
      provider: call.provider,
      cached: call.cached,
      error: call.error,
    },
  };
}
