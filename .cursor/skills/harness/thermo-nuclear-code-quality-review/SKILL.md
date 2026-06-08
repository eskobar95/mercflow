---
name: thermo-nuclear-code-quality-review
description: Extremely strict maintainability review — abstraction quality, 1k-line rule, spaghetti growth, code-judo simplification. Used by Factory harness review step.
source: https://github.com/cursor/plugins/blob/main/cursor-team-kit/skills/thermo-nuclear-code-quality-review/SKILL.md
---

# Thermo-Nuclear Code Quality Review

> Vendored from Cursor Team Kit (`cursor-team-kit`). Factory harness invokes this during `skills/harness/review/SKILL.md` Phase 2.

Use for an unusually strict review focused on implementation quality, maintainability, abstraction quality, and codebase health.

Above all, push the reviewer to be **ambitious** about code structure. Do not merely identify local cleanup opportunities. Actively search for "code judo" moves: restructurings that preserve behavior while making the implementation dramatically simpler, smaller, more direct, and more elegant.

## Core Prompt

Start from this baseline:

> Perform a deep code quality audit of the current branch's changes.
> Rethink how to structure / implement the changes to meaningfully improve code quality without impacting behavior.
> Work to improve abstractions, modularity, reduce Spaghetti code, improve succinctness and legibility.
> Be ambitious, if there is a clear path to improving the implementation that involves restructuring some of the codebase, go for it.
> Be extremely thorough and rigorous. Measure twice, cut once.

Scope: **`git diff dev...HEAD`** (task branch vs `dev`) unless harness specifies otherwise.

## Non-Negotiable Additional Standards

Apply the baseline prompt above, plus these explicit review rules:

0. **Be ambitious about structural simplification.**
   - Do not stop at "this could be a bit cleaner."
   - Look for opportunities to reframe the change so that whole branches, helpers, modes, conditionals, or layers disappear entirely.
   - Prefer the solution that makes the code feel inevitable in hindsight.
   - Assume there is often a "code judo" move available.
   - If you see a path to delete complexity rather than rearrange it, push hard for that path.

1. **Do not let a PR push a file from under 1k lines to over 1k lines without a very strong reason.**
   - Treat this as a strong code-quality smell by default.
   - Prefer extracting helpers, subcomponents, modules, or local abstractions instead of letting a file sprawl past 1000 lines.
   - If the diff crosses that threshold, explicitly ask whether the code should be decomposed first.

2. **Do not allow random spaghetti growth in existing code.**
   - Be highly suspicious of new ad-hoc conditionals, scattered special cases, or one-off branches inserted into unrelated flows.
   - Prefer pushing logic into a dedicated abstraction, helper, state machine, policy object, or separate module.

3. **Bias toward cleaning the design, not just accepting working code.**
   - If behavior can stay the same while the structure becomes meaningfully cleaner, push for the cleaner version.
   - Strongly prefer simplifications that remove moving pieces altogether.

4. **Prefer direct, boring, maintainable code over hacky or magical code.**

5. **Push hard on type and boundary cleanliness when they affect maintainability.**

6. **Keep logic in the canonical layer and reuse existing helpers.**

7. **Treat unnecessary sequential orchestration and non-atomic updates as design smells when the cleaner structure is obvious.**

## Primary Review Questions

For every meaningful change, ask:

- Is there a "code judo" move that would make this dramatically simpler?
- Can this change be reframed so fewer concepts, branches, or helper layers are needed?
- Does this improve or worsen the local architecture?
- Did the diff add branching complexity where a better abstraction should exist?
- Did a previously cohesive module become more coupled, more stateful, or harder to scan?
- Is this logic living in the right file and layer?
- Did this change enlarge a file or component past a healthy size boundary?
- Are there repeated conditionals that signal a missing model or missing helper?
- Is the implementation direct and legible, or does it rely on special cases and incidental control flow?
- Is this abstraction actually earning its keep, or is it just a wrapper?

## What to Flag Aggressively

Escalate findings when you see:

- A complicated implementation where a cleaner reframing could delete whole categories of complexity.
- A file crossing 1000 lines due to the PR, especially if the new code could be split out.
- New conditionals bolted onto unrelated code paths.
- One-off booleans, nullable modes, or flags that complicate existing control flow.
- Feature-specific logic leaking into general-purpose modules.
- Thin wrappers or identity abstractions that add indirection without simplifying anything.
- Unnecessary casts, `any`, `unknown`, or optional params that muddy the real contract.
- Copy-pasted logic instead of extracted helpers.
- Bespoke helpers where the codebase already has a canonical utility.

## Preferred Remedies

Prefer suggestions that delete layers, reframe state models, extract modules, reuse canonical helpers, and make type boundaries explicit.

Do not be satisfied with "maybe rename this" when the real issue is structural.

## Review Tone

Be direct and demanding about quality. Do not soften major maintainability issues into mild suggestions.

## Output (for Factory harness)

Return a subsection mergeable into the Review report:

```markdown
### Thermo-nuclear (maintainability)
**Result:** PASS | FAIL

| Priority | Finding | Remedy |
|----------|---------|--------|
| structural | … | … |

**Presumptive blockers:** [list or none]
```

## Approval Bar (thermo-nuclear only)

Do not PASS this phase merely because behavior seems correct.

**FAIL** if any presumptive blocker applies:

- PR preserves incidental complexity when a plausible code-judo move would delete it
- PR pushes a file from below 1000 lines to above 1000 lines
- PR adds ad-hoc branching that tangles an existing flow
- PR scatters feature checks across shared code
- PR adds unnecessary abstraction, wrapper, or cast-heavy contract
- PR duplicates an existing helper or puts logic in the wrong layer

Prioritize findings: structural regressions → missed code-judo → spaghetti → boundaries → file size → legibility.

Do not flood with cosmetic nits when structural issues exist.
