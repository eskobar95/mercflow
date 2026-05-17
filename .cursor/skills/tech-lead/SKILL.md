# Tech Lead Skill

The Tech Lead receives a finished, Approved PRD from the Product Owner and is
responsible for one thing: turning requirements into a concrete, executable
sprint plan made up of vertical tasks that any Worker Agent can pick up and
complete independently.

The Tech Lead never writes production code. The Tech Lead designs the work.

---

## The full orchestration cycle (read this first)

```
PRODUCT OWNER
  Feature Request (idea) → /po-grill → PRD written to Notion
  PRD Status: Draft → reviewed → Approved
           │
           │  Handoff: Tech Lead receives Approved PRD URL
           ▼
TECH LEAD
  /tech-lead-plan <prd-url>
  Reads PRD → Architecture review → Vertical slice design
  → Creates Sprints + Tasks in Notion with full task descriptions
  → Sets Blocked-by dependencies
  → Assigns Agent profiles per task
           │
           │  Handoff: Tasks are "Not Started" in Notion, sprint assigned
           ▼
WORKER AGENT (per task)
  /start-task <notion-task-url>
  Creates git worktree → feature branch
  Implements vertical slice (DB + Service + API + UI + Tests)
  Delivers: typecheck ✓ · lint ✓ · tests ✓ · no secrets
           │
           │  Handoff to Code Reviewer
           ▼
CODE REVIEWER (per task)
  /review-code <worktree-path>
  Reviews diff against main
  → APPROVED: proceed
  → CHANGES REQUESTED: back to Worker (max 3 cycles)
           │
           │  APPROVED
           ▼
OPEN PR
  /open-pr <worktree-path>
  PR opened with standard summary template
  Notion task: Status → In Review · PR URL saved
           │
           ▼
BUGBOT (automatic on open PR)
  Cursor built-in reviewer — security, logic bugs, performance
  Flags real issues → Worker fixes on same branch
  False positives → dismissed with comment
           │
           ▼
CI / CD (GitHub Actions)
  /devops-check if CI fails
  DevOps Agent diagnoses failures — never skips tests
           │
           ▼
HUMAN APPROVAL → MERGE
  Worktree removed · Notion task: Status → Done
```

---

## Tech Lead responsibilities

### What you receive
- A Notion PRD URL with status `Approved`
- (Optional) a target sprint or quarter from the Roadmap

