# Agent Workflow Skill

Complete pipeline from task creation to merge. Every task — regardless of whether it is executed by a Cloud Agent, CLI Agent, or manually — follows this pipeline without exception.

---

## Branch strategy

```
main          ← production/official. Only receives merges from staging.
staging       ← general rehearsal. Only receives merges from development.
development   ← active integration. Feature branches merge here.
feature/...   ← per-task worktree branch, based off development.
```

**Who controls each gate:**
- `feature → development`: Worker Agent opens PR, Code Reviewer approves, DevOps monitors CI
- `development → staging`: **Tech Lead** gates this — runs `/promote-to-staging` at sprint end
- `staging → main`: **Tech Lead** gates this — runs `/promote-to-main` after staging smoke tests pass

## Two-agent architecture

Implementation and code review run as **separate agents with separate context windows**.
This is intentional: the reviewer acts as a colleague who sees only the result, not the process.

```
Implementation Agent (Session A)          Code Reviewer Agent (Session B — fresh)
─────────────────────────────────         ──────────────────────────────────────────
Knows: task description, PRD              Knows: diff only + acceptance criteria
Does: writes code, commits, pushes        Does: reviews diff, approves or blocks
Ends: after git push                      Ends: after PR opened or Status → Blocked
```

## Pipeline overview

```
Task created in Notion (Status: Not Started)
         │
         ▼  Notion webhook → GitHub Actions → Implementation Agent
    ┌────────────────────────────────────┐
    │  1. SETUP                          │
    │  Worktree from development branch  │
    │  Create feature branch             │
    │  Update task Status → In Progress  │
    └────────────────────────────────────┘
         │
         ▼
    ┌────────────────────────────────────┐
    │  2. IMPLEMENTATION                 │
    │  DB → Service → API → UI → Tests   │
    │  Commit each layer separately      │
    │  Typecheck + lint pass per layer   │
    │  git push origin feature/...       │
    │  Add comment: "branch pushed"      │
    │  Dispatch code-reviewer.yml ──────────────────────────────────────┐
    └────────────────────────────────────┘                              │
                                                                        ▼
                                                 ┌────────────────────────────────────┐
                                                 │  3. CODE REVIEW (separate session) │
                                                 │  Fresh context — sees diff only    │
                                                 │  git diff development...branch     │
                                                 │  Reviews against acceptance crit.  │
                                                 │  → APPROVED: open PR               │
                                                 │  → CHANGES REQUESTED: set Blocked  │
                                                 └────────────────────────────────────┘
         │                                                              │
         │ APPROVED                                                     │ CHANGES REQUESTED
         ▼                                                              ▼
    ┌────────────────────────────────────┐         Status → Blocked (webhook fires)
    │  4. PR OPEN → development          │              │
    │  (opened by Code Reviewer Agent)   │              ▼
    │  PR: feature/... → development     │    New Implementation Agent (fresh context)
    │  Task Status → In Review           │    reads review comment → fixes → pushes
    │  PR URL saved on task              │    → dispatches new Code Reviewer
    └────────────────────────────────────┘
         │
         ▼  PR open on development
    ┌────────────────────────────────────┐
    │  5. BUGBOT + CI                    │
    │  Cursor Bugbot reviews PR          │
    │  CI runs on feature → development  │
    │  DevOps Agent: reactive on failure │
    └────────────────────────────────────┘
         │
         ▼  Bugbot + CI pass, human approves
    ┌────────────────────────────────────┐
    │  6. MERGE → development            │
    │  Squash merge into development     │
    │  Task Status → Done                │
    │  Worktree removed                  │
    └────────────────────────────────────┘
         │
         ▼  Sprint complete → /promote-to-staging
    ┌────────────────────────────────────┐
    │  7. PROMOTE development → staging  │
    │  Tech Lead gate                    │
    │  PR: development → staging         │
    │  CI + smoke tests run on staging   │
    │  DevOps monitors                   │
    └────────────────────────────────────┘
         │
         ▼  Staging verified → /promote-to-main
    ┌────────────────────────────────────┐
    │  8. PROMOTE staging → main         │
    │  Tech Lead gate                    │
    │  PR: staging → main                │
    │  Release notes written             │
    │  CI passes on main                 │
    └────────────────────────────────────┘
```

---

## Stage 1: Setup (`/start-task`)

### Prerequisite checks
Before creating the worktree, verify:
- [ ] `development` branch is up to date (`git fetch origin development`)
- [ ] Task has a PRD link in Notion (required for context)
- [ ] Task has a Package link (required for branch naming)
- [ ] All `Blocked by` tasks have Status = Done
- [ ] No existing worktree for this task

### Worktree creation

