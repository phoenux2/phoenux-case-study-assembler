import { NextResponse } from "next/server";
import { generateWebsiteHTML } from "@/lib/templates/html-generator";
import type { OutputPayload } from "@/lib/db/block-types";

export async function GET() {
  const samplePayload: OutputPayload = {
    title: "E-Commerce Platform Redesign",
    sections: [
      {
        heading: "Executive Summary",
        body: "TechRetail Co. engaged our team to redesign their e-commerce checkout flow, reducing cart abandonment and improving mobile conversion. The 6-month project resulted in a 34% reduction in cart abandonment, 28% increase in mobile conversion, and $3.1M in additional annual revenue.",
        block_ids: ["summary-1"],
      },
      {
        heading: "Challenge",
        body: "Reduce the 7-step checkout process to 3 steps while maintaining PCI compliance and integrating with 12 different payment providers. Cart abandonment was at 65% on mobile, resulting in $2.3M annual revenue loss.",
        block_ids: ["challenge-1"],
      },
      {
        heading: "Approach",
        body: "Our team conducted user research with 24 participants, analyzed behavior data, and mapped customer journeys. We implemented a progressive disclosure pattern with intelligent defaults and built a custom design system for brand consistency.",
        block_ids: ["approach-1"],
      },
      {
        heading: "Solution",
        body: "Streamlined 3-step checkout with guest checkout option, real-time validation, smart payment selection, and progress indicators. The solution worked seamlessly across desktop, tablet, and mobile devices.",
        block_ids: ["solution-1"],
      },
      {
        heading: "Results",
        body: `• 34% reduction in cart abandonment rate
• 42% faster checkout completion time
• 28% increase in mobile conversion rate
• 4.8/5 average user satisfaction score
• $3.1M additional annual revenue
• Design system adopted platform-wide, reducing future development time by 40%`,
        block_ids: ["outcome-1"],
      },
    ],
    warnings: [],
  };

  // Use website HTML generator but with print-friendly styling
  let html = generateWebsiteHTML({
    payload: samplePayload,
    projectName: "Case Study Presentation",
    clientName: "TechRetail Co.",
  });

  // Add print-specific styles
  html = html.replace(
    "</head>",
    `<style>
      @media print {
        body { background: white; }
        .no-print { display: none; }
        section { page-break-inside: avoid; }
      }
    </style>
    </head>`
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
