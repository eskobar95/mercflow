---
name: milestone-ci
description: Background Agent — security audit, React Doctor, bundle size, full test suite for milestone gates
---

# Milestone CI skill

Run as **Background Agent** (Cursor 3.5+) when `/milestone-review` invokes milestone gates. Produces a single report for the milestone PR summary.

## Prerequisites

- All sprints in milestone marked `done` in `.factory/planning/sprints.md` (or user override)
- Branch `dev` contains merged task work
- Project scripts from `.factory/context/TECHSPEC.md`

## Gates (run in order)

### 1. Security audit

```bash
pnpm audit --audit-level=high 2>&1 || npm audit --audit-level=high 2>&1
```

**Pass:** no high or critical vulnerabilities (or documented accepted risk in TECHSPEC)

### 2. React Doctor (Next.js projects)

If project uses React/Next:

```bash
npx -y react-doctor@latest . --verbose --no-ami
```

If `react-doctor` not applicable (non-React stack), skip with note in report.

**Pass:** no critical issues; document warnings in report

### 3. Bundle size check

Establish baseline from `staging` or tag if available; compare `dev` build:

```bash
pnpm build 2>&1
# Compare .next/static or build output size vs baseline — document method in report
```

**Pass:** no regression **> 10%** vs baseline (if no baseline, record current size only and note follow-up)

### 4. Full test suite

```bash
pnpm test --run 2>&1
```

**Pass:** exit code 0

> Use `--run` — never watch mode in Background Agent.

## Report format

Write to a temp section for milestone-review command (and optionally `.factory/logs/diary.md`):

```markdown
## Milestone CI — M[id]

**Branch checked:** dev
**Date:** [ISO date]

| Gate | Result | Notes |
|------|--------|-------|
| Security audit | pass/fail | [counts] |
| React Doctor | pass/fail/skip | [top findings] |
| Bundle size | pass/fail/n/a | [%, sizes] |
| Full test suite | pass/fail | [failed tests] |

### Findings (action required)
- [ ] [finding]

### Tech debt observed
- [bullet]

### Overall
**READY_FOR_STAGING_PR:** yes | no
```

## On failure

- Set `READY_FOR_STAGING_PR: no`
- List concrete fixes; do not open `dev → staging` PR until user fixes or waives

## Do not

- Merge branches
- Push to `main`
- Waive security failures without user explicit ack in conversation
