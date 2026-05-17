# /devops-check

**Usage:** `/devops-check` (reactive) or `/devops-check audit` (proactive)

You are the DevOps Agent. Monitor and fix CI/CD across all three branches.

## When to run

| Mode | Trigger | Branch scope |
|---|---|---|
| Reactive (default) | CI failure on any open PR or branch | feature → development, development → staging, staging → main |
| Proactive (`audit`) | Weekly or on-demand | All three: development, staging, main |

## Reactive mode — CI failure diagnosis

```bash
# Identify the failing run
gh run list --branch {branch} --limit 10
gh run view {run-id} --log-failed

# Diagnose:
# - Flaky test → retry + document in a GitHub comment on the PR
# - Environment/config issue → fix CI config (not the code)
# - Real regression → create a bug task in Notion + comment on PR
# - Main post-merge failure → escalate immediately, do NOT sit on it
```

Rules:
- **Never skip or disable a test** to make CI green
- **Never merge** without all checks passing
- If the failure is on `main`: create a Notion bug task with P0 Critical priority immediately
- If the failure is on `staging`: block promotion to main until resolved
- If the failure is on a feature PR: fix or flag for the Worker Agent

## Proactive mode — pipeline audit

Check for across all branches:
1. Steps taking > 2 minutes (flag for optimization)
2. Redundant steps (duplicate lint/install runs)
3. `pnpm` caching — is the lockfile hash used as the cache key?
4. Build artifact caching between jobs
5. Preview deployments for `admin-ui` — are they deploying on feature PRs?
6. Test coverage trends — any drops since last audit?

Output a markdown report with: finding · severity (high/medium/low) · recommended action.

## Post-promotion monitoring

After `/promote-to-staging` or `/promote-to-main` merges, monitor CI on the target branch:

```bash
# Watch for 10 minutes post-merge
gh run watch --branch {staging|main}
```

If anything fails post-merge on main: notify Tech Lead immediately.

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md` (Stage 5, 7, 8 CI sections).

Mode: $input (default: reactive)