```bash
# Fetch latest development
git fetch origin development

# Read task from Notion to get slug, package, and parallel group
TASK_ID="{notion-task-id-short}"
PACKAGE="{package-short-name}"   # admin-ui | content-module | backend | design-tokens
SLUG="{kebab-case-task-name}"

# Create worktree branching from development (NOT main)
git worktree add ../mercflow-worktrees/${TASK_ID} -b feature/${PACKAGE}/${SLUG} origin/development

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

**Base branch is always `development`** — never branch from `staging` or `main`.

### After setup
- Install dependencies in the worktree if needed: `cd ../mercflow-worktrees/{id} && pnpm install`
- Update Notion task: `Status → In Progress`
- Add a comment on the task page:

```
Agent: Worker Implementation
Stage: Setup complete

Worktree: ../mercflow-worktrees/{task-id}/
Branch:   feature/{package}/{slug}
Started:  {ISO timestamp}

Reading PRD and package conventions before writing code.
```

---

## Stage 2: Implementation (Worker Agent)

The Worker Agent receives the task description and operates exclusively inside
the worktree directory. It must never touch `main` or any other branch.

### Read before writing any code

Before writing a single line, read in this order:
1. The Notion task page — slice objective, layers in scope, acceptance criteria, out-of-scope
2. The linked PRD — for context on the broader feature
3. The linked Package entry — repo path and conventions
4. The relevant `.cursor/rules/` files for this package
5. Existing adjacent code in the worktree — understand patterns before adding new ones

If the task has `Blocked by` relations, verify every one of them has `Status = Done` before starting.

---

### Precise implementation order within a vertical slice

Follow this order within every slice. **Commit after each layer.**
Do not move to the next layer until the current one typechecks and tests pass.

#### Layer 1: DB schema

If the slice requires schema changes:

```
1. Define the model in packages/content-module/src/models/ using Medusa DML
   - model.define() with correct field types
   - Never define created_at, updated_at, deleted_at manually
   - Use model.id() for primary keys, model.text() for strings

2. Generate the migration:
   cd apps/backend && pnpm medusa db:generate <description>

3. Review the generated migration file:
   - Add the decision log comment at the top
   - Confirm it matches the model definition

4. Run the migration locally:
   pnpm medusa db:migrate

5. Verify: connect to local DB and confirm the table/column exists

6. Commit:
   git commit -m "migration(content-module): add {table/column} — {reason}"
```

**Stop here and verify before continuing.** A wrong schema causes cascading failures.

---

#### Layer 2: Service

Build the service method(s) that the API will call:

```
1. Add or extend the service in packages/content-module/src/services/
   - Extend MedusaService, do not build from scratch
   - Input validation belongs here, not in the route handler
   - Use MedusaError for service-layer errors
   - Return typed shapes — define the return type explicitly

2. Write unit tests for each new service method:
   Location: packages/content-module/src/__tests__/services/
   Test: happy path + at least one error path per method

3. Run:
   pnpm test packages/content-module/src/__tests__/services/<file>

4. Run typecheck:
   pnpm --filter content-module typecheck

5. Commit:
   git commit -m "feat(content-module): add {service method} — {what it does}"
```

---

#### Layer 3: API route

Expose the service through an admin or public route:

```
1. Add the route handler in packages/content-module/src/api/admin/ or /store/
   - Validate request body with Zod before accessing any fields
   - Call service method — do not put business logic in the handler
   - Use correct HTTP methods: GET (read), POST (create), PATCH (update), DELETE (soft delete)
   - Return consistent response shapes: { data: ... } for single, { data: [...], count, limit, offset } for lists

2. Register the route in the module's route index if not auto-discovered

3. Write integration tests for the route:
   Location: packages/content-module/src/__tests__/api/
   Test: 200 happy path + 400 validation error + 404 not found (where applicable)

4. Run:
   pnpm test packages/content-module/src/__tests__/api/<file>

5. Run typecheck:
   pnpm --filter content-module typecheck

6. Manual verification (curl or REST client):
   - Start the backend: cd apps/backend && pnpm dev
   - Call the endpoint and verify the response shape

7. Commit:
   git commit -m "feat(content-module): add {METHOD /path} — {what it returns}"
```

---

#### Layer 4: Admin UI

Build the UI surface that calls the API:

```
1. Add types/hooks in packages/admin-ui/src/hooks/ or /types/
   - Define the fetch hook using the Medusa JS SDK or fetch
   - Type the response from the API (reuse or extend server types)

2. Build components bottom-up:
   a. Primitive UI pieces (if new) → packages/admin-ui/src/components/ui/
   b. Feature component → packages/admin-ui/src/components/{feature}/
   c. Page → packages/admin-ui/src/routes/{entity}/

3. All visual values from packages/design-tokens — no hardcoded hex, spacing, or Tailwind arbitrary values

