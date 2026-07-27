# Roadmap Phases 5–11 + phone deploy docs

## Goal

Publish the next-seven-phases roadmap, land the tip on `main`, deploy a phone-testable Vercel URL, and document Supabase wiring + smoke checklist.

## Acceptance Criteria

- ROADMAP.md lists Phases 5–11
- `main` includes export gate + layout composer
- Vercel production URL live with `AI_ENABLED=false`
- README documents phone URL, Supabase steps, and smoke checklist
- Ephemeral-host warning when Vercel runs without Supabase
- Phone-friendly slot reorder controls (up/down arrows)

## Out of Scope

- Creating the user’s Supabase project (requires their dashboard / access token)
- Full Phase 5–11 feature implementation
