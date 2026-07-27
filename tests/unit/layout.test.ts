import { describe, expect, it } from "vitest";

import {
  derivePayloadFromLayout,
  reorderSlots,
  seedOutputLayout,
  updateSlot,
} from "@/lib/blocks/layout";
import type { ContentBlock } from "@/lib/db/block-types";

function block(
  overrides: Partial<ContentBlock> &
    Pick<ContentBlock, "id" | "block_type" | "title">,
): ContentBlock {
  return {
    project_id: "p1",
    body: { text: `${overrides.title} body` },
    confidence: "high",
    approval: "approved",
    provenance: { method: "deterministic" },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("output layout", () => {
  const blocks = [
    block({ id: "b1", block_type: "challenge", title: "Challenge" }),
    block({ id: "b2", block_type: "outcome", title: "Outcome" }),
    block({ id: "b3", block_type: "role", title: "Role" }),
  ];

  it("seeds website layout with all approved blocks included", () => {
    const layout = seedOutputLayout({
      outputType: "website",
      blocks,
    });
    expect(layout.slots).toHaveLength(3);
    expect(layout.slots.every((slot) => slot.included)).toBe(true);
  });

  it("seeds linkedin post with only the insight slot included", () => {
    const layout = seedOutputLayout({
      outputType: "linkedin_post",
      blocks,
    });
    const included = layout.slots.filter((slot) => slot.included);
    expect(included).toHaveLength(1);
    expect(included[0]?.block_id).toBe("b2");
  });

  it("reorders and derives payload from included slots only", () => {
    const layout = seedOutputLayout({
      outputType: "website",
      blocks,
    });
    const ids = layout.slots.map((slot) => slot.id).reverse();
    const reordered = {
      ...layout,
      slots: reorderSlots(layout.slots, ids),
    };
    const withExclusion = updateSlot(reordered, ids[0]!, { included: false });
    const payload = derivePayloadFromLayout({
      title: "Checkout",
      layout: withExclusion,
      blocks,
    });

    expect(payload.layout?.slots[0]?.order).toBe(0);
    expect(payload.sections).toHaveLength(2);
    expect(payload.sections.map((section) => section.heading)).toEqual([
      "Outcome",
      "Challenge",
    ]);
  });

  it("uses override text while keeping block_id provenance", () => {
    const layout = seedOutputLayout({
      outputType: "website",
      blocks: [blocks[0]!],
    });
    const slotId = layout.slots[0]!.id;
    const polished = updateSlot(layout, slotId, {
      override_heading: "The problem",
      override_text: "Users abandoned checkout at payment.",
    });
    const payload = derivePayloadFromLayout({
      title: "Checkout",
      layout: polished,
      blocks,
    });

    expect(payload.sections[0]?.heading).toBe("The problem");
    expect(payload.sections[0]?.body).toContain("abandoned");
    expect(payload.sections[0]?.block_ids).toEqual(["b1"]);
  });
});
