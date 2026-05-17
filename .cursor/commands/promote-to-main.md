# /promote-to-main

**Usage:** `/promote-to-main <sprint-name-or-version>`

You are the Tech Lead. Staging has been verified and you must promote `staging` → `main`.

## Pre-conditions (verify all before opening PR)

1. Confirm staging smoke tests have passed (check Notion Sprint comment from `/promote-to-staging`)
2. Fetch `staging` and `main` from origin — confirm staging is ahead of main
3. Check CI status on `staging`: `gh run list --branch staging --limit 5`
   - If any runs failed: stop and resolve with `/devops-check` first
4. Confirm no open issues on staging that would block release
5. Determine release version (semver or sprint number): `{version}`

## Open the release PR

```bash
git fetch origin staging main

# Determine what's changed since last release
git log origin/main..origin/staging --oneline

gh pr create \
  --base main \
  --head staging \
  --title "release: {version}" \
  --body "$(cat <<'EOF'
## Release {version}

### What's in this release
{one paragraph: what capabilities this release ships for end users}

### Sprint
{link to Notion Sprint}

### Tasks shipped
{list each Notion task title + URL}

### Staging verification
- [ ] Smoke tests passed on staging
- [ ] No regressions observed
- [ ] DevOps confirmed CI clean on staging
- [ ] All acceptance criteria verified

### Release notes
{short paragraph suitable for a changelog — user-facing language, no technical jargon}

### Rollback plan
Revert: `git revert -m 1 <merge-commit-sha>` then push to main.
Feature flags: {list if any features are flag-gated}

### Post-merge actions
- [ ] Tag the release (Tech Lead)
- [ ] Monitor CI on main (DevOps)
- [ ] Notify stakeholders (if applicable)
EOF
)"
```

## After main PR is merged

1. Tag the release:

```bash
git fetch origin main
git tag -a v{version} origin/main -m "Release {version}: {sprint name / short description}"
git push origin v{version}
```

2. Add a comment on the Notion Sprint page:

```
Agent: Tech Lead
Action: Released to production

Version: v{version}
PR: {main-pr-url}
Tag: v{version}
Released: {timestamp}

This sprint is complete and live on main.
```

3. Monitor CI on main post-merge — run `/devops-check` if anything fails
4. If a critical bug is found post-release: create a hotfix task in Notion immediately
   (do NOT commit directly to main — hotfix goes through development → staging → main)

## Instructions
Read and follow `.cursor/skills/agent-workflow/SKILL.md` (Stage 8) and `.cursor/skills/tech-lead/SKILL.md`.

Release: $input
