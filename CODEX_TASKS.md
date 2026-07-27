# Hardening — hard public export gate

## Goal

Enforce SECURITY.md before public export and output approval:
Permission → Claim Approval → Asset Approval → Output Approval.

## Acceptance Criteria

- Public export fails for blocked/internal/restricted referenced assets
- Referenced assets must be approved
- Approved claims require evidence; metric claims must be grounded
- Output approval re-runs the same validation gate
- Unit tests cover the gate

## Out of Scope

- Production Supabase provisioning
- Embedding-based retrieval
