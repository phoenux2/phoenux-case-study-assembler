import type { OutputPayload } from "@/lib/db/block-types";
import type { Asset } from "@/lib/db/types";
import { unsplashThemes } from "@/lib/services/unsplash";

export interface HTMLGeneratorOptions {
  payload: OutputPayload;
  assets?: Asset[];
  projectName?: string;
  clientName?: string;
  projectId?: string;
}

export function generateWebsiteHTML(options: HTMLGeneratorOptions): string {
  const { payload, assets = [], projectName, clientName, projectId = "demo" } = options;
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  // Get themed images for different sections
  const sectionImages: Record<string, string> = {
    hero: unsplashThemes.hero(projectId),
    challenge: unsplashThemes.challenge(projectId),
    solution: unsplashThemes.solution(projectId),
    design: unsplashThemes.design(projectId),
    process: unsplashThemes.process(projectId),
    results: unsplashThemes.results(projectId),
    team: unsplashThemes.team(projectId),
  };

  const getImageForSection = (heading: string, index: number): string => {
    const lower = heading.toLowerCase();
    if (lower.includes("challenge") || lower.includes("problem")) return sectionImages.challenge;
    if (lower.includes("solution") || lower.includes("approach")) return sectionImages.solution;
    if (lower.includes("design") || lower.includes("system")) return sectionImages.design;
    if (lower.includes("process") || lower.includes("workflow")) return sectionImages.process;
    if (lower.includes("result") || lower.includes("outcome") || lower.includes("impact"))
      return sectionImages.results;
    if (lower.includes("team") || lower.includes("role")) return sectionImages.team;
    // Default rotation for other sections
    const themes = [sectionImages.design, sectionImages.solution, sectionImages.process];
    return themes[index % themes.length];
  };

  const assetHTML = (assetIds?: string[]) => {
    if (!assetIds || assetIds.length === 0) return "";
    return assetIds
      .map((id) => {
        const asset = assetMap.get(id);
        if (!asset) return "";
        return `
          <div class="my-12">
            <img 
              src="${asset.storage_path || `/api/assets/${id}`}" 
              alt="${asset.title || "Project image"}"
              class="w-full rounded-2xl shadow-2xl"
              loading="lazy"
            />
            ${asset.title ? `<p class="text-sm text-gray-500 mt-4 text-center font-medium">${asset.title}</p>` : ""}
          </div>
        `;
      })
      .join("");
  };

  const sectionsHTML = payload.sections
    .map((section, index) => {
      const sectionImage = getImageForSection(section.heading, index);
      const hasAssets = section.asset_ids && section.asset_ids.length > 0;
      
      return `
    <section class="mb-24">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div class="${index % 2 === 0 ? "lg:order-1" : "lg:order-2"}">
          <h2 class="text-4xl font-black mb-6 text-gray-900 leading-tight">${section.heading}</h2>
          <div class="prose prose-lg max-w-none">
            <p class="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">${section.body}</p>
          </div>
        </div>
        <div class="${index % 2 === 0 ? "lg:order-2" : "lg:order-1"}">
          ${hasAssets ? assetHTML(section.asset_ids) : `
          <img 
            src="${sectionImage}" 
            alt="${section.heading}" 
            class="w-full rounded-2xl shadow-2xl"
            loading="lazy"
          />`}
        </div>
      </div>
    </section>
  `;
    })
    .join("");

  const warningsHTML =
    payload.warnings.length > 0
      ? `
    <!-- Warnings (visible in source, hidden from public view) -->
    <!--
    ${payload.warnings.map((w) => `  - ${w}`).join("\n")}
    -->
  `
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.title}${clientName ? ` | ${clientName}` : ""}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .hero-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  </style>
</head>
<body class="bg-white">
  <!-- Hero Section -->
  <div class="hero-gradient text-white relative overflow-hidden">
    <div class="absolute inset-0 opacity-10">
      <img src="${sectionImages.hero}" alt="Hero background" class="w-full h-full object-cover"/>
    </div>
    <div class="relative max-w-7xl mx-auto px-6 py-32 lg:py-48">
      ${clientName ? `<p class="text-sm uppercase tracking-widest text-white/80 mb-4 font-bold">${clientName}</p>` : ""}
      <h1 class="text-6xl lg:text-7xl font-black mb-6 leading-tight">
        ${payload.title}
      </h1>
      ${projectName ? `<p class="text-2xl text-white/90 font-medium max-w-3xl">${projectName}</p>` : ""}
    </div>
  </div>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-6 py-24">
    ${sectionsHTML}
  </main>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-16">
    <div class="max-w-7xl mx-auto px-6 text-center">
      <p class="text-lg font-semibold mb-2">Generated by Phoenux Case Study Assembler</p>
      <p class="text-gray-400">© ${new Date().getFullYear()} All rights reserved</p>
    </div>
  </footer>

  ${warningsHTML}