4. Implement all states explicitly:
   - Loading: skeleton or spinner
   - Empty: meaningful empty state with action
   - Error: visible error message, no silent failure
   - Success: confirmation feedback

5. Accessibility:
   - Semantic HTML elements
   - Labels associated with form inputs
   - Keyboard navigable interactive elements

6. Run typecheck:
   pnpm --filter admin-ui typecheck

7. Run lint:
   pnpm --filter admin-ui lint

8. Manual browser verification:
   - Start admin UI: cd packages/admin-ui && pnpm dev
   - Walk through the slice in the browser
   - Verify all states (loading, empty, error, success)
   - Verify keyboard navigation

9. Commit:
   git commit -m "feat(admin-ui): add {page/component} for {user outcome}"
```

---

#### Layer 5: Cross-layer integration test

After all layers are committed, run the full slice end-to-end:

```
1. Start both backend and admin-ui in separate terminals
2. Walk through the complete user flow in the browser
3. Verify the acceptance criteria from the Notion task one by one:
   - [ ] Each criterion: does it work? Yes/No
4. Check the browser console for errors
5. Check the backend terminal for unhandled exceptions

If any criterion fails: fix on the correct layer before continuing.
```

---

### Final delivery checklist

Before handing off to Code Reviewer:

- [ ] All acceptance criteria verified manually
- [ ] `pnpm typecheck` passes in every touched package (no new errors)
- [ ] `pnpm lint` passes in every touched package (no new errors)
- [ ] Unit tests for service methods: written and passing
- [ ] Integration tests for API routes: written and passing
- [ ] UI states covered: loading, empty, error, success
- [ ] No secrets, tokens, or credentials in code
- [ ] No `console.log` in production paths
- [ ] Migration has decision log comment
- [ ] Each layer committed separately with clear commit messages

---

### Commit convention

```
migration(package): add {table/column} — {reason}
feat(package): add {service method or endpoint or component}

- DB: [what changed]
- API: [what changed]  
- UI: [what changed]
- Tests: [what was added]
```

### Context management
- Work only inside the worktree — never read files outside it unless they are shared packages
- If context is filling up: focus on one layer, commit it, then continue
- Use `git add -p` to make focused commits per logical change
- If a layer turns out much larger than the task described: stop, raise it in a Notion comment, ask for guidance before continuing

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
- If CHANGES REQUESTED → Worker fixes on the **same branch** (no new worktree, no Status change in Notion) → re-request review
- If cycle count reaches 3 → set Notion task `Status → Blocked`, add comment with escalation reason → stop
- If APPROVED → proceed to Stage 4

### Update Notion after each review cycle
Add a comment on the task page with the review output:

```
Agent: Code Reviewer
Cycle: {n}/3
Decision: APPROVED | CHANGES REQUESTED

### What's working well
- [...]

### Required changes (blocking)
- [ ] src/foo.ts:42 — [issue]

### Suggestions (non-blocking)
- [...]
```

- First review cycle: keep `Status = In Progress`
- APPROVED: update `Status → In Review` (ready for PR)

---

## Stage 4: Open PR (`/open-pr`)

Only run after Code Reviewer has issued APPROVED.

### Pre-PR checklist
- [ ] Branch is rebased on latest `development` (`git rebase origin/development`)
- [ ] Commits are clean (squash WIP commits if needed)
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all pass on the worktree

### PR creation command
```bash
gh pr create \
  --base development \
  --title "{Slice objective} ({package})" \
  --body "$(cat <<'EOF'
{PR_BODY}
EOF
)"
```

**Target branch is always `development`.** Never open a feature PR directly to `staging` or `main`.

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
- Add a comment on the task page:

```
Agent: Worker Implementation
Stage: PR opened

PR: {github-pr-url}
Branch: feature/{package}/{slug}
Rebased on: main @ {short-sha}

Code Review: APPROVED (cycle {n}/3)
Bugbot and CI will now run automatically.
```

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

## Stage 6: Merge to development and cleanup

When Bugbot + CI pass and a human approves the PR:

```bash
# Squash merge into development
gh pr merge --squash --delete-branch

# Clean up worktree
git worktree remove ../mercflow-worktrees/{task-id}
git worktree prune
```

Update Notion task: `Status → Done`

---

## Stage 7: Promote development → staging (`/promote-to-staging`)

**Trigger:** All tasks in the sprint have Status = Done.  
**Owner:** Tech Lead Agent.

```bash
# Verify all sprint tasks are Done in Notion first

# Open promotion PR
gh pr create \
  --base staging \
  --head development \
  --title "chore: promote sprint {N} to staging" \
  --body "$(cat <<'EOF'
## Sprint {N} — staging promotion

### Tasks included
{list of Notion task links merged since last staging promotion}

### What to verify on staging
{acceptance criteria from sprint tasks}

### CI status
- [ ] All checks pass on this PR

