---
command_name: start-orchestration
description: Trigger Walter orchestration after Paperclip sync has been committed and pushed.
---

# APM 1.0.1 - Start Orchestration Command

## 1. Overview

This command starts execution orchestration in Paperclip by handing control to Walter on the batch orchestration issue.

It should run only after:

1. planning is approved,
2. Paperclip issue graph is synced,
3. sync artifacts are committed and pushed.

---

## 2. Preconditions

Verify all of the following:

- Batch orchestration issue exists in Paperclip.
- Execution issues exist and are listed by issue ID in orchestration context.
- `Blocked by` dependency graph is populated.
- Required labels/reviewer/approver assignments are present.
- Sync commit has been pushed to git.

If any precondition fails, stop and direct User back to the relevant gate command.

---

## 3. Walter Trigger Procedure

1. Post a trigger comment/instruction on the orchestration issue (or assign Task to Walter, depending on Paperclip flow) with this intent:
   - validate batch number + source document
   - validate issue graph and blockers by issue ID
   - confirm execution order and first ready tasks (`backlog` -> `todo`)
   - escalate unresolved decisions
2. Ensure Walter is the assignee for orchestration.
3. Run/trigger Walter heartbeat.
4. Capture resulting orchestration summary:
   - graph validation status
   - first tasks ready now
   - blocked tasks and reasons
   - unresolved human decisions
5. Write a short kickoff note in repo:
   - Path: `.paperclip/sync/batch-N-kickoff.md`
   - Include timestamp, orchestration issue link/id, and Walter output summary.

---

## 4. Output Contract

Return:

- orchestration issue id/link
- Walter trigger confirmation
- ready tasks list
- blocked tasks list
- unresolved decisions

Then advise User that execution is now running in Paperclip and they can monitor/await reports.

---

## 5. Operating Rules

- Do not bypass sync/commit gates.
- Do not rewrite planning scope at orchestration start.
- Use Walter as orchestrator; keep execution issues in `backlog` until dependency-ready.
- Walter should not bulk-start all issues. He should release and assign next-ready issues incrementally.

---

**End of Command**

