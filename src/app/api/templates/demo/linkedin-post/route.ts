import { NextResponse } from "next/server";
import { unsplashThemes } from "@/lib/services/unsplash";

export async function GET() {
  const postImage = unsplashThemes.results("linkedin-post-demo");
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinkedIn Post - Case Study</title>
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
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-8">
  <div class="max-w-2xl w-full">
    <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center">
          <div class="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full mr-4 flex items-center justify-center text-white text-xl font-bold">
            YN
          </div>
          <div>
            <p class="font-bold text-gray-900 text-lg">Your Name</p>
            <p class="text-sm text-gray-600">Product Designer | UX Strategist • 2h</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4 text-gray-800">
        <p class="text-xl leading-relaxed font-medium">
          💡 <strong class="text-gray-900">Users don't want the "fastest" experience — they want confidence.</strong>
        </p>
        
        <p class="text-lg leading-relaxed">
          After redesigning an e-commerce checkout flow, we discovered something surprising:
        </p>
        
        <p class="text-lg leading-relaxed">
          Adding micro-interactions and confirmation messages <em class="font-semibold text-gray-900">increased</em> perceived trust, 
          even though they added a few seconds to the process.
        </p>
        
        <p class="text-lg font-semibold text-gray-900 pt-2">
          The results?
        </p>
        
        <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">✓</span>
            <span class="text-lg font-semibold text-gray-800">34% reduction in cart abandonment</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">✓</span>
            <span class="text-lg font-semibold text-gray-800">28% increase in mobile conversion</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl">✓</span>
            <span class="text-lg font-semibold text-gray-800">$3.1M additional annual revenue</span>
          </div>
        </div>
        
        <p class="pt-4 text-gray-600 text-lg italic">
          Sometimes slower is faster. 🎯
        </p>
      </div>

      <!-- Featured Image -->
      <div class="px-6 pb-6">
        <img src="${postImage}" alt="Case study results" class="w-full rounded-xl" loading="lazy"/>
      </div>

      <!-- Hashtags -->
      <div class="px-6 pb-4">
        <p class="text-sm font-medium text-blue-600">
          #UXDesign #ProductDesign #Ecommerce #UserExperience #CaseStudy
        </p>
      </div>

      <!-- Engagement Bar -->
      <div class="px-6 py-4 border-t border-gray-100 flex justify-between items-center text-gray-600">
        <button class="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
          <span class="text-xl">👍</span>
          <span class="font-medium">Like</span>
        </button>
        <button class="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
          <span class="text-xl">💬</span>
          <span class="font-medium">Comment</span>
        </button>
        <button class="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
          <span class="text-xl">🔄</span>
          <span class="font-medium">Repost</span>
        </button>
        <button class="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
          <span class="text-xl">📤</span>
          <span class="font-medium">Send</span>
        </button>
      </div>
    </div>

    <div class="text-center mt-8">
      <p class="text-gray-600 font-medium">LinkedIn Post Preview</p>
      <p class="text-sm text-gray-500 mt-1">Optimized for maximum engagement</p>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
