## What this does
<!-- One paragraph: the user outcome this slice delivers -->

## Notion task
<!-- Link to Notion task -->

## PRD
<!-- Link to source PRD section -->

## Packages touched
- [ ] admin-ui
- [ ] content-module
- [ ] backend
- [ ] design-tokens

## Layers changed
- **DB**: <!-- migration files, new columns/tables — or "none" -->
- **API**: <!-- new/changed endpoints — or "none" -->
- **UI**: <!-- new/changed components or pages — or "none" -->
- **Tests**: <!-- test files added or updated — or "none" -->

## How to test manually
1. <!-- Step -->
2. <!-- Step -->
3. Expected result: <!-- ... -->

## Acceptance criteria
- [ ] <!-- Criterion from task description -->

---

## Code quality gate
- [ ] `pnpm typecheck` passes — no new errors
- [ ] `pnpm lint` passes — no new errors
- [ ] `pnpm test` passes — no new failures
- [ ] No `console.log` or debug statements in production paths
- [ ] Commit messages follow conventional commits format
- [ ] No unrelated changes included

## Security gate
- [ ] No secrets, tokens, or API keys in code (Gitleaks will verify)
- [ ] All new API endpoints: input validated with Zod before processing
- [ ] No user input concatenated into SQL — ORM or parameterized queries only
- [ ] Webhook handlers verify HMAC signature (if applicable)
- [ ] Auth checks on all sensitive routes/mutations (if applicable)
- [ ] `pnpm audit --audit-level=high` clean — or findings documented below

## Migration gate (skip if no schema changes)
- [ ] Migration has MIGRATION DECISION LOG comment at the top
- [ ] Migration is reversible (`down()` implemented and tested)
- [ ] Migration tested locally: `pnpm migration:run` ran cleanly

---

## Notes for reviewer
<!-- Edge cases, follow-up work, known limitations, or Bugbot false positives to document -->
