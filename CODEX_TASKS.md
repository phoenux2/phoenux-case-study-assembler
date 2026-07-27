# Phase 3 — AI pipeline

## Goal

Add extraction, gap detection, question refinement, claim review, and editorial with cached AI calls and deterministic fallbacks.

## Context

- AI_PIPELINE.md
- docs/PROMPTS.md
- AGENTS.md
- ROADMAP.md Phase 3

## Acceptance Criteria

- Prompt registry references docs/PROMPTS.md IDs/versions
- AI disabled path works end-to-end
- Requests are cached by prompt id/version/input hash
- Facts stored with provenance
- Claim review flags unsupported metrics / blocked assets
- Editorial does not invent facts

## Constraints

- Never resend raw project files
- AI receives summaries only
- App usable with AI disabled

## Tests

- Unit: deterministic tasks + prompt hashing + extraction integration
- Playwright: extraction with AI disabled

## Out of Scope

- Vision / Figma / retrieval knowledge base
