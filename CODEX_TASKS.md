# Phase 2 — Content blocks, outputs, review, PDF

## Goal

Assemble reusable content blocks from answers, gate exports with review, and generate platform outputs including printable PDF.

## Context

- CONTENT_BLOCKS.md
- OUTPUTS.md
- SECURITY.md
- ROADMAP.md Phase 2

## Acceptance Criteria

- Rebuild creates deterministic blocks/claims from answers
- Approve/reject for blocks, claims, assets, outputs
- Assemble website / LinkedIn / Upwork / PDF from approved blocks only
- Blocked assets cannot export
- Print/Save PDF available on PDF and website outputs

## Constraints

- No AI editorial writing
- Outputs introduce no new facts
- Provenance preserved on assembled records

## Tests

- Unit: block assembly + export validation
- Playwright: rebuild → approve → assemble website

## Out of Scope

- AI extraction / gap detection / editorial polish
- Vision / Figma
