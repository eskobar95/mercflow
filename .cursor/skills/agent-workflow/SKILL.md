# Agent Workflow Skill

Complete pipeline from task creation to merge. Every task — regardless of whether it is executed by a Cloud Agent, CLI Agent, or manually — follows this pipeline without exception.

## v2.3 — Stage + Assignee

**Stage** (pipeline detail): Planning → Ready for Implementation → Implementing → Review → Fix → Bugbot → Ready for Merge → Merged

**Status** (PM board): derived from Stage via Notion automation (In Progress / In Review / Done)

**Assignee:** MercFlow Orchestrator bot = cloud dispatch; human assignee = manual

Agents update **Stage** only. Max **3** review cycles (Cycle Count property); then Status → Blocked.

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
    │  Status → In Progress              │
    └────────────────────────────────────┘
         │
         ▼  Worker Agent implements
    ┌────────────────────────────────────┐
    │  2. IMPLEMENTATION                 │
    │  DB → Service → API → UI → Tests  │
    │  Typecheck + lint pass             │
    └────────────────────────────────────┘
         │
         ▼  /review-code
    ┌────────────────────────────────────┐
    │  3. CODE REVIEW LOOP               │
    │  → APPROVED: continue              │
    │  → CHANGES REQUESTED: back to impl │
    └────────────────────────────────────┘
         │
         ▼  /open-pr  (posts @Bugbot run)
    ┌────────────────────────────────────┐
    │  4. OPEN PR                        │
    │  PR created → development          │
    │  Status → In Review                │
    │  @Bugbot run posted                │
    └────────────────────────────────────┘
         │
         ▼  Bugbot reviews
    ┌────────────────────────────────────┐
    │  5. BUGBOT + CI                    │
    │  Bugbot reviews once per PR        │
    │  If findings: fix on branch + push │
    │  CI must be green                  │
    └────────────────────────────────────┘
         │
         ▼  /ready-to-merge  (when all green)
    ┌────────────────────────────────────┐
    │  4b. DISPATCH MERGE                │
    │  Status → Ready to Merge           │
    │  Tech Lead dispatched via GH Actions│
    └────────────────────────────────────┘
         │
         ▼  automated — Tech Lead Merge Agent
    ┌────────────────────────────────────┐
    │  6. TECH LEAD MERGE                │
    │  Pre-flight gates verified         │
    │  PR description improved           │
    │  Squash merged to development      │
    │  Feature branch deleted            │
    │  Status → Done (automated)         │
    │  Dependent tasks unblocked         │
    └────────────────────────────────────┘
         │
         ▼  /finish-task (you)
    ┌────────────────────────────────────┐
    │  7. LOCAL CLEANUP                  │
    │  git worktree remove               │
    │  git fetch --prune                 │
    └────────────────────────────────────┘
