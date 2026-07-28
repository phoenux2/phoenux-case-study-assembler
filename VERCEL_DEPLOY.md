# Deploy to Vercel - Quick Start

## Option 1: Deploy via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
# From project root
cd /Users/shahrukh/phoenux-case-study-assembler

# Deploy to preview
vercel

# OR deploy directly to production
vercel --prod
```

The CLI will:
- ✓ Detect Next.js automatically
- ✓ Upload your code
- ✓ Build the application
- ✓ Deploy to a unique URL
- ✓ Give you a production URL

---

## Option 2: Deploy via Vercel Dashboard

### Step 1: Push to GitHub (Already Done ✓)
Your code is already pushed to:
```
https://github.com/phoenux2/phoenux-case-study-assembler
Branch: cursor/vercel-template-hosting-4071
```

### Step 2: Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select `phoenux2/phoenux-case-study-assembler`
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 3: Configure Environment Variables (Optional)
Add these if you want database features:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Note**: App works in local mode without these!

### Step 4: Deploy
Click "Deploy" and wait ~2 minutes.

---

## Your Template URLs

Once deployed, access templates at:

### Main Pages
- **Templates Showcase**: `https://your-app.vercel.app/templates`
- **Home**: `https://your-app.vercel.app/`

### Live Demos (Direct HTML)
- **Website**: `https://your-app.vercel.app/api/templates/demo/website`
- **LinkedIn Carousel**: `https://your-app.vercel.app/api/templates/demo/linkedin-carousel`
- **LinkedIn Post**: `https://your-app.vercel.app/api/templates/demo/linkedin-post`
- **Upwork**: `https://your-app.vercel.app/api/templates/demo/upwork`
- **PDF**: `https://your-app.vercel.app/api/templates/demo/pdf`

### Interactive Previews
- `https://your-app.vercel.app/templates/preview/website`
- `https://your-app.vercel.app/templates/preview/linkedin-carousel`
- `https://your-app.vercel.app/templates/preview/linkedin-post`
- `https://your-app.vercel.app/templates/preview/upwork`
- `https://your-app.vercel.app/templates/preview/pdf`

---

## Local Testing

The dev server is running at:
```
http://localhost:3000
```

Test the templates locally:
- **Showcase**: http://localhost:3000/templates
- **Website Demo**: http://localhost:3000/api/templates/demo/website
- **Carousel Demo**: http://localhost:3000/api/templates/demo/linkedin-carousel

---

## After Deployment

### Get Your URLs
Vercel will provide URLs like:
```
Production: https://phoenux-case-study-assembler.vercel.app
Preview: https://phoenux-case-study-assembler-git-cursor-vercel-4071.vercel.app
```

### Share Your Templates
Share individual template demos:
```
Website: https://your-app.vercel.app/api/templates/demo/website
LinkedIn: https://your-app.vercel.app/api/templates/demo/linkedin-carousel
```

### Custom Domain (Optional)
1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `templates.yourdomain.com`)
3. Update DNS records
4. Templates available at `https://templates.yourdomain.com/`

---

## Troubleshooting

### Build Fails
```bash
# Test build locally first
npm run build

# Check TypeScript
npm run typecheck

# Check logs
vercel logs your-deployment-url
```

### Templates Not Loading
- Clear browser cache
- Check Vercel function logs
- Verify API routes in dashboard

### Need Help?
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Project Issues: Open issue on GitHub

---

## What's Included

✓ 5 Professional Templates
✓ API Routes for Dynamic Generation
✓ Static Preview Pages
✓ Responsive Tailwind Design
✓ Edge Caching (1 hour)
✓ SEO Optimized
✓ Zero Configuration

Ready to deploy! 🚀
