import { getAiProviderLabel, isAiEnabled } from "@/lib/ai/config";
import {
  deterministicClaimReview,
  deterministicEditorial,
  deterministicExtraction,
  deterministicGapDetection,
  deterministicQuestionRefinement,
} from "@/lib/ai/deterministic";
import { runAiTask } from "@/lib/ai/provider";
import type {
  ClaimReviewResult,
  EditorialResult,
  ExtractionResult,
  GapDetectionResult,
  QuestionRefinementResult,
  StructuredFactRecord,
} from "@/lib/db/ai-types";
import type { ContentBlock } from "@/lib/db/block-types";
import { getDataMode } from "@/lib/config";
import {
  listLocalAssets,
  listLocalFacts,
  listLocalSources,
  upsertLocalFacts,
} from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";
import { listClaims, listContentBlocks, listEvidenceForClaim } from "@/lib/services/blocks";
import { getCoverageSnapshot } from "@/lib/services/questions";
import { getProject } from "@/lib/services/projects";
import { listAssets } from "@/lib/services/assets";
import { listSources } from "@/lib/services/sources";

export async function listFacts(
  projectId: string,
): Promise<StructuredFactRecord[]> {
  if (getDataMode() === "local") {
    return listLocalFacts(projectId);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StructuredFactRecord[];
}

export async function runExtraction(
  projectId: string,
  ownerId: string,
  sourceId?: string,
): Promise<{
  extraction: ExtractionResult;
  facts: StructuredFactRecord[];
  meta: { used_ai: boolean; provider: string; cached: boolean; error?: string };
}> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  const sources =
    getDataMode() === "local"
      ? await listLocalSources(projectId)
      : await listSources(projectId);
  const source = sourceId
    ? sources.find((item) => item.id === sourceId)
    : sources[0];
  if (!source) throw new Error("No source available for extraction");

  const existing = await listFacts(projectId);
  const existingFactKeys = existing.map((fact) =>
    fact.key === "metric_mention" ? `metric:${fact.value}` : fact.key,
  );

  const call = await runAiTask<ExtractionResult>({
    promptId: "extraction",
    variables: {
      content_summary:
        source.content_summary || source.title || "No summary available",
      existing_facts: JSON.stringify(
        existing.map((fact) => ({ key: fact.key, value: fact.value })),
      ),
    },
    cacheInput: {
      source_id: source.id,
      summary: source.content_summary,
      text: source.content_text,
      existingFactKeys,
    },
    parse: (value) => value as ExtractionResult,
    fallback: () =>
      deterministicExtraction({
        contentSummary: source.content_summary || source.title,
        contentText: source.content_text,
        existingFactKeys,
      }),
  });

  const extraction = call.result!;
  const method = call.used_ai ? "ai" : "deterministic";

  let facts: StructuredFactRecord[] = [];
  if (getDataMode() === "local") {
    facts = await upsertLocalFacts(
      projectId,
      source.id,
      extraction.facts.map((fact) => ({
        source_id: source.id,
        key: fact.key,
        value: fact.value,
        confidence: fact.confidence,
        provenance: {
          source: "extraction",
          method,
          prompt_id: call.prompt_id,
          prompt_version: call.version,
        },
      })),
    );
  } else {
    const supabase = await createClient();
    const rows = extraction.facts.map((fact) => ({
      project_id: projectId,
      source_id: source.id,
      key: fact.key,
      value: fact.value,
      confidence: fact.confidence,
      provenance: {
        source: "extraction",
        method,
        prompt_id: call.prompt_id,
        prompt_version: call.version,
      },
    }));
    const { data, error } = await supabase.from("facts").insert(rows).select("*");
    if (error) throw error;
    facts = (data ?? []) as StructuredFactRecord[];
  }

  return {
    extraction,
    facts,
    meta: {
      used_ai: call.used_ai,
      provider: call.provider,
      cached: call.cached,
      error: call.error,
    },
  };
}

export async function runGapDetection(
  projectId: string,
  ownerId: string,
): Promise<{
  result: GapDetectionResult;
  meta: { used_ai: boolean; provider: string; cached: boolean; error?: string };
}> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  const [coverage, blocks, facts] = await Promise.all([
    getCoverageSnapshot(project),
    listContentBlocks(projectId),
    listFacts(projectId),
  ]);

  const call = await runAiTask<GapDetectionResult>({
    promptId: "gap-detection",
    variables: {
      coverage_model: JSON.stringify(
        coverage.gaps.map((gap) => gap.field_key),
      ),
      structured_facts: JSON.stringify(
        facts.map((fact) => ({ key: fact.key, value: fact.value })),
      ),
      content_blocks: JSON.stringify(
        blocks.map((block) => ({
          type: block.block_type,
          approval: block.approval,
        })),
      ),
    },
    cacheInput: {
      projectId,
      gaps: coverage.gaps,
      score: coverage.score,
      blockApprovals: blocks.map((block) => block.approval),
      factKeys: facts.map((fact) => fact.key),
    },
    parse: (value) => value as GapDetectionResult,
    fallback: () =>
      deterministicGapDetection({
        gaps: coverage.gaps,
        coverageScore: coverage.score,
        hasApprovedBlocks: blocks.some((block) => block.approval === "approved"),
      }),
  });

  return {
    result: call.result!,
    meta: {
      used_ai: call.used_ai,
      provider: call.provider,
      cached: call.cached,
      error: call.error,
    },
  };
}

