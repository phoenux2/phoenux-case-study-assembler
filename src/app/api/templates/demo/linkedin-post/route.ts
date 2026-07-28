import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinkedIn Post - Case Study</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-8">
  <div class="max-w-xl">
    <div class="bg-white rounded-xl shadow-lg p-8">
      <div class="flex items-center mb-6">
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mr-4"></div>
        <div>
          <p class="font-bold text-gray-900">Your Name</p>
          <p class="text-sm text-gray-500">Product Designer | UX Strategist</p>
        </div>
      </div>

      <div class="space-y-4 text-gray-800">
        <p class="text-lg leading-relaxed">
          💡 <strong>Users don't want the "fastest" experience — they want confidence.</strong>
        </p>
        
        <p>
          After redesigning an e-commerce checkout flow, we discovered something surprising:
        </p>
        
        <p>
          Adding micro-interactions and confirmation messages <em>increased</em> perceived trust, 
          even though they added a few seconds to the process.
        </p>
        
        <p className="font-semibold">
          The results?
        </p>
        
        <ul class="space-y-2 ml-6">
          <li>✓ 34% reduction in cart abandonment</li>
          <li>✓ 28% increase in mobile conversion</li>
          <li>✓ $3.1M additional annual revenue</li>
        </ul>
        
        <p class="pt-4 text-gray-600">
          Sometimes slower is faster. 🎯
        </p>
        
        <p class="text-sm text-gray-500 pt-4 border-t">
          #UXDesign #ProductDesign #Ecommerce #UserExperience
        </p>
      </div>

      <div class="flex gap-6 mt-6 pt-4 border-t text-gray-600 text-sm">
        <button class="hover:text-blue-600">👍 Like</button>
        <button class="hover:text-blue-600">💬 Comment</button>
        <button class="hover:text-blue-600">🔄 Repost</button>
        <button class="hover:text-blue-600">📤 Send</button>
      </div>
    </div>

    <div class="text-center mt-8 text-sm text-gray-500">
      <p>LinkedIn Post Preview (550px width recommended)</p>
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
