---
command_name: sync-paperclip
description: Synchronize approved APM planning artifacts into Paperclip issues before orchestration starts.
---

# APM 1.0.1 - Paperclip Sync Gate Command

## 1. Overview

This command runs the **Sync Gate** between local APM planning and Paperclip execution.

You are operating as a Manager-level coordination agent. Your goal is to transfer the approved batch plan into Paperclip in a deterministic way so Walter can orchestrate from a complete and validated issue graph.

This command does **not** start implementation execution. It prepares Paperclip for execution.

---

## 2. Inputs and Preconditions

Before syncing, verify these artifacts exist and are approved:

- `.apm/spec.md`
- `.apm/plan.md`
- `.apm/tracker.md`
- `AGENTS.md` (rules context)
- `.paperclip/WORKFLOW.md`

If approvals are missing or ambiguous, stop and ask the User to confirm the approved planning state first.

Extract the active batch context from the planning artifacts:

- Batch number (for title/label consistency)
- Batch scope and objectives
- Workstreams/tasks
- Dependencies
- Reviewer/approver expectations

---

## 3. Paperclip Sync Procedure

Use Paperclip MCP tooling (or equivalent project integration) to apply the following in order:

1. Ensure the Paperclip project exists and target it (`MercFlow` by default unless User overrides).
2. Create or update the batch orchestration issue:
   - Title format: `[Batch N] <name> — Orchestration`
   - Include source document link(s) and explicit batch number
   - Apply `batch-N` and `mercflow` labels
   - Assign to Walter
3. Create or update execution issues derived from approved plan Tasks:
   - Use consistent title pattern (`Backend`, `Frontend`, `Review`, etc.)
   - Parent linkage is optional; `batch-N` + issue-id list + blockers is required
   - Set assignee according to plan
   - Set reviewer/approver according to workflow
   - Apply role labels (`backend`, `frontend`, `review`, `docs`, etc.)
4. Apply dependency graph using Paperclip `Blocked by` relationships (not text-only dependencies).
5. Keep execution issues in `backlog` by default unless explicitly marked ready by orchestration policy.
6. Write an explicit issue-id roster into the orchestration issue description/comment:
   - `MER-<id> — <title> — <owner> — <blocked by>`
7. Validate graph completeness:
   - Every execution issue is in the batch roster
   - Every dependency is represented in `Blocked by`
   - No orphan issue remains outside batch labels/roster
8. Write/update a sync report in repo:
   - Path: `.paperclip/sync/batch-N-sync.md`
   - Include orchestration issue id, created/updated sub-issue ids, dependency summary, and unresolved questions.

If any required mapping cannot be inferred safely, do **not** guess. Record it in sync report under “Needs human decision” and request User input.

---

## 4. Output Contract

At completion, provide a concise sync summary:

- Batch number
- Orchestration issue id/link
- Number of execution issues created/updated
- Dependency graph status (complete / incomplete)
- Outstanding decisions (if any)

Then instruct User to run:

- `/apm-2.6-commit-sync` to persist the sync artifacts in git
- `/apm-2.7-start-orchestration` to trigger Walter once sync is committed and pushed

---

## 5. Operating Rules

- Do not start coding tasks or worker dispatch in this command.
- Do not mutate planning intent; sync only approved plan/spec content.
- Keep naming deterministic so repeated runs are idempotent.
- Treat this as a gate: execution starts only after sync + commit/push + orchestration trigger.

---

**End of Command**

