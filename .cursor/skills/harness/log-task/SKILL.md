---
name: log-task
description: Append a per-task entry to .factory/logs/diary.md when a harness task finishes, blocks, or is skipped
---

# Log-task skill

**Lead harness agent** runs this after every task reaches a terminal state (`done`, `blocked`, or `skipped`). Never skip logging when `/run-sprint` is active.

## When to run

| Event | Who runs log-task |
|-------|-------------------|
| Task → `in-progress` | Lead harness (optional short "started" entry) |
| Task → `done` after close | Lead harness (**required**) |
| Task → `blocked` after 2 failed cycles | Lead harness (**required**) |
| Subagent crash / no YAML | Lead harness (**required**, status `error`) |
| HITL skipped (no checkpoint) | Lead harness (**required**, status `skipped`) |

Subagents do **not** write diary entries — they return structured results; lead appends diary.

## Input (from subagent or harness)

```yaml
task_id: T001
sprint_id: S001
milestone_id: M001
status: done | blocked | skipped | started | error
branch: feature/S001/T001-slug
pr_url: optional
revision_cycles: 0-2
blocker: optional string
summary: one-line outcome
verify: pass | fail | n/a
review_phase1: pass | fail | n/a
review_phase2_thermo: pass | fail | n/a
ci: pass | fail | local-only | n/a
error_reason: optional (status error)
```

## Procedure

1. Ensure `.factory/logs/diary.md` exists (create `# Dev diary` if missing)
2. **Append** only — never overwrite prior entries
3. Use ISO date `YYYY-MM-DD` and optional UTC time

## Diary entry format

### Terminal: done

```markdown
---

## Task T[id] — [title] — [YYYY-MM-DD]

**Sprint:** S[id] | **Milestone:** M[id] | **Status:** done
**Branch:** `feature/...`
**PR:** [url or "none"]
**Mode:** AFK | HITL
**Parallel group:** [A/B/…]

### Outcome
[summary]

### Pipeline
| Step | Result |
|------|--------|
| Verify | pass |
| Review (task fit) | pass |
| Review (thermo-nuclear) | pass |
| CI | pass |
| Revision cycles | 0 |

### Unblocked
[T00y, …] or none
```

### Terminal: blocked

```markdown
---

## Task T[id] — [title] — [YYYY-MM-DD]

**Sprint:** S[id] | **Milestone:** M[id] | **Status:** blocked
**Branch:** `feature/...` or n/a
**Blocker:** [concrete reason]
**Revision cycles:** 2

### Pipeline failures
| Step | Result | Notes |
|------|--------|-------|
| Verify | fail | … |
| Review | fail | … |

### Next action
[What implement agent should fix, or human HITL needed]
```

### Terminal: skipped (HITL)

```markdown
---

## Task T[id] — [title] — [YYYY-MM-DD]

**Sprint:** S[id] | **Status:** skipped
**Reason:** HITL — awaiting human checkpoint before implement
```

### Terminal: error (subagent failure)

```markdown
---

## Task T[id] — [title] — [YYYY-MM-DD]

**Sprint:** S[id] | **Status:** error
**Reason:** [error_reason — timeout, crash, malformed YAML, no output]
**Next:** /run-task T[id] after investigation
```

### Optional: started

```markdown
---

## Task T[id] — started — [YYYY-MM-DD HH:MM UTC]

**Sprint:** S[id] | **Group:** A | **Branch:** `feature/...`
```

## Output to harness

```markdown
## Log-task — T[id]
**Diary:** appended to .factory/logs/diary.md
```

## Do not

- Duplicate full PRD, task spec, or diff in diary
- Replace sprint retro section (retro runs after all tasks)
