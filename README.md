# Phoenux Case Study Assembler

Internal application for reconstructing projects into reusable case studies.

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
