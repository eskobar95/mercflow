---
name: worktree-code-review
description: Conduct a thorough professional code review of all changes made in a git worktree session. Use when a worktree build is complete and needs peer review — checks correctness, code quality, security, test coverage, and refactoring opportunities. Launches as a sub-agent with clean context; reads only the diff between the worktree branch and its base.
disable-model-invocation: true
---

# Worktree Code Review

Professional code review of everything built or changed inside a git worktree. Mirrors how a senior engineer reviews a colleague's pull request: structured, evidence-based, and actionable.

## When to apply

- A worktree session has finished and the Manager (or user) asks for a review before merging.
- You are a sub-agent spawned with a clean context window — you have **no knowledge** of what was built unless you read the diff yourself.

---

## Workflow

### 1. Orient yourself

```bash
git rev-parse --show-toplevel
git status
git log --oneline -10
```

Identify:
- **Current branch** (the feature branch)
- **Base branch**: always `development` in MercFlow (never `main` or `staging`)

### 2. Collect the diff

```bash
# All files changed vs development
git diff development...HEAD --stat

# Full diff (read this carefully)
git diff development...HEAD
```

If the diff is very large (>1 000 lines), prioritise:
1. New files added
2. Modifications to core logic / business rules
3. Schema or API contract changes

### 3. Preflight checks

```bash
pnpm typecheck     # must pass — no new errors
pnpm lint          # must pass — no new errors
pnpm test          # run narrowest test scope covering touched files
pnpm build         # if UI package is touched
```

Record pass / fail for each. A failing preflight is a **Critical** finding that blocks approval.

### 4. In-depth analysis

Examine every changed file against the seven pillars:

| Pillar | Key questions |
|---|---|
| **Correctness** | Does it do what the task requires? Any bugs, off-by-ones, wrong conditions? |
| **Security** | Secrets in code? Unvalidated input at API boundaries? SQL injection, XSS? Auth checks missing? |
| **Maintainability** | Clear naming, small focused functions, no God objects? Would a new colleague understand it in 6 months? |
| **Readability** | Comments explain *why*, not *what*. Consistent style. No dead code or commented-out blocks. |
| **Efficiency** | N+1 queries? Unnecessary re-renders or recomputes? Large allocations in hot paths? |
| **Edge cases & error handling** | What happens on null/empty/zero input? Network failures handled? Errors surfaced to the user? |
| **Test coverage** | New logic covered by unit or integration tests? Happy path **and** failure paths tested? |

### 5. MercFlow-specific checks (always apply)

- **Server / Client boundary**: No DB or auth imports in `"use client"` files (admin-ui)
- **Schema changes**: Migration file present? `db:generate` + `db:migrate` pattern followed? Migration has decision-log comment at top?
- **Secrets**: No hardcoded credentials. New env vars added to `.env.example`
- **Medusa DML**: Never manually define `created_at`, `updated_at`, `deleted_at` — Medusa handles these
- **API response shapes**: `{ data: ... }` for single, `{ data: [...], count, limit, offset }` for lists
- **Input validation**: Zod validation before any field access in route handlers
- **Design tokens**: No hardcoded hex, spacing, or Tailwind arbitrary values in admin-ui
- **Conventional Commits**: Commit messages follow `feat(pkg):`, `fix(pkg):`, `migration(pkg):` etc.
- **Vertical slice scope**: Does the PR stay within its declared scope? No scope creep into other tasks?

---

## Output format

```
## Code Review — <branch-name>

### Preflight
| Check | Result |
|---|---|
| Typecheck | ✅ PASS / ❌ FAIL |
| Lint | ✅ PASS / ❌ FAIL |
| Tests | ✅ PASS / ❌ FAIL |
| Build | ✅ PASS / ❌ FAIL (only if UI touched) |

### Summary
One paragraph: what was built, overall quality signal, and the verdict.

### Findings

#### 🔴 Critical — must fix before merge
- **[file:line]** Description. Why it matters. How to fix.

#### 🟡 Improvement — strongly recommended
- **[file:line]** Description. Suggested approach.

#### 🔵 Refactor — clean-up opportunity
- **[file:line]** Description. Why it improves the codebase.

#### 💬 Nitpick — optional polish
- **[file:line]** Description.

### Verdict
**✅ Approved** / **🔄 Approve with follow-up** / **❌ Request changes**

If "Request changes": list every Critical finding that must be resolved.
If "Approve with follow-up": list concrete follow-up tasks with risk and expiry.
```

---

## After the review

### If ✅ Approved or 🔄 Approve with follow-up:

Open the PR:
```bash
gh pr create \
  --repo eskobar95/mercflow \
  --base development \
  --head {feature-branch} \
  --title "{slice objective} ({package})" \
  --body "..."
```

Update Notion task:
- Set Status → In Review
- Copy PR URL to "PR URL" field
- Add comment with the full review output

### If ❌ Request changes:

Do NOT open a PR.

Add a comment on the Notion task with the full review output.
Set Notion task Status → Blocked.

The Implementation Agent will be triggered automatically (via webhook) with a fresh
context window to address the listed Critical findings.

---

## Tone and conduct

- Be precise: cite file and line numbers for every finding.
- Be constructive: propose a fix or alternative, not just a complaint.
- Be proportionate: distinguish blocking from polish; don't inflate nitpicks.
- Be thorough but efficient: skip obvious boilerplate; focus on business logic, security, and data paths.

**Never** downgrade a security or data-loss issue to Improvement to soften the message.

---

## Severity guide

| Level | Use when |
|---|---|
| 🔴 Critical | Bug, security hole, data loss risk, failing preflight, broken build |
| 🟡 Improvement | Correctness concern, missing edge-case, no tests for important path |
| 🔵 Refactor | Duplication, poor naming, overly complex function |
| 💬 Nitpick | Style, minor naming preference, optional comment |
