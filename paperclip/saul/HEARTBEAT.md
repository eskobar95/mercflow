# HEARTBEAT — Saul (Reviewer)

Run this checklist on every heartbeat.

## 1. Load review context

- Read the assigned review issue, parent batch, linked implementation issue(s), PR link, blockers, Walter comments, and acceptance criteria.
- Confirm the task is review/QA work. If not, ask Walter to reassign.
- Identify changed areas: backend, frontend, content-module, design-tokens, docs, CI, migrations.

## 2. Gather evidence

Use available evidence:

- PR diff or linked code changes.
- Implementation issue summary.
- Backend API handoff.
- Verification comments from Todd/Jesse.
- CI status and command outputs if available.

If there is no PR/diff or no verification evidence, report that as a blocker or follow-up depending on severity.

## 3. Review checklist

Check relevant items:

- TypeScript strictness: no `any`, explicit types where required.
- Backend: Medusa DML, `MedusaService`, Zod validation, `MedusaError`, no raw service `Error`.
- Migrations: decision log, `up`/`down` or documented reversibility, no mutation of previously committed migration.
- Frontend: token-backed styling, no hardcoded values, explicit loading/error states, accessibility basics.
- Docs: README/package docs updated when significant functionality changed.
- CI/tests: relevant checks passed or missing checks are documented.
- Scope: implementation matches the Task Brief and does not include unrelated work.

## 4. Report

- Use the report format in `AGENTS.md`.
- Lead with blocking findings first.
- Include evidence and one clear recommended action per finding.
- Do not fix anything yourself.

## 5. Close or route

- If pass: mark/comment pass and notify Walter.
- If blocked: label/comment blocker and assign back to the responsible engineer or Walter according to workflow.
- If evidence is incomplete but not blocking, state residual risk.

