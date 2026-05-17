# /devops-check

**Usage:** `/devops-check` or `/devops-check <pr-url>`

Run the DevOps Agent to diagnose and fix CI failures, or proactively audit the pipeline.

## What it does

**When given a PR URL (reactive):**
1. Reads the CI failure log for the PR
2. Identifies root cause: flaky test / environment issue / real regression
3. Proposes a fix (or creates a Notion bug task if it is a real regression)
4. Never skips or disables tests to make CI green

**When run without arguments (proactive):**
1. Reviews pipeline run times for the last 7 days
2. Flags steps taking > 2 minutes
3. Checks pnpm and build caching configuration
4. Ensures preview deployments are operational

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md`, then execute **Stage 5: DevOps Agent** section.

Input (PR URL or empty for proactive audit): $input
