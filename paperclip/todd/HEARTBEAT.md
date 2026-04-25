# HEARTBEAT — Todd (Backend Engineer)

Run this checklist on every heartbeat.

## 1. Load task context

- Read your assigned issue, parent batch issue, `Blocked by` dependencies, Walter comments, and acceptance criteria.
- Confirm the task is a **Backend** task. If not, comment and ask Walter to reassign or clarify.
- Identify whether the task touches: DML models, service layer, admin API routes, migrations, tests, or backend app registration.

## 2. Check blockers before coding

Stop and ask Walter if:

- route paths, field names, request/response shape, or persisted data fields are not defined;
- the task implies a database migration but the field definitions are not explicit;
- there is a conflict between the Task Brief and MercFlow repo rules;
- the work would require touching `packages/admin-ui`;
- production/staging data or credentials are involved.

## 3. Implement in small backend units

- Follow the relevant MercFlow repo rules and root `AGENTS.md`.
- Keep implementation focused on the issue scope.
- Prefer service-layer invariants over defensive route-level branching.
- Add or update backend tests when behavior changes.
- For migrations, follow the project migrator workflow and include the required migration decision log.

## 4. Verify

Run the most relevant checks for the changed backend area:

- TypeScript typecheck for touched package(s).
- Backend/content-module tests if present.
- Migration generate/run/revert workflow if migration work is in scope.
- Lint if the changed area is covered.

If a command cannot be run, explain why in the issue comment.

## 5. Handoff

When the backend contract is ready:

- Add `## API handoff` to the Backend issue comment using the format in `AGENTS.md`.
- Include validation, edge cases, and verification evidence.
- Notify Walter and the dependent Frontend issue.

## 6. Done criteria

Before marking done or ready for review:

- Acceptance criteria are satisfied.
- API handoff exists if any route was created or changed.
- Tests/checks are reported.
- No `any`, raw service `Error`, or undocumented migration is present.
- Reviewer can understand the change without asking for missing context.

