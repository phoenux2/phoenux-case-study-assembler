# Phase 1 — Question engine

## Goal

Add deterministic adaptive questions (no AI) so projects gather missing coverage one question at a time.

## Context

- QUESTION_ENGINE.md
- DATABASE.md
- ROADMAP.md Phase 1
- Existing projects / sources / assets scaffold

## Acceptance Criteria

- Coverage model selects the next applicable gap only
- Every question explains why it is asked
- Answers persist with provenance and optional asset links
- Project detail shows coverage progress and one question panel
- Unit + Playwright coverage for adaptive flow

## Constraints

- No AI / no giant forms
- Deterministic coverage only
- Images remain reusable assets

## Tests

- Unit: coverage evaluation + answer parsing
- Playwright: answer problem → role → audience

## Out of Scope

- AI gap detection / question refinement
- Content blocks and exports
