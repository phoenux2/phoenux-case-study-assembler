import { randomUUID } from "crypto";

import type {
  ContentBlock,
  OutputLayout,
  OutputLayoutSlot,
  OutputPayload,
  OutputSection,
  OutputType,
} from "@/lib/db/block-types";

function blockBody(block: ContentBlock): string {
  return block.body.text || block.body.metric || "";
}

function slotFromBlock(
  block: ContentBlock,
  order: number,
  included = true,
): OutputLayoutSlot {
  return {
    id: randomUUID(),
    block_id: block.id,
    included,
    order,
    asset_ids: block.body.asset_ids,
  };
}

/**
 * Seed a channel layout from approved blocks. Deterministic — no new facts.
 */
export function seedOutputLayout(input: {
  outputType: OutputType;
  blocks: ContentBlock[];
}): OutputLayout {
  const blocks = input.blocks.filter((block) => block.approval === "approved");

  switch (input.outputType) {
    case "linkedin_post": {
      const insight =
        blocks.find((block) => block.block_type === "outcome") ||
        blocks.find((block) => block.block_type === "challenge") ||
        blocks[0];
      const slots = blocks.map((block, index) =>
        slotFromBlock(block, index, block.id === insight?.id),
      );
      return { output_type: input.outputType, slots };
    }
    case "upwork": {
      const preferredTypes = new Set([
        "challenge",
        "role",
        "solution",
        "outcome",
      ]);
      const preferred = ["challenge", "role", "solution", "outcome"]
        .map((type) => blocks.find((block) => block.block_type === type))
        .filter(Boolean) as ContentBlock[];
      const preferredIds = new Set(preferred.map((block) => block.id));
      const rest = blocks.filter((block) => !preferredIds.has(block.id));
      const ordered = [...preferred, ...rest];
      return {
        output_type: input.outputType,
        slots: ordered.map((block, index) =>
          slotFromBlock(
            block,
            index,
            preferredTypes.has(block.block_type),
          ),
        ),
      };
    }
    case "linkedin_carousel": {
      return {
        output_type: input.outputType,
        slots: blocks.slice(0, 12).map((block, index) =>
          slotFromBlock(block, index, true),
        ),
      };
    }
    case "website":
    case "pdf":
    default:
      return {
        output_type: input.outputType,
        slots: blocks.map((block, index) => slotFromBlock(block, index, true)),
      };
  }
}

export function sortSlots(slots: OutputLayoutSlot[]): OutputLayoutSlot[] {
  return [...slots].sort((a, b) => a.order - b.order);
}

export function includedSlots(layout: OutputLayout): OutputLayoutSlot[] {
  return sortSlots(layout.slots).filter((slot) => slot.included);
}

/**
 * Derive renderable payload from layout + current block bodies.
 * Override text is polish only — still anchored to block_id.
 */
export function derivePayloadFromLayout(input: {
  title: string;
  layout: OutputLayout;
  blocks: ContentBlock[];
  warnings?: string[];
}): OutputPayload {
  const blocksById = new Map(input.blocks.map((block) => [block.id, block]));
  const active = includedSlots(input.layout);

  const sections: OutputSection[] = active.map((slot, index) => {
    const block = blocksById.get(slot.block_id);
    const heading =
      slot.override_heading?.trim() ||
      block?.title ||
      block?.block_type ||
      `Section ${index + 1}`;
    const body =
      slot.override_text?.trim() ||
      (block ? blockBody(block) : "") ||
      "";
    return {
      heading,
      body,
      block_ids: [slot.block_id],
      asset_ids: slot.asset_ids ?? block?.body.asset_ids,
    };
  });

  const payload: OutputPayload = {
    title: input.title,
    sections,
    warnings: input.warnings ?? [],
    layout: input.layout,
  };

  if (input.layout.output_type === "linkedin_carousel") {
    payload.slides = sections.map((section, index) => ({
      title: `${index + 1}. ${section.heading}`,
      body: section.body,
      block_ids: section.block_ids,
    }));
    payload.sections = payload.slides.map((slide) => ({
      heading: slide.title,
      body: slide.body,
      block_ids: slide.block_ids,
    }));
  }

  if (input.layout.output_type === "linkedin_post" && sections[0]) {
    const firstSlot = active[0];
    payload.sections = [
      {
        heading: firstSlot?.override_heading?.trim() || "Insight",
        body: sections[0].body,
        block_ids: sections[0].block_ids,
        asset_ids: sections[0].asset_ids,
      },
    ];
  }

  return payload;
}

/** Backfill layout for older outputs that only stored flattened sections. */
export function layoutFromLegacyPayload(
  outputType: OutputType,
  payload: OutputPayload,
): OutputLayout {
  if (payload.layout?.slots?.length) {
    return payload.layout;
  }

  const source = payload.slides?.length
    ? payload.slides.map((slide) => ({
        heading: slide.title,
        body: slide.body,
        block_ids: slide.block_ids,
      }))
    : payload.sections;

  return {
    output_type: outputType,
    slots: source.map((section, index) => ({
      id: randomUUID(),
      block_id: section.block_ids[0] ?? `legacy-${index}`,
      included: true,
      order: index,
      override_heading: section.heading,
      override_text: section.body,
    })),
  };
}

export function reorderSlots(
  slots: OutputLayoutSlot[],
  orderedIds: string[],
): OutputLayoutSlot[] {
  const byId = new Map(slots.map((slot) => [slot.id, slot]));
  return orderedIds
    .map((id, order) => {
      const slot = byId.get(id);
      if (!slot) return null;
      return { ...slot, order };
    })
    .filter(Boolean) as OutputLayoutSlot[];
}

export function updateSlot(
  layout: OutputLayout,
  slotId: string,
  patch: Partial<
    Pick<
      OutputLayoutSlot,
      "included" | "override_heading" | "override_text" | "asset_ids"
    >
  >,
): OutputLayout {
  return {
    ...layout,
    slots: layout.slots.map((slot) =>
      slot.id === slotId ? { ...slot, ...patch } : slot,
    ),
  };
}
