import type { Asset, Project } from "@/lib/db/types";
import type {
  Claim,
  ContentBlock,
  Evidence,
  ExportValidation,
  OutputPayload,
  OutputType,
} from "@/lib/db/block-types";
import {
  derivePayloadFromLayout,
  seedOutputLayout,
} from "@/lib/blocks/layout";

const METRIC_PATTERN =
  /(?:\+|-)?\d+(?:\.\d+)?%|\b\d+\s*(?:users|customers|signups|revenue|conversion)\b/i;

function approvedBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.filter((block) => block.approval === "approved");
}

function approvedClaims(claims: Claim[]): Claim[] {
  return claims.filter((claim) => claim.approval === "approved");
}

function collectReferencedAssetIds(blocks: ContentBlock[]): Set<string> {
  const ids = new Set<string>();
  for (const block of blocks) {
    for (const id of block.body.asset_ids ?? []) ids.add(id);
    if (block.body.before_asset_id) ids.add(block.body.before_asset_id);
    if (block.body.after_asset_id) ids.add(block.body.after_asset_id);
  }
  return ids;
}

function evidenceByClaimId(evidence: Evidence[]): Map<string, Evidence[]> {
  const map = new Map<string, Evidence[]>();
  for (const item of evidence) {
    const list = map.get(item.claim_id) ?? [];
    list.push(item);
    map.set(item.claim_id, list);
  }
  return map;
}

/**
 * Hard public-export gate (SECURITY.md):
 * Permission → Claim Approval → Asset Approval → Output Approval
 *
 * Never export blocked/confidential assets, unsupported metrics,
 * or approved claims without evidence.
 */
export function validatePublicExport(input: {
  project?: Pick<Project, "approval" | "client_name"> | null;
  blocks: ContentBlock[];
  claims: Claim[];
  assets: Asset[];
  evidence?: Evidence[];
}): ExportValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blocks = approvedBlocks(input.blocks);
  const claims = approvedClaims(input.claims);
  const assetsById = new Map(input.assets.map((asset) => [asset.id, asset]));
  const evidenceMap = evidenceByClaimId(input.evidence ?? []);

  if (input.project?.approval === "blocked") {
    errors.push("Project is blocked and cannot be publicly exported.");
  }
  if (input.project?.approval === "rejected") {
    errors.push("Project is rejected and cannot be publicly exported.");
  }

  if (blocks.length === 0) {
    errors.push("No approved content blocks to assemble.");
  }

  const usedAssetIds = collectReferencedAssetIds(blocks);
  for (const assetId of usedAssetIds) {
    const asset = assetsById.get(assetId);
    if (!asset) {
      errors.push(`Referenced asset is missing: ${assetId}`);
      continue;
    }
    if (asset.permission === "blocked") {
      errors.push(`Blocked asset cannot be exported: ${asset.title}`);
    } else if (asset.permission === "restricted") {
      errors.push(
        `Restricted asset cannot be publicly exported: ${asset.title}`,
      );
    } else if (asset.permission === "internal") {
      errors.push(
        `Internal asset cannot be publicly exported: ${asset.title}`,
      );
    }
    if (asset.approval !== "approved") {
      errors.push(
        `Asset must be approved before public export: ${asset.title}`,
      );
    }
  }

  const draftClaims = input.claims.filter(
    (claim) => claim.approval !== "approved" && claim.approval !== "rejected",
  );
  if (draftClaims.length > 0) {
    warnings.push(
      `${draftClaims.length} claim(s) are not approved and will be omitted.`,
    );
  }

  for (const claim of claims) {
    const claimEvidence = evidenceMap.get(claim.id) ?? [];
    const hasEvidence = claimEvidence.some(
      (item) =>
        item.approval !== "rejected" &&
        (Boolean(item.summary?.trim()) ||
          Boolean(item.source_id) ||
          Boolean(item.asset_id)),
    );

    if (!hasEvidence) {
      errors.push(
        `Approved claim lacks evidence and cannot be exported: "${claim.claim_text}"`,
      );
      continue;
    }

    if (claim.provenance.method === "ai") {
      warnings.push(
        `Claim uses AI provenance and still requires human review: "${claim.claim_text}"`,
      );
    }

    if (METRIC_PATTERN.test(claim.claim_text)) {
      const evidenceText = claimEvidence.map((item) => item.summary).join(" ");
      if (!METRIC_PATTERN.test(evidenceText)) {
        errors.push(
          `Metric claim is not grounded in evidence: "${claim.claim_text}"`,
        );
      }
    }

    for (const item of claimEvidence) {
      if (!item.asset_id) continue;
      const asset = assetsById.get(item.asset_id);
      if (asset?.permission === "blocked") {
        errors.push(
          `Claim evidence links a blocked asset: ${asset.title}`,
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Assemble platform outputs from approved blocks/claims only.
 * Seeds an editable layout, then derives sections/slides from it.
 * Introduces no new facts.
 */
export function assembleOutputPayload(input: {
  title: string;
  outputType: OutputType;
  blocks: ContentBlock[];
  claims: Claim[];
  assets: Asset[];
  evidence?: Evidence[];
  project?: Pick<Project, "approval" | "client_name"> | null;
}): { payload: OutputPayload; validation: ExportValidation } {
  const blocks = approvedBlocks(input.blocks);
  const claims = approvedClaims(input.claims);
  const validation = validatePublicExport({
    project: input.project,
    blocks: input.blocks,
    claims: input.claims,
    assets: input.assets,
    evidence: input.evidence,
  });

  if (
    input.outputType === "linkedin_carousel" &&
    blocks.length > 0 &&
    blocks.length < 8
  ) {
    validation.warnings.push(
      `Carousel has ${Math.min(blocks.length, 12)} slides; target is 8–12 once more blocks are approved.`,
    );
  }

  const layout = seedOutputLayout({
    outputType: input.outputType,
    blocks,
  });

  let payload = derivePayloadFromLayout({
    title: input.title,
    layout,
    blocks,
    warnings: validation.warnings,
  });

  if (claims.length > 0 && validation.ok) {
    payload = {
      ...payload,
      sections: [
        ...payload.sections,
        {
          heading: "Supported claims",
          body: claims.map((claim) => claim.claim_text).join("\n"),
          block_ids: [],
        },
      ],
    };
  }

  return {
    payload,
    validation: {
      ok: validation.ok,
      errors: validation.errors,
      warnings: validation.warnings,
    },
  };
}

export function canPublicExport(validation: ExportValidation): boolean {
  return validation.ok;
}
