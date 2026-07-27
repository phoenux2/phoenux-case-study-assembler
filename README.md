# Phoenux Case Study Assembler

Internal application for reconstructing projects into reusable case studies.

## Status

Phase 1–4 foundations are implemented:

- Next.js + TypeScript + Tailwind + shadcn/ui
- Projects, sources, assets, questions, blocks, outputs, review
- AI pipeline with deterministic fallbacks + cache
- On-demand vision, Figma import, knowledge base retrieval
- Local JSON mode when Supabase env vars are missing

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase credentials the app runs in **local mode** and stores data under `.data/`.

### Supabase

1. Create a Supabase project
2. Run `supabase/migrations/001_initial.sql` in the SQL editor
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
4. Restart `npm run dev`

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