</body>
</html>`;
}

export function generateLinkedInCarouselHTML(options: HTMLGeneratorOptions): string {
  const { payload, projectId = "demo" } = options;
  const slides = payload.slides || payload.sections.slice(0, 12);

  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  ];

  const slidesHTML = slides
    .map((slide, index) => {
      const heading =
        "title" in slide && typeof slide.title === "string"
          ? slide.title
          : "heading" in slide
            ? slide.heading
            : "Slide";
      
      const isFirst = index === 0;
      const isLast = index === slides.length - 1;
      const gradient = gradients[index % gradients.length];
      const bgImage = unsplashThemes.abstract(`${projectId}-${index}`);

      if (isFirst) {
        // Hero slide with background image
        return `
    <div class="slide relative overflow-hidden" style="width: 1080px; height: 1080px; background: ${gradient};">
      <div class="absolute inset-0 opacity-20">
        <img src="${bgImage}" alt="" class="w-full h-full object-cover"/>
      </div>
      <div class="relative h-full flex flex-col justify-center items-center text-center p-16 text-white">
        <h2 class="text-7xl font-black mb-8 leading-tight">${heading}</h2>
        <p class="text-3xl font-semibold leading-relaxed max-w-3xl">${slide.body}</p>
        <div class="absolute bottom-12 right-12 text-white/60 text-lg font-bold">
          ${index + 1} / ${slides.length}
        </div>
      </div>
    </div>
  `;
      } else if (isLast) {
        // CTA slide
        return `
    <div class="slide relative overflow-hidden" style="width: 1080px; height: 1080px; background: ${gradient};">
      <div class="absolute inset-0 opacity-10">
        <img src="${bgImage}" alt="" class="w-full h-full object-cover"/>
      </div>
      <div class="relative h-full flex flex-col justify-center items-center text-center p-16 text-white">
        <h2 class="text-6xl font-black mb-8">${heading}</h2>
        <p class="text-3xl font-medium leading-relaxed max-w-3xl">${slide.body}</p>
        <div class="mt-12 text-5xl">👋</div>
        <div class="absolute bottom-12 right-12 text-white/60 text-lg font-bold">
          ${index + 1} / ${slides.length}
        </div>
      </div>
    </div>
  `;
      } else {
        // Content slides with clean layout
        return `
    <div class="slide bg-white relative" style="width: 1080px; height: 1080px;">
      <div class="h-full p-16 flex flex-col justify-center">
        <div class="mb-auto pt-4">
          <div class="w-20 h-2 rounded-full mb-8" style="background: ${gradient};"></div>
        </div>
        <div>
          <h2 class="text-6xl font-black mb-8 text-gray-900 leading-tight">${heading}</h2>
          <p class="text-3xl text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">${slide.body}</p>
        </div>
        <div class="mt-auto pt-12 flex justify-between items-center">
          <div class="w-16 h-16 rounded-full" style="background: ${gradient};"></div>
          <div class="text-gray-400 text-xl font-bold">${index + 1} / ${slides.length}</div>
        </div>
      </div>
    </div>
  `;
      }
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.title} - LinkedIn Carousel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body class="bg-gray-100 p-12">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-black mb-3">${payload.title}</h1>
      <p class="text-gray-600 text-lg">LinkedIn Carousel - 1080x1080px per slide</p>
      <p class="text-gray-500 mt-2">Scroll to see all ${slides.length} slides</p>
    </div>
    <div class="space-y-12">
      ${slidesHTML}
    </div>
  </div>
</body>
</html>`;
}

export function generateUpworkHTML(options: HTMLGeneratorOptions): string {
  const { payload, clientName, projectId = "demo" } = options;

  const icons: Record<string, string> = {
    challenge: "🎯",
    role: "👤",
    solution: "💡",
    outcome: "📈",
  };

  const getIcon = (heading: string): string => {
    const lower = heading.toLowerCase();
    if (lower.includes("challenge") || lower.includes("problem")) return icons.challenge;
    if (lower.includes("role")) return icons.role;
    if (lower.includes("solution") || lower.includes("approach")) return icons.solution;
    if (lower.includes("outcome") || lower.includes("result")) return icons.outcome;
    return "▪️";
  };

  const projectImages = [
    unsplashThemes.solution(projectId),
    unsplashThemes.design(projectId),
    unsplashThemes.results(projectId),
  ];

  const sectionsHTML = payload.sections
    .map(
      (section) => `
    <div class="mb-10">
      <h3 class="text-2xl font-black mb-4 text-gray-900 flex items-center gap-3">
        <span class="text-3xl">${getIcon(section.heading)}</span>
        ${section.heading}
      </h3>
      <p class="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">${section.body}</p>
    </div>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.title} - Portfolio Entry</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body class="bg-gray-50">
  <div class="max-w-5xl mx-auto px-6 py-12">
    <!-- Header -->
    <div class="mb-12 bg-white rounded-2xl p-10 shadow-lg">
      <h1 class="text-4xl font-black mb-3 text-gray-900">${payload.title}</h1>
      ${clientName ? `<p class="text-xl text-gray-600 font-medium">${clientName}</p>` : ""}
    </div>

    <!-- Project Images Gallery -->
    <div class="grid grid-cols-3 gap-4 mb-12">
      ${projectImages.map((img) => `
        <img src="${img}" alt="Project preview" class="w-full h-48 object-cover rounded-xl shadow-md" loading="lazy"/>
      `).join("")}
    </div>

    <!-- Content Sections -->
    <div class="bg-white rounded-2xl p-10 shadow-lg">
      ${sectionsHTML}

      <!-- Skills Tags -->
      <div class="mt-12 pt-8 border-t border-gray-200">
        <h4 class="text-lg font-bold mb-4 text-gray-700">Skills & Technologies</h4>
        <div class="flex flex-wrap gap-2">
          <span class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-semibold">UX Design</span>
          <span class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-sm font-semibold">Product Strategy</span>
          <span class="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-full text-sm font-semibold">User Research</span>
          <span class="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full text-sm font-semibold">Design Systems</span>
          <span class="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full text-sm font-semibold">Prototyping</span>
          <span class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full text-sm font-semibold">A/B Testing</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
