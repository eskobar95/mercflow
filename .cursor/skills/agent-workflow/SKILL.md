# Agent Workflow Skill

Complete pipeline from task creation to merge. Every task — regardless of whether it is executed by a Cloud Agent, CLI Agent, or manually — follows this pipeline without exception.

---

## Pipeline overview

```
Task created in Notion (Status: Not Started)
         │
         ▼  /start-task <notion-task-url>
    ┌────────────────────────────────────┐
    │  1. SETUP                          │
    │  Create git worktree               │
    │  Create feature branch             │
    │  Update task Status → In Progress  │
    └────────────────────────────────────┘
         │
         ▼  Worker Agent implements the vertical slice
    ┌────────────────────────────────────┐
    │  2. IMPLEMENTATION                 │
    │  DB migration → Service → API → UI │
    │  Unit + integration tests          │
    │  Typecheck + lint pass             │
    └────────────────────────────────────┘
         │
         ▼  /review-code <worktree-path>
    ┌────────────────────────────────────┐
    │  3. CODE REVIEW LOOP               │
    │  Code Reviewer reads the diff      │
    │  → Approve: continue               │
    │  → Request changes: back to Worker │
    │  Max 3 cycles before human review  │
    └────────────────────────────────────┘
         │
         ▼  Review approved
    ┌────────────────────────────────────┐
    │  4. OPEN PR                        │
    │  /open-pr <worktree-path>          │
    │  Well-defined PR summary           │
    │  Update task Status → In Review    │
    │  Link PR URL on task               │
    └────────────────────────────────────┘
         │
         ▼  PR is open
    ┌────────────────────────────────────┐
    │  5. BUGBOT + CI                    │
    │  Cursor Bugbot reviews open PR     │
    │  CI pipeline runs                  │
    │  DevOps Agent monitors + fixes CI  │
    └────────────────────────────────────┘
         │
         ▼  Bugbot + CI pass
    ┌────────────────────────────────────┐
    │  6. MERGE                          │
    │  Human approves and merges         │
    │  Task Status → Done                │
    │  Worktree cleaned up               │
    └────────────────────────────────────┘
```

---

## Stage 1: Setup (`/start-task`)

### Prerequisite checks
Before creating the worktree, verify:
- [ ] `main` branch is clean and up to date (`git fetch && git status`)
- [ ] Task has a PRD link in Notion (required for context)
- [ ] Task has a Package link (required for branch naming)
- [ ] No existing worktree for this task

### Worktree creation

```bash
# Read task from Notion to get slug and package
TASK_ID="{notion-task-id-short}"
PACKAGE="{package-short-name}"   # admin-ui | content-module | backend | design-tokens
SLUG="{kebab-case-task-name}"

# Create worktree and branch
git worktree add ../mercflow-worktrees/${TASK_ID} -b feature/${PACKAGE}/${SLUG}

# Confirm
git worktree list
```

**Branch naming:** `feature/{package}/{task-slug}`
Examples:
- `feature/content-module/bulk-product-import`
- `feature/admin-ui/product-list-by-category`
- `feature/backend/webhook-signature-verification`

**Worktree location:** `../mercflow-worktrees/{task-id}/`
Keep worktrees outside the main repo to avoid confusion.

### After setup
- Install dependencies in the worktree if needed: `cd ../mercflow-worktrees/{id} && pnpm install`
- Update Notion task: `Status → In Progress`
- Add a comment on the task with the worktree path and branch name

---

## Stage 2: Implementation (Worker Agent)

The Worker Agent receives the task description and operates exclusively inside the worktree directory. It must never touch `main` or any other branch.

### What the Worker must deliver
Before handing off to Code Reviewer, the Worker must confirm all of these:

- [ ] Vertical slice is complete: DB migration + Service + API + UI (as applicable)
- [ ] `pnpm typecheck` passes with no new errors
- [ ] `pnpm lint` passes with no new errors
- [ ] Tests written for the slice (`pnpm test <affected-file>`)
- [ ] No secrets, tokens, or credentials in code
- [ ] No `console.log` left in production paths
- [ ] Follows conventions in `.cursor/rules/`

### Context management
- Work within the worktree — never read files outside it unless they are shared packages
- If context is getting large, focus on one layer at a time but commit each layer before moving to the next within the same branch
- Use `git add -p` to make focused commits per logical change

### Commit convention
```
feat(package): short description of what changed

- [bullet: what DB changed]
- [bullet: what API changed]
- [bullet: what UI changed]
```

---

## Stage 3: Code Review Loop (`/review-code`)

The Code Reviewer reads the full diff of the feature branch against `main` and evaluates it systematically.

### Review checklist

**Correctness**
- [ ] Does the implementation match the task's slice objective?
- [ ] Are all acceptance criteria met?
- [ ] Are edge cases handled (empty state, error state, loading state)?

**Code quality**
- [ ] No unnecessary abstraction — simple is better
- [ ] No duplicate logic that already exists in the codebase
- [ ] Types are explicit where it matters; no unchecked `any`
- [ ] Functions do one thing; no "god functions"

**Security (non-negotiable)**
- [ ] No user input concatenated into SQL (use ORM / parameterized queries)
- [ ] Webhook signatures verified if applicable
- [ ] No secrets in code or logs
- [ ] API routes validate input before processing

**Tests**
- [ ] New logic has test coverage
- [ ] Tests are meaningful (not just "it renders")
- [ ] Existing tests still pass

