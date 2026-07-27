# Phase 1 — Application scaffold

## Goal

Stand up the Phase 1 foundation: Next.js app, database schema, auth-ready clients, projects, sources, and assets.

## Context

- PRODUCT.md
- ARCHITECTURE.md
- DATABASE.md
- IMAGE_ENGINE.md
- ROADMAP.md (Phase 1)
- AGENTS.md

## Acceptance Criteria

- App runs with `npm run dev`
- Works without Supabase via local JSON mode under `.data/`
- User can create a project, add a text source, and upload a file
- Image uploads create reusable asset records with permission metadata
- Supabase SQL migration covers Phase 1 tables + RLS
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run test:e2e` pass

## Constraints

- No AI features in Phase 1
- Deterministic summaries only
- Provenance on created records
- Images are assets, not page-specific files

## Tests

- Unit: schemas, summarization, local store
- Playwright: create project + text source

## Out of Scope

- Question engine UI
- Content blocks / outputs
- Extraction / gap detection / editorial AI
- Vision / Figma
