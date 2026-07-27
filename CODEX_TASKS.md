# Phase 4 — Vision, Figma, Retrieval, Knowledge Base

## Goal

Add on-demand vision, Figma import, and project knowledge retrieval.

## Context

- IMAGE_ENGINE.md
- ROADMAP.md Phase 4
- AI_PIPELINE.md

## Acceptance Criteria

- Vision runs per asset only (never all uploads)
- Figma URL/key import creates source + frame assets (API optional)
- Knowledge base rebuilds from facts/sources/assets/blocks/claims
- Retrieval returns ranked hits deterministically
- Works without AI/Figma tokens

## Tests

- Unit: vision/figma/retrieval helpers
- Playwright: import → analyze → search

## Out of Scope

- Full embedding vector DB
- Auto-vision on every upload
