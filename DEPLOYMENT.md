# Deployment Guide

## Vercel Deployment

This application is ready to deploy to Vercel with zero configuration.

### Quick Deploy

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Environment Variables

Configure these in your Vercel project dashboard:

#### Required for Database Features
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

#### Optional (for AI features)
- `OPENAI_API_KEY` - For AI-powered content generation
- `ANTHROPIC_API_KEY` - Alternative AI provider

**Note**: The app works in local-only mode without these variables, storing data in `.data/` directory.

### Vercel Dashboard Setup

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Vercel will auto-detect Next.js configuration
4. Add environment variables in Settings → Environment Variables
5. Deploy

### Template Routes

Once deployed, your templates will be available at:

- **Templates Showcase**: `https://your-domain.vercel.app/templates`
- **Website Demo**: `https://your-domain.vercel.app/api/templates/demo/website`
- **LinkedIn Carousel**: `https://your-domain.vercel.app/api/templates/demo/linkedin-carousel`
- **LinkedIn Post**: `https://your-domain.vercel.app/api/templates/demo/linkedin-post`
- **Upwork Portfolio**: `https://your-domain.vercel.app/api/templates/demo/upwork`
- **PDF Presentation**: `https://your-domain.vercel.app/api/templates/demo/pdf`

### Preview Pages

Interactive previews with embedded demos:

- `https://your-domain.vercel.app/templates/preview/website`
- `https://your-domain.vercel.app/templates/preview/linkedin-carousel`
- `https://your-domain.vercel.app/templates/preview/linkedin-post`
- `https://your-domain.vercel.app/templates/preview/upwork`
- `https://your-domain.vercel.app/templates/preview/pdf`

### Custom Domain

1. In Vercel Dashboard, go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Templates will be available at `https://your-domain.com/templates`

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches and pull requests

### Build Configuration

The project includes:
- `vercel.json` - Vercel-specific configuration
- `.vercelignore` - Files to exclude from deployment
- Automatic Next.js optimization
- Edge caching for template API routes

### Monitoring

After deployment, monitor your app:
- **Analytics**: Vercel Dashboard → Analytics
- **Logs**: Vercel Dashboard → Logs
- **Performance**: Vercel Speed Insights

### Troubleshooting

**Build Fails**:
- Check build logs in Vercel dashboard
- Run `npm run build` locally to reproduce
- Verify all dependencies are in `package.json`

**Environment Variables**:
- Variables require redeployment to take effect
- Use preview deployments to test changes
- Prefix client-side variables with `NEXT_PUBLIC_`

**Templates Not Loading**:
- Verify API routes are not blocked
- Check function logs in Vercel dashboard
- Test routes locally with `npm run dev`

## Alternative Hosting

While optimized for Vercel, the app can be deployed to:
- **Netlify**: Use `next export` for static export
- **AWS Amplify**: Auto-detects Next.js
- **Docker**: See `Dockerfile` (if added)
- **Self-hosted**: Run `npm run build && npm start`

## Performance

The deployed templates feature:
- Server-side rendering for SEO
- Static generation for preview pages
- Edge caching for API routes (1 hour)
- Automatic image optimization
- Code splitting and lazy loading

---

For questions or issues, see [README.md](./README.md) or open an issue.
