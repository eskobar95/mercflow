---
command_name: commit-sync
description: Commit and push Paperclip sync artifacts before orchestration begins.
---

# APM 1.0.1 - Commit Sync Gate Command

## 1. Overview

This command persists the planning-to-Paperclip sync state into git so orchestration starts from a versioned, auditable snapshot.

It is intended to run **after** `/apm-2.5-sync-paperclip` and **before** `/apm-2.7-start-orchestration`.

---

## 2. Preconditions

Verify:

- Sync report exists at `.paperclip/sync/batch-N-sync.md` (or equivalent documented path).
- Any modified planning/process docs are intentional.
- User has confirmed branch target for this commit.

If these are not true, stop and ask the User for confirmation.

---

## 3. Procedure

1. Inspect working tree (`git status`, `git diff`) and list files related to APM/Paperclip sync.
2. Stage only relevant artifacts:
   - `.paperclip/**` sync/runbook/process updates
   - `.cursor/commands/**` related command updates
   - Optional APM planning artifacts if intentionally part of the snapshot
3. Create a conventional commit message, for example:
   - `chore(apm): sync batch-N plan into paperclip issue graph`
4. Commit changes.
5. Push to the active branch (or branch provided by User).
6. Confirm push result and provide:
   - commit sha
   - branch name
   - concise file summary

If push is blocked, report the exact blocker and next user action.

---

## 4. Output Contract

Return a short “sync committed” summary containing:

- Batch number
- Commit sha
- Branch
- Push status
- Next command: `/apm-2.7-start-orchestration`

---

## 5. Operating Rules

- Do not include unrelated working-tree changes.
- Do not amend earlier commits unless User explicitly requests it.
- Do not force push unless User explicitly requests it.
- This command does not dispatch workers; it only finalizes sync state.

---

**End of Command**