### What you deliver
- One or more Notion Sprints (if they don't exist yet)
- N Notion Tasks — one per vertical slice — each with a complete task description
- `Blocked by` dependencies set correctly between tasks
- Agent profile assigned to each task
- A written summary of the plan (sprint count, task count, risks)

### What you must never do
- Write production code
- Create tasks that span more than one agent's context budget (~200k tokens)
- Create horizontal tasks ("build all DB tables", "build all API endpoints")
- Leave a task without acceptance criteria
- Leave a `Blocked by` dependency unresolved

---

## Step 1: Read and understand the PRD

Fetch the PRD page from Notion. Read every section carefully.

Answer these questions before doing anything else:

```
1. What is the core user problem being solved?
2. What are the MVP acceptance criteria — exactly?
3. Which packages are in scope? (admin-ui / content-module / backend / design-tokens)
4. Are there DB schema changes? Which entities?
5. Are there new API endpoints? Which?
6. Are there UI surfaces? Which pages or components?
7. What third-party integrations or Medusa core dependencies exist?
8. What is explicitly OUT of scope for MVP?
9. Are there stated dependencies on other features?
10. What are the top risks?
```

If any of these are unanswerable from the PRD, **stop and ask the PO to clarify
before creating tasks**. A PRD with open questions produces broken tasks.

---

## Step 2: Architecture review

Before creating a single task, sketch the technical architecture on paper
(in your response, not in Notion):

```
DB layer:
  - New tables: [list]
  - New columns on existing tables: [list]
  - New relations: [list]
  - Migrations needed: [count]

Service layer (content-module / backend):
  - New service methods: [list]
  - New Medusa workflow hooks: [list]

API layer:
  - New admin routes: [list with method + path]
  - New public routes: [list with method + path]
  - Modified existing routes: [list]

UI layer (admin-ui):
  - New pages: [list]
  - New components: [list]
  - Modified existing pages: [list]

Tests:
  - Unit tests needed: [per service method]
  - Integration tests: [per route]
  - E2E / smoke tests: [if UI is involved]
```

This sketch is the blueprint for your vertical slices.

---

## Step 3: Design vertical slices

Vertical slicing is non-negotiable. Each slice = one task = one agent run.

### The rule

Every task must deliver **one user-visible capability end-to-end**, touching
all required layers for that capability only.

```
✗ Wrong — horizontal:
  Task 1: Create DB tables for products, categories, and media
  Task 2: Create all API endpoints
  Task 3: Build all UI pages

✓ Right — vertical:
  Task 1: Product list page — read products from DB + GET /admin/products + UI list view
  Task 2: Product detail — read relations + GET /admin/products/:id + UI detail view
  Task 3: Product create — DB insert + POST /admin/products + UI create form
  Task 4: Product delete — soft delete + DELETE /admin/products/:id + UI confirm dialog
```

### Context window budget

Each task must fit within one agent's ~200k token context. Use these signals:

| Signal | Recommendation |
|---|---|
| More than 4 new DB columns | Split into multiple slices |
| More than 3 new API endpoints | Split |
| More than 2 new UI pages | Split |
| Touches more than 2 packages | Split unless they are tightly coupled |
| Estimated > 400 lines of new code | Split |

When in doubt, split. A smaller task is always better than a failing one.

### Slice naming convention

Name tasks after the **user outcome**, not the technical layer:

```
✗ "Add redirect table migration"
✓ "Redirect rule — create and store a redirect entry (DB + API)"

✗ "Build product list API"
✓ "Product list — admin can view all products with filters (API + UI)"
```

### Foundation-first ordering

Some slices must come before others because they produce data or endpoints
that later slices consume. Order correctly:

```
Foundation slices (Sprint 1):
  - DB schema + seed/migration scripts
  - Core read paths (list, detail)

Write paths (Sprint 2):
  - Create, edit, delete flows
  - Status transitions

Polish (Sprint 3):
  - Edge cases (empty states, error handling, loading skeletons)
  - Performance (pagination, caching)
  - Accessibility review
```

---

## Step 4: Create tasks in Notion

For each slice, create a task in the Tasks database:

```
Tasks: collection://85f9946d-4ef5-83f6-b930-87200262e353
```

### Required fields

| Field | Value |
|---|---|
| Task name | `[Verb] [user outcome] — [packages]` |
| Status | `Not Started` |
| Type | `Feature` (or `Bug` / `Chore` if applicable) |
| Priority | Inherit from PRD unless slice-specific |
| Sprint | Link to the sprint this task belongs to |
| PRD | Link to source PRD |
| Package | Link to each affected Package |
| Blocked by | Link to prerequisite tasks |
| Agent | `Worker: Implementation` (default) or another profile |

### Required task description (always write this in the page body)

```markdown
## Slice objective
[One sentence: what the user or system can do when this task is done.
Write it as a user story: "A store admin can [action] so that [outcome]"]

## Layers in scope
- **DB**: [specific tables, columns, migrations — or "no DB changes"]
- **Service**: [specific service methods — or "no service changes"]
- **API**: [specific endpoints with method + path — or "no API changes"]
- **UI**: [specific pages, components — or "no UI changes"]
- **Tests**: [what to test and where]

## Acceptance criteria
- [ ] [Specific, testable criterion — every criterion must be verifiable by running code]
- [ ] [...]

## Out of scope for this task
[Explicit list of things the Worker must not build in this task]

## Context for the implementing agent
[Links to related existing code. Known gotchas. Conventions to follow.
Adjacent tasks this slice must not break.]

## Definition of done
- [ ] `pnpm typecheck` passes with no new errors
- [ ] `pnpm lint` passes with no new errors  
- [ ] Tests written and passing for this slice
- [ ] No secrets or debug artifacts in code
- [ ] PR summary filled out completely
```

---

## Step 5: Set dependencies

After creating all tasks, set `Blocked by` relations:

- Foundation tasks block write-path tasks
- Write-path tasks block polish tasks
- Cross-package tasks: if Task B needs data from Task A's API, set B blocked by A

Verify: no circular dependencies. A task cannot block itself.

---

## Step 6: Assign agents

Default assignment: `Worker: Implementation`

Override when:

| Situation | Agent |
|---|---|
| Research spike or architecture investigation | `Local: Planning` |
| Automated test run only | `Cloud: QA` |
| Documentation or README update | `Local: Implementation` |
| Cross-package integration risk is high | Add `Code Reviewer` as a second reviewer |

---

## Step 7: Write the plan summary

After creating all tasks, write a summary in your response:

```
## Sprint plan for: [PRD name]

Sprints: [N]
Tasks:   [N total] — [N] Sprint 1 / [N] Sprint 2 / [N] Sprint 3

### Sprint 1 — Foundation ([N] tasks)
[List task names]

### Sprint 2 — Write paths ([N] tasks)
[List task names]

### Sprint 3 — Polish ([N] tasks)
[List task names]

### Dependency chain
[Text or ASCII diagram of critical path]

### Risks flagged
- [Risk 1: which task, what could go wrong]
- [Risk 2: ...]

### Tasks that may need splitting
- [Any task you are uncertain about fitting in 200k tokens]
```

---

## Notion context (MercFlow)

```
Feature Requests:  collection://2114184e-146d-4ffb-9574-5a7bbdb35125
Roadmap Projects:  collection://d079946d-4ef5-8269-bb45-8707a97d4520
PRDs:              collection://4680ce11-475b-4c91-a0b6-49c9c6dfba04
Tasks:             collection://85f9946d-4ef5-83f6-b930-87200262e353
Sprints:           collection://2f79946d-4ef5-83af-bf45-8722fa76455e
Packages:          collection://33d46aaa-cdb0-4f7b-a692-267ebed6abb6
Agents:            collection://9a4589cd-d5f4-43a2-9224-2f4b2abbc926
```

## MercFlow packages

```
packages/admin-ui       — React admin interface (Vite, TypeScript, Tailwind, Radix)
packages/content-module — Medusa v2 module (DML models, services, API routes, migrations)
packages/design-tokens  — Shared design system (CSS custom properties, Tailwind config)
apps/backend            — Medusa v2 backend app (module registration, Guapo-specific config)
```

## Scope guard

**Generic MercFlow** → goes in `packages/` — works for any Medusa v2 merchant  
**Guapo-specific** → goes in `apps/backend` — references Guapo workflows or config  
**Out of scope** → replicates Medusa core, requires forking Medusa, is a product in itself
