# Output layout composer

## Goal

After Q&A assembles blocks, users can tweak channel outputs via drag-reorder, include/exclude, and light copy polish — without inventing facts or losing provenance.

## Acceptance Criteria

- Outputs store an editable `layout.slots` recipe linked to `block_id`
- Render payload is derived from layout + current block bodies
- Drag-and-drop reorder, include toggles, and polish sheet persist
- Saving layout resets output approval to draft
- Unit tests cover seed / reorder / derive

## Out of Scope

- Freeform canvas / absolute positioning
- AI rewrite during layout edits
- Provenance invalidation cascade (separate P0 item)
