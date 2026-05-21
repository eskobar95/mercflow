# /ready-to-merge

**Usage:** `/ready-to-merge <notion-task-url>` or `/ready-to-merge <pr-url>`

Dispatch the Tech Lead Merge Agent after all review and Bugbot cycles are complete.

## When to run this
Run this command when:
- Bugbot ran and you have **fixed all flagged issues** (and re-pushed to the feature branch)
- Code Reviewer has approved (APPROVED)
- All CI checks are green
- You are ready for the automated squash merge

Do NOT run this if Bugbot hasn't run yet — use `/open-pr` first which posts `@Bugbot run`.

## What it does
1. Reads the Notion task URL and PR number
2. Verifies CI is green (`gh pr checks`)
3. Updates Notion task Status → "Ready to Merge"
4. Dispatches the Tech Lead Merge Agent via GitHub Actions:
   ```bash
   gh workflow run agent-runner.yml \
     --repo eskobar95/mercflow-os \
     --ref main \
     --field event_type=pr-ready-to-merge \
     --field notion_page_url="<notion-task-url>" \
     --field pr_number="<pr-number>"
   ```
5. The Tech Lead Merge Agent will:
   - Run pre-flight gates (PR state, Code Reviewer approval, Bugbot triage, CI)
   - Improve the PR description if needed
   - Squash merge to `development`
   - Delete the feature branch
   - Set Notion Status → Done automatically

## After this command runs
Monitor GitHub Actions (`mercflow-os` repo → Agent Runner workflow).
When Notion Status → "Done", run `/finish-task <notion-task-url>` to clean up the local worktree.

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md`, then execute the following steps:

1. Extract the PR number from the Notion task `PR URL` field (or from the input if a PR URL was given)
2. Check CI status: `gh pr checks <pr-number> --repo eskobar95/mercflow`
   - If any check is failing: stop and inform the user — run `/devops-check <pr-url>` first
3. Update Notion task Status → "Ready to Merge" via Notion MCP or REST API
4. Run the dispatch command:
   ```bash
   gh workflow run agent-runner.yml \
     --repo eskobar95/mercflow-os \
     --ref main \
     --field event_type=pr-ready-to-merge \
     --field notion_page_url="<notion-task-url>" \
     --field pr_number="<pr-number>"
   ```
5. Confirm dispatch succeeded and tell the user to monitor GitHub Actions

Task or PR: $input
