# MercFlow Paperclip Rules

These rules apply to MercFlow agents operating inside Paperclip.

## Language

- Write Paperclip issues, comments, task briefs, handoffs, and agent-facing instructions in **English**.
- The human owner may speak Danish; convert operational instructions into English before assigning them to agents.

## Project model

- Use one stable Paperclip project: **MercFlow**.
- Do not create a new project for each batch. A batch is an **orchestration issue** with sub-issues.
- Every issue should be traceable to a batch, a project goal, or a parent issue.

## Batch orchestration

- A new batch starts with an epic issue titled:

```text
[Batch N] <short batch name> — Orchestration
```

- Assign the batch orchestration issue to **Walter**.
- Add label `batch-N`.
- Add sub-issues for Backend, Frontend, Review, Docs, Verification, or other concrete workstreams.
- Use Paperclip `Blocked by` relationships for dependencies. Do not rely only on text descriptions.

## Issue roles

- **Walter / Tech Lead:** owns orchestration, sequencing, scope control, API-contract readiness, and merge-readiness comments.
- **Backend Engineer:** owns data layer, Medusa module/service/API route work, Zod validation, and backend tests.
- **Frontend Engineer:** owns admin UI, API consumption, accessibility, design tokens, and frontend tests.
- **Reviewer:** read-only quality checks and report. Reviewer must never edit files.
- **Human / CEO:** product scope decisions, ambiguous contract decisions, and final business approval.

## Dependency rules

- Frontend implementation is blocked by the relevant Backend API handoff unless the batch epic explicitly contains a **frozen stub contract** approved by Walter and the human owner.
- Review issues are blocked by the implementation task(s) they verify.
- Migration-related work must be called out with label `migration` and requires explicit migration verification in the review checklist.

## API contract rules

- Backend tasks that create or change routes must include an API contract section:

```markdown
## API Contract: <feature>

### Routes
GET /admin/<resource>
POST /admin/<resource>

### Request shape
...

### Response shape
...

### Notes
...
```

- Frontend tasks must link to the API handoff before implementation starts.
- Any change to route paths, field names, request shapes, or response shapes after handoff requires a comment from Walter and human/project-owner approval.

## Review and approval

- Use **Reviewer** for technical quality checks.
- Use **Approver** for process, scope, or contract sign-off.
- GitHub PR approval and Paperclip approval are not the same thing. Paperclip approval is process evidence; GitHub remains the merge gate.

## Labels

Recommended labels:

- `mercflow`
- `batch-N`
- `backend`
- `frontend`
- `review`
- `docs`
- `blocked`
- `api-contract`
- `migration`
- `needs-human`
- `ready-for-review`

Labels support filtering and automation. They do not replace parent/sub-issue relationships or `Blocked by` dependencies.

## Escalation

- If scope, API contract, field names, route paths, migration requirements, or design-token ownership are unclear, label the issue `needs-human`, comment with one clear question, and assign back to the human owner or CEO.
- Do not silently unblock an issue by inventing scope.