### Smoke tests
- [ ] Admin UI loads and is navigable
- [ ] Key user flows for sprint tasks work end-to-end
- [ ] No console errors or backend exceptions in staging logs

### DevOps sign-off
- [ ] No new CI warnings introduced
- [ ] Build times within normal range
EOF
)"
```

**DevOps Agent** monitors CI on this PR reactively.  
Tech Lead reviews staging manually or delegates to QA.  
After staging is verified: proceed to Stage 8.

---

## Stage 8: Promote staging → main (`/promote-to-main`)

**Trigger:** Staging verified — smoke tests pass, no blocking issues.  
**Owner:** Tech Lead Agent.

```bash
# Open release PR
gh pr create \
  --base main \
  --head staging \
  --title "release: {version or sprint N}" \
  --body "$(cat <<'EOF'
## Release — {version or sprint N}

### What's in this release
{summary of user-facing changes}

### Notion sprint
{link to sprint in Notion}

### Tasks shipped
{list of Notion task links}

### Staging verification
- [ ] Smoke tests passed on staging
- [ ] No regressions observed
- [ ] DevOps confirmed CI clean

### Release notes
{short paragraph for changelog}

### Rollback plan
{how to revert if main breaks — feature flags, revert commit, etc.}
EOF
)"
```

After merge to `main`: tag the release.

```bash
git tag -a v{version} -m "Release {version}: {sprint name}"
git push origin v{version}
```

**DevOps Agent** monitors CI on main post-merge.  
If CI fails on main: DevOps diagnoses and creates a hotfix task immediately.

---

## Agent profiles summary

| Agent | When active | Model | Executor |
|---|---|---|---|
| Product Owner | Feature discovery + PRD synthesis | Standard / Extended | Local or Cloud |
| Tech Lead | PRD → sprint plan · promote-to-staging · promote-to-main | Extended | Local |
| Worker: Implementation | Stage 2 — feature branch implementation | Standard | Cloud or Local |
| Code Reviewer | Stage 3 — diff review loop | Standard | Cloud or Local |
| Bugbot | Stage 5 — PR open on development | — | Cursor built-in |
| DevOps | Stage 5 CI + Stage 7 staging CI + Stage 8 main CI + weekly audit | Fast | Cloud |

---

## Notion task status machine

```
Not Started
    → In Progress     (worktree created, Worker running — Stage 1+2+3)
    → In Review       (Code Review APPROVED, PR open on development — Stage 4+5)
    → Done            (merged to development, worktree cleaned up — Stage 6)
    → Blocked         (dependency not resolved, or cycle 3 hit in code review)
```

**Important: "Changes Requested" is NOT a Notion status.**
The code review loop (Stage 3) works as follows:

**Within one agent run (same context window):**
- APPROVED → move to Stage 4 (open PR, set Status → In Review)
- CHANGES REQUESTED → Worker fixes on the same branch → re-requests review
- Repeat until APPROVED or context window exhausted

**When context window is exhausted without approval:**
- Code Reviewer writes a detailed comment listing all required changes
- Set Status → **Blocked** (previousStatus = In Progress)
- Webhook fires → **new implementation agent starts** with fresh context window
- New agent reads all task comments (including the review), fixes issues, runs fresh review
- If APPROVED → PR opened → In Review → Done
- If new agent ALSO fails → Status → Blocked again (previousStatus = Blocked)
  → Webhook sees Blocked→Blocked: **no auto-trigger** → human escalation required

**Escape from Blocked — two paths:**

| Type | Cause | Auto-recovery | Human needed |
|---|---|---|---|
| Code review blocked (1st time) | Context exhausted, changes requested | Yes — new agent run triggered automatically | No |
| Code review blocked (2nd time) | New agent also failed | No — auto-trigger stops | Yes — human reads comments, splits task or clarifies acceptance criteria, then sets → In Progress |
| Dependency blocked | `Blocked by` task not Done | No | Human sets → In Progress after dependency is Done |

When a Worker Agent starts on a `Blocked` task (fresh run after Blocked):
1. Read ALL comments on the task page — especially the last Code Reviewer comment
2. List the required changes explicitly before writing any code
3. Address each required change one at a time, layer by layer
4. Add a comment: `"Resuming from Blocked — addressing: [list of issues from review]"`
5. Start a fresh review cycle (cycle count resets to 1)

Bugbot and CI run while status is `In Review`. Do not move to `Done` until both pass.

Sprint promotion (Stages 7+8) is a Tech Lead action across multiple tasks,
not reflected in individual task status. When promoting early (before sprint end date),
Tech Lead updates `Dates.end` in Notion to today → auto-triggers milestone close.

---

## Worktree hygiene rules

- Never commit directly to `main`, `staging`, or `development`
- Never branch feature work from `staging` or `main`
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
