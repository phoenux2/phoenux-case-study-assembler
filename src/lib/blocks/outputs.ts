import type { Asset } from "@/lib/db/types";
import type {
  Claim,
  ContentBlock,
  ExportValidation,
  OutputPayload,
  OutputSection,
  OutputType,
} from "@/lib/db/block-types";

function approvedBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.filter((block) => block.approval === "approved");
}

function approvedClaims(claims: Claim[]): Claim[] {
  return claims.filter((claim) => claim.approval === "approved");
}

function sectionFromBlock(block: ContentBlock): OutputSection {
  return {
    heading: block.title || block.block_type,
    body: block.body.text || block.body.metric || "",
    block_ids: [block.id],
    asset_ids: block.body.asset_ids,
  };
}

/**
 * Assemble platform outputs from approved blocks/claims only.
 * Introduces no new facts.
 */
export function assembleOutputPayload(input: {
  title: string;
  outputType: OutputType;
  blocks: ContentBlock[];
  claims: Claim[];
  assets: Asset[];
}): { payload: OutputPayload; validation: ExportValidation } {
  const blocks = approvedBlocks(input.blocks);
  const claims = approvedClaims(input.claims);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (blocks.length === 0) {
    errors.push("No approved content blocks to assemble.");
  }

  const blockedAssets = input.assets.filter(
    (asset) => asset.permission === "blocked",
  );
  const usedAssetIds = new Set(
    blocks.flatMap((block) => block.body.asset_ids ?? []),
  );
  for (const asset of blockedAssets) {
    if (usedAssetIds.has(asset.id)) {
      errors.push(`Blocked asset cannot be exported: ${asset.title}`);
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

  const sections = blocks.map(sectionFromBlock);
  if (claims.length > 0) {
    sections.push({
      heading: "Supported claims",
      body: claims.map((claim) => claim.claim_text).join("\n"),
      block_ids: [],
    });
  }

  let payload: OutputPayload = {
    title: input.title,
    sections,
    warnings,
  };

  switch (input.outputType) {
    case "linkedin_carousel": {
      const slides = blocks.slice(0, 12).map((block, index) => ({
        title: `${index + 1}. ${block.title || block.block_type}`,
        body: block.body.text || block.body.metric || "",
        block_ids: [block.id],
      }));
      if (slides.length < 8) {
        warnings.push(
          `Carousel has ${slides.length} slides; target is 8–12 once more blocks are approved.`,
        );
      }
      payload = { ...payload, slides, sections: slides.map((slide) => ({
        heading: slide.title,
        body: slide.body,
        block_ids: slide.block_ids,
      })) };
      break;
    }
    case "linkedin_post": {
      const insight =
        blocks.find((block) => block.block_type === "outcome") ||
        blocks.find((block) => block.block_type === "challenge") ||
        blocks[0];
      payload = {
        title: input.title,
        sections: insight
          ? [
              {
                heading: "Insight",
                body: insight.body.text || insight.body.metric || "",
                block_ids: [insight.id],
              },
            ]
          : [],
        warnings,
      };
      break;
    }
    case "upwork": {
      const preferred = ["challenge", "role", "solution", "outcome"]
        .map((type) => blocks.find((block) => block.block_type === type))
        .filter(Boolean) as ContentBlock[];
      payload = {
        title: input.title,
        sections: preferred.map(sectionFromBlock),
        warnings,
      };
      break;
    }
    case "website":
    case "pdf":
    default:
      break;
  }

  return {
    payload,
    validation: {
      ok: errors.length === 0,
      errors,
      warnings,
    },
  };
}

export function canPublicExport(validation: ExportValidation): boolean {
  return validation.ok;
}
