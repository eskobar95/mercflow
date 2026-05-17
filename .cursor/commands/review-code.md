# /review-code

**Usage:** `/review-code <feature-branch-name>` or `/review-code <notion-task-url>`

Run the Code Reviewer Agent on a completed implementation.

## What it does
1. Reads the full diff of the feature branch against `main`
2. Evaluates correctness, code quality, security, tests, and conventions
3. Outputs a structured review: APPROVED or CHANGES REQUESTED
4. If CHANGES REQUESTED: lists specific issues with file references for the Worker to fix
5. Tracks the review cycle count (max 3 before human escalation)
6. If APPROVED: confirms PR readiness

## When to run
After the Worker Agent reports implementation complete. Run again after each fix cycle.
Do NOT run while Bugbot review is active (Stage 5) — Bugbot handles that stage.

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md`, then execute **Stage 3: Code Review Loop**.

Branch or task: $input
