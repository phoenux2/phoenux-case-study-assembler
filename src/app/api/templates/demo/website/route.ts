import { NextResponse } from "next/server";
import { generateWebsiteHTML } from "@/lib/templates/html-generator";
import type { OutputPayload } from "@/lib/db/block-types";

export async function GET() {
  const samplePayload: OutputPayload = {
    title: "E-Commerce Platform Redesign",
    sections: [
      {
        heading: "Project Snapshot",
        body: "TechRetail Co. needed to modernize their aging e-commerce platform that was experiencing high cart abandonment rates and poor mobile performance. The project spanned 6 months and involved redesigning the entire checkout flow while maintaining backwards compatibility with legacy systems.",
        block_ids: ["snapshot-1"],
      },
      {
        heading: "Context",
        body: "The existing platform was built in 2018 and hadn't received major updates. User research showed that 65% of mobile users found the checkout process confusing, and the company was losing an estimated $2.3M annually due to cart abandonment.",
        block_ids: ["context-1"],
      },
      {
        heading: "Challenge",
        body: "The main challenge was reducing the 7-step checkout process to 3 steps while maintaining PCI compliance and integrating with 12 different payment providers. Additionally, the solution needed to work seamlessly across desktop, tablet, and mobile devices without disrupting the existing customer base.",
        block_ids: ["challenge-1"],
      },
      {
        heading: "Role",
        body: `Lead Product Designer and UX Strategist. Responsibilities included:
- Conducting user research and usability testing
- Creating wireframes and interactive prototypes
- Designing the complete UI system
- Collaborating with engineering on implementation
- A/B testing and performance optimization`,
        block_ids: ["role-1"],
      },
      {
        heading: "Decision",
        body: "After evaluating three different approaches, we decided to implement a progressive disclosure pattern that would show users only the information they needed at each step. We chose to build a custom design system rather than use an off-the-shelf solution to maintain brand consistency and ensure accessibility compliance.",
        block_ids: ["decision-1"],
      },
      {
        heading: "Solution",
        body: "The final solution featured a streamlined 3-step checkout with intelligent defaults, guest checkout option, and one-click reorder for returning customers. We implemented real-time address validation, smart payment method selection based on user location, and a progress indicator that built confidence throughout the process.",
        block_ids: ["solution-1"],
      },
      {
        heading: "Outcome",
        body: `The redesign delivered measurable results:
- 34% reduction in cart abandonment rate
- 42% faster checkout completion time
- 28% increase in mobile conversion rate
- 4.8/5 average user satisfaction score
- $3.1M additional annual revenue attributed to improved conversion

The new design system was adopted across other parts of the platform, creating consistency and reducing future design and development time by an estimated 40%.`,
        block_ids: ["outcome-1"],
      },
      {
        heading: "Reflection",
        body: "This project reinforced the importance of gradual rollouts and data-driven decision making. The most valuable insight came from observing that users didn't want the \"fastest\" checkout - they wanted confidence and clarity at each step. This led us to add micro-interactions and confirmation messages that actually increased perceived trust, even if they added a few seconds to the process.",
        block_ids: ["reflection-1"],
      },
    ],
    warnings: [],
  };

  const html = generateWebsiteHTML({
    payload: samplePayload,
    projectName: "Transforming the checkout experience for 2M+ monthly users",
    clientName: "TechRetail Co.",
    projectId: "ecommerce-redesign-2024",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
