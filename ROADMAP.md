# Roadmap

Phase 1 — Foundation ✅

Authentication

Projects

Uploads

Assets

Questions

No AI

---

Phase 2 — Assembly ✅

Content Blocks

Outputs

Review

PDF

---

Phase 3 — AI pipeline ✅

Extraction

Gap Detection

Question Refinement

Claim Review

Editorial

---

Phase 4 — Integrations ✅

Vision

Figma

Retrieval

Knowledge Base

---

Hardening (bridge) ✅ / partial

Proxy/auth session layer ✅

Navigation & section anchors ✅

Cloud agent environment bootstrap ✅

Hard public export gate (claims + assets + evidence) ✅

Output layout composer (QnA → drag-tweak) ✅

---

Phase 5 — Traceable export safety

Structured `ExportViolation` / export-readiness UI

Provenance invalidation when answers, assets, or evidence change

---

Phase 6 — Prompt truth + AI-off proof

Single prompt registry (no duplicated `docs/PROMPTS.md` bodies)

AI cache includes model and schema versions

Playwright AI-off + local-mode full workflow test

---

Phase 7 — Mobile output composer

Phone-usable Compose / Preview / Publish

Touch-friendly drag-and-drop

Responsive Collect → Clarify → Build → Review → Publish workflow

---

Phase 8 — Fact vs claim lifecycle

Explicit fact → claim candidate → approved claim

Claims require evidence

Facts do not need editorial approval

---

Phase 9 — Knowledge scopes + domain cleanup

Project vs organization knowledge separation

Remove `phase4` naming from domains and UI

Retrieval never promotes org knowledge to project history

---

Phase 10 — Production wiring

Supabase migrations 001–004 live

Host env + real auth

Asset storage

---

Phase 11 — Observability + audit

AI cost / latency / cache metrics

Who approved what

Repository interface so services stop branching on local vs Supabase
