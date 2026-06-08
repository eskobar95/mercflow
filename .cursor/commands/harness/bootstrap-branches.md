# /bootstrap-branches

Create `dev` and `staging` branches from `main` if missing — required before first `/run-sprint`.

## Usage

```text
/bootstrap-branches
```

## Procedure

1. Detect default branch: `main` or `master` (`git symbolic-ref refs/remotes/origin/HEAD` or `main`)
2. If `dev` missing locally:
   ```bash
   git checkout <default>
   git pull origin <default>
   git checkout -b dev
   git push -u origin dev
   ```
3. If `staging` missing:
   ```bash
   git checkout <default>
   git checkout -b staging
   git push -u origin staging
   ```
4. Return to previous branch
5. Document in `.factory/logs/diary.md` (optional one-liner)

## Safety

- Never force-push
- Never delete existing `dev` or `staging`
- If branches exist but diverged, report and stop — human resolves

## Output

```markdown
## Bootstrap branches
**dev:** created | already exists
**staging:** created | already exists
**Next:** /run-sprint S001 or /to-backlog
```

## Do not

- Commit application code
- Merge branches
