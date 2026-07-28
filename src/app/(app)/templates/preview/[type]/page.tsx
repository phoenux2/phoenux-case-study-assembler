import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const templateInfo = {
  website: {
    title: "Website Case Study Template",
    description:
      "Full narrative format with professional styling, responsive design, and complete project storytelling.",
    features: [
      "Complete project narrative",
      "Multiple content sections",
      "Asset integration support",
      "Responsive Tailwind design",
      "Print-friendly layout",
    ],
    apiEndpoint: "/api/templates/demo/website",
  },
  "linkedin-carousel": {
    title: "LinkedIn Carousel Template",
    description:
      "8-12 slides optimized for LinkedIn sharing (1080x1080px per slide).",
    features: [
      "Visual storytelling format",
      "1080x1080px slide dimensions",
      "Engaging color gradients",
      "Social media optimized",
      "Numbered slide indicators",
    ],
    apiEndpoint: "/api/templates/demo/linkedin-carousel",
  },
  "linkedin-post": {
    title: "LinkedIn Post Template",
    description:
      "Single insight format perfect for quick social media sharing.",
    features: [
      "Concise messaging",
      "Key insight focus",
      "Quick to consume",
      "High engagement format",
      "Mobile optimized",
    ],
    apiEndpoint: "/api/templates/demo/linkedin-post",
  },
  upwork: {
    title: "Upwork Portfolio Template",
    description:
      "Short portfolio entry with clear challenge-solution-outcome structure.",
    features: [
      "Portfolio optimized",
      "Challenge-Role-Solution-Outcome",
      "Results focused",
      "Skills tags included",
      "Client-ready format",
    ],
    apiEndpoint: "/api/templates/demo/upwork",
  },
  pdf: {
    title: "PDF Presentation Template",
    description: "Print-ready presentation format for client deliverables.",
    features: [
      "Print optimized",
      "Professional layout",
      "Executive summary",
      "Client ready",
      "Downloadable format",
    ],
    apiEndpoint: "/api/templates/demo/pdf",
  },
};

type TemplateType = keyof typeof templateInfo;

export default function TemplatePreviewPage({
  params,
}: {
  params: { type: string };
}) {
  const type = params.type as TemplateType;
  const template = templateInfo[type];

  if (!template) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/templates"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Templates
          </Link>
          <h1 className="text-4xl font-bold mb-4">{template.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{template.description}</p>

          <div className="bg-white rounded-lg p-6 shadow mb-8">
            <h2 className="text-2xl font-bold mb-4">Features</h2>
            <ul className="space-y-2">
              {template.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-gray-700">
                  <span className="text-green-600 mr-2 text-xl">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4 mb-8">
            <a
              href={template.apiEndpoint}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg">View Live Demo</Button>
            </a>
            <Link href="/projects/new">
              <Button variant="outline" size="lg">Use This Template</Button>
            </Link>
          </div>
        </div>

        {/* Embedded Preview */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-mono">{template.apiEndpoint}</span>
            <a
              href={template.apiEndpoint}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Open in new tab ↗
            </a>
          </div>
          <iframe
            src={template.apiEndpoint}
            className="w-full border-0"
            style={{ height: "calc(100vh - 400px)", minHeight: "600px" }}
            title={`${template.title} Preview`}
          />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2 text-blue-900">
            API Integration
          </h3>
          <p className="text-blue-800 mb-4">
            Generate this template programmatically for your projects:
          </p>
          <pre className="bg-white p-4 rounded border border-blue-200 overflow-x-auto text-sm">
            <code>
              {`GET /api/templates/generate
  ?type=${type}
  &projectId=YOUR_PROJECT_ID`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(templateInfo).map((type) => ({
    type,
  }));
}
