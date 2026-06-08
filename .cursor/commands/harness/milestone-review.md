# /milestone-review [milestone-id]

Verify milestone completion, run CI gates, and prepare `dev → staging` PR for human approval.

## Usage

```text
/milestone-review M001
```

## Prerequisites

- `.factory/planning/milestones.md` defines the milestone
- Cursor 3.5+ for Background Agent milestone CI
- `dev` branch up to date with completed sprint work

## Procedure

### 1. Verify sprints

1. Read `.factory/planning/milestones.md` for milestone `M[id]`
2. List sprints belonging to this milestone from milestones + `sprints.md`
3. Confirm each sprint **Status** is `done` in `.factory/planning/sprints.md`
4. Confirm all tasks with **Milestone:** M[id] are `done` in `.factory/planning/tasks.md` (or list exceptions)

If not complete, report gaps and stop unless user forces partial review.

### 2. Run milestone CI

- Invoke **Background Agent** with `skills/harness/milestone-ci/SKILL.md`
- Wait for structured report (`READY_FOR_STAGING_PR: yes | no`)

### 3. Generate milestone PR summary

```markdown
## Milestone M[id] — [title]

### Shipped
- [User-visible outcomes from PRD/milestones]
- Tasks: T001, T002, … (links to PRs if known)

### CI gates
[Paste milestone CI table]

### Findings
[From React Doctor, audit, tests]

### Tech debt
[Consolidated from task PRs + CI]

### Human action
- [ ] Review this PR
- [ ] Approve merge `dev` → `staging`
- [ ] Later: you merge `staging` → `main`
```

### 4. Open PR

- **Base:** `staging`
- **Head:** `dev`
- **Title:** `milestone(M[id]): [short title]`
- Body: summary above
- Label or note in body: **ready for human review**

```bash
gh pr create --base staging --head dev --title "milestone(M001): ..." --body-file /tmp/milestone-body.md
```

If `staging` does not exist, instruct user to create it from `main` first.

### 5. Update planning

- In `.factory/planning/milestones.md`, set milestone status to `in-review` or `ready-for-review` in overview table
- Optional diary entry in `.factory/logs/diary.md`

## Composer output (required)

```markdown
## Milestone review — M[id]

**CI:** pass | fail
**Staging PR:** [URL or "not created — CI failed"]
**Blocked tasks:** none | [list]

**Your only action:** Review and merge PR to `staging` when satisfied.
```

## Do not

- Merge to `main`
- Auto-merge `dev → staging` without human approval
- Skip security gate on fail