export async function runQuestionRefinement(
  projectId: string,
  ownerId: string,
): Promise<{
  result: QuestionRefinementResult;
  meta: { used_ai: boolean; provider: string; cached: boolean; error?: string };
}> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  const [coverage, assets] = await Promise.all([
    getCoverageSnapshot(project),
    getDataMode() === "local"
      ? listLocalAssets(projectId)
      : listAssets(projectId),
  ]);

  const call = await runAiTask<QuestionRefinementResult>({
    promptId: "question-refinement",
    variables: {
      gaps: JSON.stringify(coverage.gaps),
      related_assets: JSON.stringify(
        assets.map((asset) => ({ id: asset.id, title: asset.title })),
      ),
    },
    cacheInput: {
      projectId,
      gaps: coverage.gaps,
      assetIds: assets.map((asset) => asset.id),
    },
    parse: (value) => value as QuestionRefinementResult,
    fallback: () =>
      deterministicQuestionRefinement({
        gaps: coverage.gaps,
        assetIds: assets.map((asset) => asset.id),
      }),
  });

  return {
    result: call.result!,
    meta: {
      used_ai: call.used_ai,
      provider: call.provider,
      cached: call.cached,
      error: call.error,
    },
  };
}

export async function runClaimReview(
  projectId: string,
  ownerId: string,
  claimId: string,
): Promise<{
  result: ClaimReviewResult;
  meta: { used_ai: boolean; provider: string; cached: boolean; error?: string };
}> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  const claims = await listClaims(projectId);
  const claim = claims.find((item) => item.id === claimId);
  if (!claim) throw new Error("Claim not found");

  const [evidence, assets] = await Promise.all([
    listEvidenceForClaim(claimId),
    getDataMode() === "local"
      ? listLocalAssets(projectId)
      : listAssets(projectId),
  ]);

  const evidenceAssetIds = new Set(
    evidence.map((item) => item.asset_id).filter(Boolean),
  );
  const hasBlockedAssets = assets.some(
    (asset) => evidenceAssetIds.has(asset.id) && asset.permission === "blocked",
  );

  const call = await runAiTask<ClaimReviewResult>({
    promptId: "claim-review",
    variables: {
      claim_text: claim.claim_text,
      evidence: JSON.stringify(
        evidence.map((item) => ({
          summary: item.summary,
          source_id: item.source_id,
          asset_id: item.asset_id,
        })),
      ),
      permission_context: JSON.stringify({
        hasBlockedAssets,
        assets: assets.map((asset) => ({
          id: asset.id,
          permission: asset.permission,
        })),
      }),
    },
    cacheInput: {
      claimId,
      claim_text: claim.claim_text,
      evidence: evidence.map((item) => item.summary),
      hasBlockedAssets,
    },
    parse: (value) => value as ClaimReviewResult,
    fallback: () =>
      deterministicClaimReview({
        claimText: claim.claim_text,
        evidenceSummaries: evidence.map((item) => item.summary),
        hasBlockedAssets,
      }),
  });

  return {
    result: call.result!,
    meta: {
      used_ai: call.used_ai,
      provider: call.provider,
      cached: call.cached,
      error: call.error,
    },
  };
}

export async function runEditorial(
  projectId: string,
  ownerId: string,
  outputType: string,
): Promise<{
  result: EditorialResult;
  meta: { used_ai: boolean; provider: string; cached: boolean; error?: string };
}> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  const blocks = (await listContentBlocks(projectId)).filter(
    (block) => block.approval === "approved",
  );
  if (blocks.length === 0) {
    throw new Error("Approve at least one content block before editorial");
  }

  const call = await runAiTask<EditorialResult>({
    promptId: "editorial",
    variables: {
      output_type: outputType,
      approved_blocks: JSON.stringify(
        blocks.map((block) => ({
          id: block.id,
          type: block.block_type,
          title: block.title,
          text: block.body.text || block.body.metric || "",
        })),
      ),
      style_guide: JSON.stringify({
        invent_facts: false,
        preserve_provenance: true,
      }),
    },
    cacheInput: {
      projectId,
      outputType,
      blockIds: blocks.map((block) => block.id),
      texts: blocks.map((block) => block.body.text || block.body.metric || ""),
    },
    parse: (value) => value as EditorialResult,
    fallback: () =>
      deterministicEditorial({
        outputType,
        blocks: blocks as ContentBlock[],
      }),
  });

  return {
    result: call.result!,
    meta: {
      used_ai: call.used_ai,
      provider: call.provider,
      cached: call.cached,
      error: call.error,
    },
  };
}

export function getAiStatus() {
  return {
    enabled: isAiEnabled(),
    provider: getAiProviderLabel(),
  };
}
