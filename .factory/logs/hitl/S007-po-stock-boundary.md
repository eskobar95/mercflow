# HITL — S007 / T023 — PO receipt vs Medusa stock

**Date:** 2026-06-04  
**Sprint:** S007  
**Task:** T023  

## Decision

**MercFlow receipt records only** on `POST /admin/purchase-orders/:id/receive`. No automatic Medusa `inventory_item` / reservation mutation in T023.

## Rationale

- Aligns with `AGENTS.md` and inventory-module README: PO receipt must not silently mutate Medusa stock.
- Factory task recommendation and PRD-batch2 tension (“automatic on receive”) resolved in favor of explicit operator control.
- UI must label **receipt recorded** vs **stock applied** (stock apply deferred; not in T023 scope).

## Out of scope (T023)

- `Apply to stock` action and Medusa inventory API integration (future task if needed).

## Approved by

Harness `/run-sprint S007` with project-default boundary (operator Nicklas).
