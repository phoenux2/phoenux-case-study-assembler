import { NextResponse } from "next/server";
import { generateLinkedInCarouselHTML } from "@/lib/templates/html-generator";
import type { OutputPayload } from "@/lib/db/block-types";

export async function GET() {
  const samplePayload: OutputPayload = {
    title: "E-Commerce Platform Redesign",
    sections: [],
    slides: [
      {
        title: "E-Commerce Platform Redesign",
        body: "How we reduced cart abandonment by 34% and increased revenue by $3.1M annually",
        block_ids: ["slide-1"],
      },
      {
        title: "The Problem",
        body: "65% of mobile users found checkout confusing. $2.3M lost annually to cart abandonment. 7-step checkout process was outdated and slow.",
        block_ids: ["slide-2"],
      },
      {
        title: "The Challenge",
        body: "Reduce 7 steps → 3 steps. Maintain PCI compliance. Integrate 12 payment providers. Work across all devices.",
        block_ids: ["slide-3"],
      },
      {
        title: "Research Phase",
        body: "Interviewed 24 users. Analyzed user behavior data. Mapped customer journeys. Identified key pain points.",
        block_ids: ["slide-4"],
      },
      {
        title: "Key Decision",
        body: "Progressive disclosure pattern: Show only what users need at each step. Build custom design system for consistency. Prioritize mobile experience.",
        block_ids: ["slide-5"],
      },
      {
        title: "Before → After",
        body: "Before: 7 separate pages, 8 minutes on mobile, redundant form fields.\n\nAfter: 3 intuitive steps, under 2 minutes, smart inline validation.",
        block_ids: ["slide-6"],
      },
      {
        title: "The Solution",
        body: "✓ Streamlined 3-step checkout\n✓ Guest checkout option\n✓ Real-time validation\n✓ Smart payment selection\n✓ Progress indicators",
        block_ids: ["slide-7"],
      },
      {
        title: "Results",
        body: "34% ↓ cart abandonment\n42% ⚡ faster checkout\n28% ↑ mobile conversion\n$3.1M additional revenue",
        block_ids: ["slide-8"],
      },
      {
        title: "Key Insight",
        body: "Users didn't want the fastest checkout — they wanted confidence and clarity at each step.",
        block_ids: ["slide-9"],
      },
      {
        title: "Let's Connect",
        body: "Want to improve your checkout experience? Let's talk about how research-driven design can transform your conversion rates.",
        block_ids: ["slide-10"],
      },
    ],
    warnings: [],
  };

  const html = generateLinkedInCarouselHTML({
    payload: samplePayload,
    projectId: "ecommerce-redesign-carousel",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
