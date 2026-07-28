import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Output Templates | Phoenux Case Study Assembler",
  description: "Preview and explore case study output templates",
};

const templates = [
  {
    id: "website",
    name: "Website Case Study",
    description: "Full narrative format with detailed sections and professional styling",
    preview: "/templates/preview/website",
    demo: "/api/templates/demo/website",
    features: [
      "Complete project story",
      "Multiple content sections",
      "Asset integration",
      "Responsive design",
    ],
  },
  {
    id: "linkedin-carousel",
    name: "LinkedIn Carousel",
    description: "8-12 slides optimized for LinkedIn (1080x1080px)",
    preview: "/templates/preview/linkedin-carousel",
    demo: "/api/templates/demo/linkedin-carousel",
    features: [
      "Visual storytelling",
      "1080x1080px slides",
      "Engaging graphics",
      "Social media ready",
    ],
  },
  {
    id: "linkedin-post",
    name: "LinkedIn Post",
    description: "Single insight format for quick social sharing",
    preview: "/templates/preview/linkedin-post",
    demo: "/api/templates/demo/linkedin-post",
    features: [
      "Concise messaging",
      "Key insight focus",
      "Quick to read",
      "High engagement",
    ],
  },
  {
    id: "upwork",
    name: "Upwork Portfolio",
    description: "Short portfolio entry with challenge-solution-outcome structure",
    preview: "/templates/preview/upwork",
    demo: "/api/templates/demo/upwork",
    features: [
      "Portfolio optimized",
      "Clear structure",
      "Results focused",
      "Skills highlighting",
    ],
  },
  {
    id: "pdf",
    name: "PDF Presentation",
    description: "Print-ready presentation format",
    preview: "/templates/preview/pdf",
    demo: "/api/templates/demo/pdf",
    features: [
      "Print optimized",
      "Professional layout",
      "Client ready",
      "Downloadable",
    ],
  },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Output Templates
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your project data into beautiful, ready-to-publish outputs.
            Choose from multiple formats designed for different platforms.
          </p>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {templates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                {template.name}
              </h3>
              <p className="text-gray-600 mb-4">{template.description}</p>
              
              <ul className="space-y-2 mb-6">
                {template.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-700">
                    <span className="text-green-600 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                <Link href={template.preview} className="flex-1">
                  <Button className="w-full">Preview</Button>
                </Link>
                <a href={template.demo} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full">Demo</Button>
                </a>
              </div>
            </Card>
          ))}
        </div>

        {/* Documentation Section */}
        <Card className="p-8 bg-white">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            How It Works
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-4">
              The Phoenux Case Study Assembler generates outputs by assembling
              approved content blocks — never introducing new information.
            </p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">Assembly Process</h3>
            <ol className="space-y-2 ml-6">
              <li>Collect evidence from sources (screenshots, Figma, documents)</li>
              <li>Answer questions about the project</li>
              <li>Generate and approve content blocks</li>
              <li>Validate claims with supporting evidence</li>
              <li>Assemble blocks into platform-specific outputs</li>
            </ol>

            <h3 className="text-xl font-bold mt-6 mb-3">Security & Validation</h3>
            <p>
              All public exports pass through strict validation:
            </p>
            <ul className="space-y-2 ml-6">
              <li>Project approval status check</li>
              <li>Claim evidence verification</li>
              <li>Asset permission validation</li>
              <li>Metric grounding in evidence</li>
            </ul>

            <h3 className="text-xl font-bold mt-6 mb-3">API Access</h3>
            <p>
              Generate outputs programmatically using our API:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mt-2 font-mono text-sm">
              GET /api/templates/generate?type=website&projectId=...
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/projects/new">
            <Button size="lg">Create Your First Case Study</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