```

---

## Stage 1: Setup (`/start-task`)

### Prerequisite checks
Before creating the worktree, verify:
- [ ] `development` branch is clean and up to date (`git fetch && git status`)
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
0. Design research — before writing any UI code:

   a. Check existing components first:
      - packages/admin-ui/src/components/ui/   ← base components
      - packages/admin-ui/src/components/      ← feature components
      Reuse and compose. Do not recreate what already exists.

   b. If the task requires a new UI pattern (new page type, new component
      pattern, visual polish task):
      → Read the refero-design SKILL.md and use the user-refero MCP tools
        to research real product references BEFORE writing code.
      → Translate Refero findings into MercFlow design tokens — never
        introduce hardcoded values or external libraries from research.
      → If pattern fits an existing template (standard list/detail/form):
        skip Refero and go directly to step 1.

   Refero MCP tools available: refero_search_styles, refero_search_screens,
   refero_search_flows, refero_get_style, refero_get_screen,
   refero_get_similar_screens, refero_get_flow, refero_get_screen_image

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

**Correctness**
- [ ] All acceptance criteria verified manually
- [ ] UI states covered: loading, empty, error, success

**Code quality**
- [ ] `pnpm typecheck` passes in every touched package (no new errors)
- [ ] `pnpm lint` passes in every touched package (no new errors)
- [ ] Unit tests for service methods: written and passing
- [ ] Integration tests for API routes: written and passing
- [ ] No `console.log` in production paths
- [ ] Each layer committed separately with clear commit messages

**Security (non-negotiable — block delivery if any fail)**
- [ ] No secrets, tokens, API keys, or credentials in code
- [ ] All new API endpoints: request body validated with Zod before any field is accessed
- [ ] No user input concatenated into SQL — ORM or parameterized queries only
- [ ] Webhook handlers verify HMAC signature (if the slice adds a webhook handler)
- [ ] Auth checks present on every new sensitive route/mutation
- [ ] `pnpm audit --audit-level=high` clean — run it, paste result in Notion comment
- [ ] Gitleaks clean — run `gitleaks detect --source . --staged` locally before final commit

**Migration (skip if no schema changes)**
- [ ] MIGRATION DECISION LOG comment at top of migration file
- [ ] `down()` implemented and tested locally

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

The Code Reviewer reads the full diff of the feature branch against `development` and evaluates it systematically.

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

**Security (non-negotiable — any failure blocks approval)**
- [ ] No secrets, tokens, API keys, or credentials in code or logs
- [ ] All API route handlers validate request body with Zod before accessing fields
- [ ] No user input concatenated into SQL — ORM or parameterized queries only
- [ ] Webhook handlers verify HMAC signature (if applicable)
- [ ] Auth checks present on every sensitive route/mutation (if applicable)
- [ ] `pnpm audit --audit-level=high` was run — result noted in Notion comment
- [ ] `dangerouslySetInnerHTML` usage (if any): sanitized with DOMPurify or equivalent

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
- [ ] Branch is rebased on latest `development` (`git fetch && git rebase origin/development`)
- [ ] Commits are clean (squash WIP commits if needed)
- [ ] `pnpm typecheck && pnpm lint && pnpm test` all pass on the worktree

### PR creation command

First, read the task's Notion unique ID (the `ID` property, e.g. `MER-25`):
```bash
# Read from Notion task page → properties → unique_id field
TASK_ID="MER-{number}"   # replace with actual value from Notion
```

```bash
gh pr create \
  --base development \
  --title "[${TASK_ID}] feat({package}): {slice objective}" \
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

1. Copy PR URL to Notion task (`PR URL` field)
2. Update Notion task `Status → In Review`
3. Add a comment on the task page:

```
Agent: Worker Implementation
Stage: PR opened

PR: {github-pr-url}
Branch: feature/{package}/{slug}
Rebased on: development @ {short-sha}

Code Review: APPROVED (cycle {n}/3)
Handing off to Bugbot + Tech Lead Merge Agent.
```

4. **Trigger Bugbot** by posting this comment on the GitHub PR:
   ```
   @Bugbot run
   ```

5. Update Notion task `Status → Ready to Merge`

After this, the automated pipeline takes over completely:
- Bugbot reviews the open PR
- `bugbot-review.yml` fires on Bugbot's result → dispatches Tech Lead Merge Agent
- Tech Lead Merge Agent runs pre-flight gates, improves PR description, squash merges, deletes branch
- `on-merge.ts` sets Status → Done and unblocks dependent tasks automatically

**When Bugbot finds issues:**
1. Fix the flagged issues on the feature branch and push
2. Verify CI is green: `gh pr checks <pr-number> --repo eskobar95/mercflow`
3. Run `/ready-to-merge <notion-task-url>` — this dispatches the Tech Lead directly (no second Bugbot run)

**You only need to intervene if:**
- Tech Lead posts a Notion comment saying a gate failed (e.g. merge conflict)
- CI is red → run `/devops-check <pr-url>`

---

## Stage 5: Bugbot + CI

### Bugbot (Cursor's built-in PR reviewer)
Bugbot runs once per PR, triggered by the `@Bugbot run` comment posted in Stage 4.
It reviews the open PR for security vulnerabilities, logic bugs, performance issues, and convention violations.

**Bugbot findings are triaged by the Tech Lead Merge Agent — not by you:**

| Finding type | Tech Lead action |
|---|---|
| Critical (security, data loss, crash) | Blocks merge → dispatches implementation agent with `review_context` |
| Refactor (violates `.cursor/rules/`) | Blocks merge → dispatches implementation agent |
| Performance (N+1, heavy imports) | Creates Notion tech debt task → continues to merge |
| Cosmetic (naming, whitespace) | "Won't fix" reply → continues to merge |

