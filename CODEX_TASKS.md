# Hardening — navigation, proxy, environment

## Goal

Polish the post-roadmap app for daily use: Next.js proxy migration, clearer navigation, system status, and cloud agent bootstrap.

## Acceptance Criteria

- `src/proxy.ts` replaces deprecated middleware
- Sticky header + project section anchors
- System status chips for data/AI/Figma mode
- `.cursor/environment.json` for install/dev
- Existing unit + e2e suite still green

## Out of Scope

- Production Supabase provisioning
- Embedding-based retrieval
