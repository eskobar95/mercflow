---
name: review
description: Two-phase task review — acceptance criteria and security, then thermo-nuclear maintainability audit on the diff
---

# Review skill

Code review for **one task** after verify passes. Two phases; **both** must pass for harness to proceed to close.

## Inputs

- Task section in `.factory/planning/tasks.md`
- Git diff: `git diff dev...HEAD` (or merge-base with `dev`)
- Changed files list + line counts for touched files (check 1k boundary)

## Phase 1 — Task fit (Factory)

Confirm the change matches the task contract.

### 1. Acceptance criteria

For each checkbox in **Acceptance criteria**:

- Met — cite file/line or test
- Not met — explain gap

### 2. Slice objective

Does the change deliver what **Slice objective** promises?

### 3. Scope

- Nothing from **Out of scope** implemented?
- Only **Layers in scope** touched?

### 4. Edge cases

- Error paths, validation, empty/loading states (UI tasks)

### 5. Security (TECHSPEC + base rules)

- No secrets, tokens, or PII in logs
- Authz on sensitive mutations
- Input validation at API boundaries
- No unsafe `dangerouslySetInnerHTML` without sanitization

### 6. Definition of done

- typecheck / lint / tests (verify)
- No debug artifacts
- PR description ready for close

**Phase 1 FAIL** if any acceptance criterion unmet, scope drift, or red security issue.

---

## Phase 2 — Thermo-nuclear maintainability

Apply **`skills/harness/thermo-nuclear-code-quality-review/SKILL.md`** to the same diff.

Read that skill fully. Run the core prompt and non-negotiable standards against **only what this task changed**.

Focus:

- Code-judo / structural simplification opportunities missed
- File size (especially crossing **1000 lines**)
- Spaghetti branching and special-case growth
- Wrong layer, duplicate helpers, weak abstractions
- Type/boundary noise (`any`, unnecessary optionality)

Use thermo-nuclear **Review Tone** — direct, high-conviction, not cosmetic nits.

**Phase 2 FAIL** if thermo-nuclear approval bar is not met (presumptive blockers in that skill).

### Scope note for harness tasks

- Require **meaningful** maintainability within task scope.
- Do **not** FAIL for pre-existing debt in untouched files unless this diff makes it worse.
- Large structural refactors beyond task scope → note as follow-up in close PR, not necessarily FAIL, unless the diff itself introduced the regression.

---

## Combined verdict

| Phase 1 | Phase 2 | Result |
|---------|---------|--------|
| pass | pass | **PASS** |
| fail | * | **FAIL** |
| pass | fail | **FAIL** |

```markdown
## Review — T[id]

**Result:** PASS | FAIL

### Phase 1 — Task fit
**Result:** pass | fail

#### Acceptance criteria
| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | … | pass/fail | … |

#### Security
[pass / issues]

#### Scope
[pass / drift noted]

### Phase 2 — Thermo-nuclear
**Result:** pass | fail

| Priority | Finding | Remedy |
|----------|---------|--------|
| structural | … | … |

**Presumptive blockers:** [list or none]

### Findings (consolidated)
| Severity | Phase | Finding | Suggested fix |
|----------|-------|---------|---------------|
| high | 1 or 2 | … | … |

### Recommended action
[Proceed to close | Return to implement with numbered fixes]
```

Severity guide:

- **high** — Phase 1 unmet criteria, security, or Phase 2 presumptive blocker
- **medium** — Should fix in this task revision (maintainability)
- **low** — Follow-up tech debt (document in close PR only if not blocking)

## Revision guidance

On FAIL, findings must be **actionable** (file + change). Harness allows max **2** revision cycles.

Prioritize fixes: Phase 1 blockers first, then Phase 2 structural issues.

## Optional: subagent

For large diffs (>15 files or >800 lines changed), parent harness may spawn a **thermo-nuclear-code-quality-review** subagent with the diff summary, then merge into Phase 2. Single-agent review is fine for small tasks.

## Do not

- Merge PR or mark task done
- PASS Phase 2 because "tests pass" or Phase 1 alone passed
- Approve scope creep as "nice to have"

## Skills referenced

- `skills/harness/thermo-nuclear-code-quality-review/SKILL.md`
