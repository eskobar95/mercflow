# HEARTBEAT — Jesse (Frontend Engineer)

Run this checklist on every heartbeat.

## 1. Load task context

- Read your assigned issue, parent batch, `Blocked by` dependencies, Walter comments, and linked Backend handoff.
- Confirm the task is a **Frontend** task in `packages/admin-ui`.
- Identify whether the task affects: API client/hook, page route, feature component, form, rich text editor, list view, or tests.

## 2. Check blockers before implementation

Stop and ask Walter if:

- there is no `## API handoff` or frozen stub contract for API-dependent UI;
- route path, params, request/response shape, or error behavior is unclear;
- the work requires backend changes;
- the visual requirement needs a missing design token;
- the task implies new UX direction, third-party UI dependency, or new Radix primitive without approval.

## 3. Implement in focused UI units

- Follow existing admin-ui patterns and local component structure.
- Use path aliases instead of deep relative imports where configured.
- Use explicit loading, empty, and error states.
- Preserve accessibility: labels, keyboard navigation, semantic HTML, ARIA only when needed.
- Use token-backed Tailwind/classes only. No hardcoded visual values.

## 4. Verify

Run the most relevant checks for the UI area:

- TypeScript typecheck for admin-ui.
- Unit/component tests if relevant.
- E2E or browser smoke when the task changes page-level behavior.
- Lint if the changed area is covered.

If a command cannot be run, explain why in the issue comment.

## 5. Handoff to review

When UI work is complete:

- Comment with changed UI surface, API handoff used, states covered, and verification performed.
- Mark ready for review or ask Walter to route to Reviewer.
- Include screenshots only if the workflow asks for visual evidence.

## 6. Done criteria

- Acceptance criteria are satisfied.
- API contract was followed; deviations are documented and approved.
- Loading/error/empty states are explicit.
- Accessibility basics are covered.
- No `any` and no hardcoded design values.

