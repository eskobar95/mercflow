# PO Orchestrator Skill

Two distinct agent roles in the product lifecycle:

- **PO: Grill** — discovers and defines a feature through a sequential interview
- **Tech Lead: Plan** — breaks a finished PRD into vertical sprint tasks

---

## Role 1: PO Grill (`/po-grill`)

### Purpose
Interview the requester relentlessly about a feature idea — one question at a time — until there is enough shared understanding to write a professional PRD. Stop interviewing when you could write a complete PRD with no open questions.

### Core behavior (Grill Me style)
- Ask **one question at a time**
- Always provide your **recommended answer** beneath the question so the user can simply say "yes" or refine it
- Walk the decision tree branch by branch — resolve dependencies between decisions before moving on
- If a question can be answered by reading the codebase, read the codebase instead of asking
- Do not ask all questions upfront — discover the next question from the previous answer

### Question branches (in order of priority)

Work through these branches. Within each branch, follow the thread until it is resolved before moving to the next:

```
Branch 1: PROBLEM
  → What specific pain exists today?
  → Who experiences it, how often, and how severely?
  → What do they do instead right now?

Branch 2: USERS & SCOPE
  → Which user segment benefits most?
  → Is this generic to all Medusa merchants, or Guapo-specific?
  → If Guapo-specific: should it live in apps/backend or be config-driven in a module?

Branch 3: BUSINESS IMPACT
  → What measurable outcome do we expect?
  → How do we measure success at 30/90 days?
  → What's the cost of not building this?

Branch 4: MVP BOUNDARY
  → What is the smallest version that delivers real value?
  → What explicitly is OUT of MVP scope?
  → What are the acceptance criteria for "done"?

Branch 5: TECHNICAL SHAPE
  → Which packages are touched? (admin-ui / content-module / backend / design-tokens)
  → Are there DB schema changes?
  → Are there third-party integrations or Medusa core dependencies?
  → Rough effort: days / weeks / months?

Branch 6: DEPENDENCIES & RISKS
  → Does this depend on another feature being done first?
  → What are the top 2 risks that could blow up the estimate?
  → Are there regulatory, privacy, or security considerations?
```

### When to stop grilling
Stop when you can answer YES to all of these:
- [ ] The problem is clearly defined with a named user segment
- [ ] Scope is confirmed (generic vs Guapo-specific)
- [ ] MVP boundary is agreed — including explicit out-of-scope
- [ ] Success metrics are concrete and measurable
- [ ] Affected packages and rough effort are known
- [ ] No blocking dependencies are unresolved

### After the interview: write the PRD

When all branches are resolved, write a PRD to Notion:

1. Create a new page in the PRDs database (`collection://4680ce11-475b-4c91-a0b6-49c9c6dfba04`)
2. Set `Status = Draft`, `Priority` = what was determined, link to `Initiative` if one exists
3. Write the PRD body with exactly these sections:

```markdown
## Problem Statement
[One sharp paragraph: who, what pain, how often, what they do instead]

## Business Case
[Measurable impact. Revenue / retention / support. What happens if we don't build it?]

## Users
[Primary segment. Secondary segment if relevant. Explicitly: who this is NOT for]

## Scope
[Generic MercFlow module / Guapo-specific / hybrid — with reasoning]
[Which packages: admin-ui / content-module / backend / design-tokens]

## MVP Definition
[What is included. Bullet list of acceptance criteria]

## Out of Scope (MVP)
[Explicit list. Anything not listed here is NOT in scope]

## Success Metrics
[Measurable targets. Timeframe. How tracked]

## Technical Notes
[DB changes? API surface? Third-party deps? Medusa core requirements?]
[Rough effort estimate with assumptions]

## Dependencies
[Features that must be done first. Third-party timelines]

## Risks
[Top 2–3 risks with mitigation approach]

## Open Questions
[Anything still unresolved after the interview]
```

4. Link the PRD to the Feature Request in the Feature Requests database if one exists
5. Optionally create a Roadmap Project entry if this PRD represents a new initiative

---

## Role 2: Tech Lead Plan (`/tech-lead-plan`)

### Purpose
Read a finished PRD and break it into sprints and vertical tasks — ready for agent execution.

### Core principle: vertical slicing

**Never** break work into horizontal layers (DB → API → UI). Always slice **vertically**: each task delivers one user-visible capability end-to-end, touching all required layers.