You only need to intervene if the Tech Lead posts a Notion comment indicating it couldn't resolve findings automatically.

### CI checks that must be green before merge

| Check | Workflow | Failure action |
|---|---|---|
| Lint + test + typecheck + build | `ci.yml` | Fix code — never disable the check |
| Dependency review (new CVEs) | `security.yml` | Update or document the vulnerability |
| pnpm audit (HIGH+) | `security.yml` | Run `pnpm audit --fix` or pin a safe version |
| Secret scan (Gitleaks) | `security.yml` | Remove secret, rotate credential, update allowlist if false positive |
| SAST (Semgrep) | `security.yml` | Fix finding or document as false positive in PR Notes |
| Backend migrations | `ci.yml` (backend-integration) | Fix migration schema |
| Playwright smoke | `ci.yml` (admin-ui-e2e) | Fix component or update test |

**Semgrep false positives:** Add a `// nosemgrep: <rule-id>` inline comment and document the reason in the PR Notes section. Never suppress entire files.

### DevOps Agent (CI)
If CI goes red on the PR, run `/devops-check <pr-url>`. The DevOps Agent will:
- Identify root cause (flaky test / real regression / pipeline config issue)
- Fix pipeline config issues directly
- Create a Notion bug task if it is a real regression (never silences tests)

---

## Stage 6: Tech Lead Merge Agent (automated)

After Bugbot approves (or classifies all findings as non-blocking), `bugbot-review.yml`
automatically dispatches the **Tech Lead Merge Agent**. You do not trigger this manually.

The Tech Lead Merge Agent:
1. Verifies all pre-flight gates (PR state, Code Reviewer approval, Bugbot triage, CI checks)
2. Rewrites the PR description if any section is missing or vague
3. Composes a conventional squash commit message
4. Squash merges to `development`
5. Deletes the feature branch
6. Posts a merge comment on the Notion task

`on-merge.ts` then runs automatically and:
- Sets Notion task `Status → Done`
- Finds all tasks with `Blocked by` this task and sets them → `In Progress`
- Closes the linked GitHub Issue (if any)

### Your only action: clean up the local worktree

After you see Notion `Status → Done`, run `/finish-task` or manually:

```bash
git worktree remove ../mercflow-worktrees/{task-id}
git worktree prune
git fetch --prune   # removes deleted remote branch from local refs
```

---

## Agent profiles summary

| Agent | When active | Model | Executor |
|---|---|---|---|
| PO: Grill / Synthesize | Pre-task (discovery + PRD) | Standard | Local or Cloud |
| Tech Lead: Plan | Pre-task (task breakdown) | Extended | Local or Cloud |
| Worker: Implementation | Stage 2 | composer-2 | Local or Cloud |
| Code Reviewer | Stage 3 | composer-2 | Local or Cloud |
| Bugbot | Stage 5 (PR open, once per PR) | — | Cursor built-in |
| DevOps | Stage 5 (CI fails) + schedule | Fast | Cloud |
| Tech Lead: Merge | Stage 6 (after Bugbot) | composer-2 | Cloud only |

---

## Notion task status machine

```
Not Started
    → In Progress      (worktree created, Worker running)
    → In Review        (Code Review approved, PR opened, @Bugbot run posted)
    → Ready to Merge   (Bugbot passed or findings triaged — Tech Lead dispatched)
    → Done             (squash merged, branch deleted, worktree cleaned up)
    → Blocked          (dependency not resolved, or Critical Bugbot/review finding)
```

Status transitions are automated — you do not set them manually during normal flow:
- `In Progress` → set by `/start-task`
- `In Review` → set by `/open-pr` (local) or `code-reviewer.yml` CI step (cloud)
- `Ready to Merge` → set by `/open-pr` (local) or `code-reviewer.yml` CI step (cloud)
- `Done` → set by `on-merge.ts` after squash merge
- `Blocked` → set by blocker-gate (unresolved dependency) or Code Reviewer (changes requested)

---

## Worktree hygiene rules

- Never commit directly to `main` or `development`
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
