# Phoenux Case Study Assembler

Internal application for reconstructing projects into reusable case studies.

## Status

Phases 1–4 are implemented. Hardening + output layout composer are on `main`.
Next work is Phases 5–11 — see [ROADMAP.md](ROADMAP.md).

- Next.js + TypeScript + Tailwind + shadcn/ui
- Projects, sources, assets, questions, blocks, outputs, review
- AI pipeline with deterministic fallbacks + cache
- On-demand vision, Figma import, knowledge base retrieval
- Local JSON mode when Supabase env vars are missing
- Output layout composer (QnA → reorder / include / polish)
- Hard public export gate

## Phone testing

**Live URL:** https://phoenux-case-study-assembler.vercel.app

`AI_ENABLED=false` is set on Vercel so the assembler path runs without AI.

### Durable data (required for phone)

Vercel serverless cannot keep `.data/` between requests. For a real phone trial:

1. Create a Supabase project
2. In the SQL editor, run in order:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_question_engine.sql`
   - `supabase/migrations/003_facts.sql`
   - `supabase/migrations/004_knowledge.sql`
3. In Vercel → Project → Settings → Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy (`git push` to `main` or `vercel deploy --prod`)

Until those vars are set, the site shows a red “needs Supabase” banner and data will not persist.

### Same-Wi‑Fi fallback (Mac local)

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

On your phone (same Wi‑Fi), open `http://<your-mac-lan-ip>:3000`.

### Phone smoke checklist

1. Create project
2. Add a text source + upload an image
3. Answer adaptive questions
4. Rebuild blocks → approve a few
5. Assemble website output
6. Reorder or exclude a slot (arrows on phone); confirm preview updates
7. Confirm export fails if an asset is still internal/unapproved

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase credentials the app runs in **local mode** and stores data under `.data/`.

### Supabase

1. Create a Supabase project
2. Run migrations `001`–`004` in the SQL editor
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (or Vercel env)
4. Restart `npm run dev` / redeploy

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright |

## Reading Order

Every engineer, Cursor session, or Codex task should read these documents in order before making architectural decisions.

1. README.md
2. PRODUCT.md
3. ARCHITECTURE.md
4. DATABASE.md
5. QUESTION_ENGINE.md
6. IMAGE_ENGINE.md
7. CONTENT_BLOCKS.md
8. AI_PIPELINE.md
9. OUTPUTS.md
10. SECURITY.md
11. ROADMAP.md
12. AGENTS.md

---

## Repository Rules

- Do not introduce AI where deterministic code is sufficient.
- Assemble content before generating new text.
- Every public claim must have provenance.
- Images are reusable assets, not page-specific files.
- The application must remain usable with AI disabled.
- AI requests must be cached and token-efficient.
- Public exports must pass claim and permission validation.

---

## Development Workflow

Every feature follows this lifecycle:

Idea
↓
Specification
↓
Database
↓
Backend
↓
Frontend
↓
Tests
↓
Review
↓
Merge

Every implementation task should reference `CODEX_TASKS.md`.

Cursor users should also follow the rules defined in `.cursorrules`.
