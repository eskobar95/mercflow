# Bugbot — “runs once per PR” for MercFlow

Bugbot is **not** driven by GitHub Actions. Configure it in the **Cursor Dashboard** under **Bugbot** settings.

## Hard rule

- **`runs_per_pr: 1`** — Bugbot must run **exactly once** per pull request. Do not increase this for routine fixes or retries.

## How the pipeline uses it

1. **Chief Operator** reads the `bugbot` section in `.github/agent-pipeline.yml` for routing, hard rules, and fix hints.
2. **DevOps Workflow** addresses Bugbot findings (e.g. code changes, resolving review comments via the GitHub API) **without** re-triggering Bugbot.
3. If a Bugbot-related fix introduces a CI failure, that failure follows the normal CI → Chief Operator → DevOps flow; Bugbot does not re-evaluate the PR.

## Branch protection

When Bugbot exposes a required **GitHub status check**, enable branch protection rules that **require that check to pass before merge**. This keeps the “one run per PR” contract aligned with merge policy without running Bugbot twice.
