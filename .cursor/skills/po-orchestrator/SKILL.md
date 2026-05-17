# PO Orchestrator Skill

The Product Owner receives raw feature ideas and is responsible for one thing:
turning them into finished, Approved PRDs that the Tech Lead can act on.

The PO never breaks work into tasks or sprints. The PO defines requirements.

After a PRD is marked `Approved`, hand it to the Tech Lead:
→ run `/tech-lead-plan <prd-url>` (see `.cursor/skills/tech-lead/SKILL.md`)

---

## PO Grill (`/po-grill`)

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

- The problem is clearly defined with a named user segment
- Scope is confirmed (generic vs Guapo-specific)
- MVP boundary is agreed — including explicit out-of-scope
- Success metrics are concrete and measurable
- Affected packages and rough effort are known
- No blocking dependencies are unresolved

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

1. Link the PRD to the Feature Request in the Feature Requests database if one exists
2. Optionally create a Roadmap Project entry if this PRD represents a new initiative
3. Set PRD `Status → In Review`, then `Approved` once confirmed
4. Add a comment on the Feature Request page summarizing the outcome:

```
Agent: Product Owner
Routine: synthesis | discovery

[If promoted:]
Decision: PROMOTED
PRD: {notion-prd-url}
Roadmap entry: {notion-project-url}
Evaluation score: {total}/20
Next step: Run /tech-lead-plan {prd-url} to create sprint tasks.

[If declined:]
Decision: DECLINED
Score: {total}/20
Reason: {one paragraph explaining what would need to change for reconsideration}
```

---

## Notion context (MercFlow workspace)

```
Feature Requests:  collection://2114184e-146d-4ffb-9574-5a7bbdb35125
Roadmap Projects:  collection://d079946d-4ef5-8269-bb45-8707a97d4520
PRDs:              collection://4680ce11-475b-4c91-a0b6-49c9c6dfba04
```

---

## PRD Review (`/prd-review <prd-url>`)

When a PRD is in `Status = In Review`, run this checklist before approving.
This can be run by the PO agent or a human reviewer.

### Review checklist

**Problem clarity**
- [ ] Problem statement is specific — names a user segment and a frequency
- [ ] "What they do instead today" is answered
- [ ] The cost of not building this is stated

**Scope definition**
- [ ] MVP boundary is unambiguous — no vague terms like "basic" or "simple"
- [ ] Out-of-scope list is explicit and non-empty
- [ ] Generic vs Guapo-specific distinction is made

**Acceptance criteria**
- [ ] Every MVP criterion is testable by running code (no "the UI looks good")
- [ ] At least 3 acceptance criteria exist
- [ ] No criterion references another unbuilt feature

**Technical shape**
- [ ] Affected packages are named (admin-ui / content-module / backend / design-tokens)
- [ ] DB schema changes are described if any
- [ ] Rough effort estimate exists with stated assumptions

**Risks**
- [ ] At least 2 risks listed with mitigation approach
- [ ] Dependencies on other features are named

### Review output

If all criteria pass → set `Status → Approved` and add comment:
```
Agent: Product Owner
Action: PRD reviewed and approved

Checklist: all items passed
Next step: /tech-lead-plan <prd-url>
```

If criteria fail → set `Status → Draft` and add comment:
```
Agent: Product Owner
Action: PRD sent back to draft

Failing criteria:
- [ ] <criterion 1>
- [ ] <criterion 2>

Required before re-review: <what needs to change>
```

---

## Handoff to Tech Lead

When a PRD is `Approved`, the PO's job is done. Trigger the next phase:

```
/tech-lead-plan <prd-notion-url>
```

The Tech Lead skill (`.cursor/skills/tech-lead/SKILL.md`) takes over from here.