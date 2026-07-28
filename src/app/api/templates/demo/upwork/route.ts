import { NextResponse } from "next/server";
import { generateUpworkHTML } from "@/lib/templates/html-generator";
import type { OutputPayload } from "@/lib/db/block-types";

export async function GET() {
  const samplePayload: OutputPayload = {
    title: "E-Commerce Platform Redesign",
    sections: [
      {
        heading: "Challenge",
        body: "Reduce the 7-step checkout process to 3 steps while maintaining PCI compliance and integrating with 12 different payment providers. The solution needed to work seamlessly across desktop, tablet, and mobile devices without disrupting the existing customer base of 2M+ monthly users. Cart abandonment was at 65% on mobile, resulting in $2.3M annual revenue loss.",
        block_ids: ["challenge-1"],
      },
      {
        heading: "Role",
        body: "Lead Product Designer and UX Strategist. I conducted user research with 24 participants, created wireframes and interactive prototypes, designed the complete UI system, collaborated with engineering on implementation, and led A/B testing and performance optimization efforts throughout the 6-month project.",
        block_ids: ["role-1"],
      },
      {
        heading: "Solution",
        body: "Implemented a progressive disclosure pattern with a streamlined 3-step checkout featuring intelligent defaults, guest checkout option, and one-click reorder for returning customers. Built a custom design system to ensure brand consistency and accessibility compliance. Added real-time address validation, smart payment method selection based on user location, and progress indicators that built user confidence throughout the process.",
        block_ids: ["solution-1"],
      },
      {
        heading: "Outcome",
        body: `Delivered measurable results across all key metrics:
• 34% reduction in cart abandonment rate
• 42% faster checkout completion time  
• 28% increase in mobile conversion rate
• 4.8/5 average user satisfaction score
• $3.1M additional annual revenue

The design system was adopted across other platform areas, reducing future design and development time by an estimated 40%.`,
        block_ids: ["outcome-1"],
      },
    ],
    warnings: [],
  };

  const html = generateUpworkHTML({
    payload: samplePayload,
    clientName: "TechRetail Co. | 6-month project",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