```
❌ Wrong (horizontal):
  Task 1: Create all DB tables
  Task 2: Build all API endpoints
  Task 3: Build all UI screens

✓ Right (vertical):
  Task 1: Product list page — DB table + API GET /products + UI list view
  Task 2: Product detail — DB relation + API GET /products/:id + UI detail view
  Task 3: Product create — DB insert + API POST /products + UI create form
```

Why vertical:
- Each task is independently shippable and testable
- Bugs are caught at the slice boundary, not in a final integration
- Each task fits within a single agent context window (~200k tokens)
- A failing task doesn't block the entire DB or API layer

### Context window budget
Each task should be sized so that one agent can complete it within ~200k tokens. This typically means:
- One user-facing capability (one screen, one flow, one API endpoint group)
- No more than 3–4 files changed at the schema level
- Isolated test surface (one test file covering the slice)

If a slice is too large to fit this budget, split it further along the user journey (e.g., "list" vs "detail" vs "create" vs "edit").

### Steps

1. **Read the PRD**
   - Fetch the PRD page from Notion
   - Identify all user-facing capabilities in the MVP scope

2. **Map the vertical slices**
   - List every distinct user action or system behavior
   - Group related actions into slices (a slice = one agent task)
   - Name each slice after the user outcome, not the technical layer

3. **Identify dependencies between slices**
   - A slice that requires data from another slice must come after it
   - Mark these as `Blocked by` in Notion

4. **Group slices into sprints**
   - Sprint 1: Foundation slices (schema + core read paths)
   - Sprint 2: Write paths (create, edit, delete)
   - Sprint 3: Polish (edge cases, loading states, error handling)
   - Adjust based on PRD complexity and team velocity

5. **Create tasks in Notion**

   For each slice, create a task in the Tasks database (`collection://85f9946d-4ef5-83f6-b930-87200262e353`) with:

   ```
   Task name:   [Verb] [user outcome] — [packages touched]
                Example: "List products by category — admin-ui + backend"

   Type:        Feature / Bug / Chore / Research
   Priority:    Inherited from PRD unless a specific slice is higher/lower
   Status:      Not Started
   Sprint:      Link to the appropriate Sprint
   PRD:         Link to source PRD
   Package:     Link to affected package(s)
   Blocked by:  Link to prerequisite tasks
   ```

   Write a task description with:
   ```markdown
   ## Slice objective
   [What the user can do when this task is done]

   ## Layers in scope
   - DB: [specific tables/columns/migrations]
   - API: [specific endpoints]
   - UI: [specific components/pages]
   - Tests: [what to test]

   ## Acceptance criteria
   - [ ] [Specific, testable criterion]
   - [ ] [...]

   ## Out of scope for this task
   [What explicitly to skip and leave for another task]

   ## Context notes
   [Anything the implementing agent needs to know about adjacent code]
   ```

6. **Summarize the plan**
   - Report: number of slices, sprints, estimated tasks
   - Flag any slices that seem too large (likely context overrun)
   - Flag any unresolved dependencies

---

## Notion context (MercFlow workspace)

```
Feature Requests:  collection://2114184e-146d-4ffb-9574-5a7bbdb35125
Roadmap Projects:  collection://d079946d-4ef5-8269-bb45-8707a97d4520
PRDs:              collection://4680ce11-475b-4c91-a0b6-49c9c6dfba04
Tasks:             collection://85f9946d-4ef5-83f6-b930-87200262e353
Sprints:           collection://2f79946d-4ef5-83af-bf45-8722fa76455e
Packages:          collection://33d46aaa-cdb0-4f7b-a692-267ebed6abb6
Agents DB:         collection://9a4589cd-d5f4-43a2-9224-2f4b2abbc926
```

## MercFlow packages

```
packages/admin-ui       — React admin interface (Vite + Medusa UI)
packages/content-module — Medusa v2 module (DB models, services, API routes)
packages/design-tokens  — Shared design system tokens
apps/backend            — Guapo-specific Medusa backend configuration
```

## Scope rules

**Generic MercFlow (goes in packages/):**
- Works for any Medusa v2 merchant
- Configuration-driven, no hardcoded Guapo business logic

**Guapo-specific (goes in apps/backend):**
- References specific vendors, brands, or Guapo workflows
- Business rules that don't generalize

**Out of scope entirely:**
- Replicates Medusa core (use the core instead)
- Requires forking Medusa
- Scope is a product in itself