**Conventions**
- [ ] Follows `.cursor/rules/conventions.mdc`
- [ ] Follows `.cursor/rules/vertical-slicing.mdc`
- [ ] Follows package-specific rules (admin-ui.mdc, content-module.mdc)

### Review output format

```markdown
## Code Review — feature/{package}/{slug}

**Decision:** APPROVED | CHANGES REQUESTED

### What's working well
- [...]

### Required changes (blocking)
- [ ] [Specific issue with file reference: src/foo.ts:42]
- [ ] [...]

### Suggestions (non-blocking)
- [...]

### Cycle count: {n}/3
```

### Review loop rules
- If CHANGES REQUESTED → Worker fixes and re-requests review
- If cycle count reaches 3 → escalate to human review, do not continue looping
- If APPROVED → proceed to Stage 4

### Update Notion
- After each review cycle, update the task's `Status`:
  - First review: keep `In Progress`
  - Final approval: update to `In Review` (ready for PR)

---

## Stage 4: Open PR (`/open-pr`)

Only run after Code Reviewer has issued APPROVED.

### Pre-PR checklist
- [ ] Branch is rebased on latest `main` (`git rebase origin/main`)
- [ ] Commits are clean (squash WIP commits if needed)
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all pass on the worktree

### PR creation command
```bash
gh pr create \
  --title "{Slice objective} ({package})" \
  --body "$(cat <<'EOF'
{PR_BODY}
EOF
)"
```

### PR summary template (always use this structure)

```markdown
## What this does
[One paragraph: the user outcome this slice delivers]

## Notion task
[Link to Notion task]

## PRD
[Link to source PRD]

## Packages touched
- [ ] admin-ui
- [ ] content-module
- [ ] backend
- [ ] design-tokens

## Layers changed
- **DB**: [migration files, new columns/tables]
- **API**: [new/changed endpoints]
- **UI**: [new/changed components or pages]
- **Tests**: [test files added or updated]

## How to test manually
1. [Step]
2. [Step]
3. Expected result: [...]

## Acceptance criteria
- [ ] [Criterion from task description]
- [ ] [...]

## Security checklist
- [ ] No secrets in code
- [ ] Input validated at API boundary
- [ ] No SQL concatenation

## Notes for reviewer
[Anything the human reviewer should pay extra attention to]
```

### After PR is open
- Copy PR URL to Notion task (`PR URL` field)
- Update Notion task `Status → In Review`
- **Do not trigger Bugbot manually** — it activates automatically on open PRs

---

## Stage 5: Bugbot + CI

### Bugbot (Cursor's built-in PR reviewer)
Bugbot is **only active at this stage** — not during development or the code review loop. It reviews the open PR for:
- Security vulnerabilities
- Logic bugs
- Performance issues
- Convention violations

If Bugbot flags issues:
- Evaluate each flag: is it a real bug or a false positive?
- Real bugs → Worker fixes on the same branch (new commit, not force-push)
- False positives → dismiss with a comment explaining why

### DevOps Agent (CI optimization)
The DevOps Agent monitors CI pipeline runs and is responsible for:

**Reactive (when CI fails):**
- Read the CI failure log
- Identify root cause: flaky test / environment issue / real regression
- If flaky: retry and document the flakiness
- If real: create a bug task in Notion linked to the failing PR
- If CI config issue: fix the pipeline config (do not skip tests)

**Proactive (on a schedule):**
- Review pipeline run times — flag steps that take > 2 minutes
- Check for redundant steps (duplicate lint runs, unnecessary installs)
- Ensure caching is configured correctly for `pnpm` and build artifacts
- Ensure preview deployments are working for UI packages

**What the DevOps Agent must never do:**
- Skip or disable failing tests to make CI green
- Merge without all checks passing
- Modify CI in ways that reduce coverage

---

## Stage 6: Merge and cleanup

When Bugbot + CI pass and a human approves:

```bash
# Merge (squash or rebase depending on PR size)
gh pr merge --squash --delete-branch

# Clean up worktree
git worktree remove ../mercflow-worktrees/{task-id}
git worktree prune
```

Update Notion task: `Status → Done`

---

## Agent profiles summary

| Agent | When active | Model | Executor |
|---|---|---|---|
| Worker: Implementation | Stage 2 | Standard | Cloud or Local |
| Code Reviewer | Stage 3 | Standard | Cloud or Local |
| Bugbot | Stage 5 (PR open) | — | Cursor built-in |
| DevOps | Stage 5 (CI) + schedule | Fast | Cloud |
| PO: Grill | Pre-task (discovery) | Standard | Local |
| Tech Lead: Plan | Pre-task (breakdown) | Extended | Local |

---

## Notion task status machine

```
Not Started
    → In Progress     (worktree created, Worker running)
    → In Review       (Code Review approved, PR open)
    → Done            (merged, worktree cleaned up)
    → Blocked         (dependency not resolved)
```

Bugbot and CI run while status is `In Review`. Do not move to `Done` until both pass.

---

## Worktree hygiene rules

- Never commit directly to `main`
- Never share a worktree between two tasks
- If a task is abandoned: `git worktree remove` + update Notion task to `Blocked` with a note
- List active worktrees weekly: `git worktree list`
- Maximum active worktrees at any time: match the number of active sprint tasks

---

## Notion context

```
Tasks:    collection://85f9946d-4ef5-83f6-b930-87200262e353
Sprints:  collection://2f79946d-4ef5-83af-bf45-8722fa76455e
PRDs:     collection://4680ce11-475b-4c91-a0b6-49c9c6dfba04
Agents:   collection://9a4589cd-d5f4-43a2-9224-2f4b2abbc926
```
