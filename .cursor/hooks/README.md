# Hooks

Shell scripts triggered by Cursor hook events. Installed via:

- `.cursor/hooks/` → symlink to `.factory/kit/hooks`
- `.cursor/hooks.json` → symlink to `.factory/kit/hooks/hooks.json`

## Configuration

[hooks.json](hooks.json) registers scripts by event:

| Event | When | Scripts |
|-------|------|---------|
| `afterFileEdit` | After agent edits a file | `run-typecheck.sh`, `run-security-audit.sh` |
| `stop` | End of agent turn | `run-stop-checks.sh` |
| `beforeShellExecution` | Before shell command | `guard-branches.sh`, `guard-secrets.sh` |

Paths in `hooks.json` use `.cursor/hooks/…` because Cursor resolves from project root through the symlink.

## Scripts

| Script | failClosed | Description |
|--------|------------|-------------|
| [run-typecheck.sh](run-typecheck.sh) | yes | `pnpm typecheck` on `.ts/.tsx` edits |
| [run-security-audit.sh](run-security-audit.sh) | no | `pnpm audit` on package file changes; logs to diary |
| [run-stop-checks.sh](run-stop-checks.sh) | no | Lint + secret scan; may auto-correct via followup |
| [guard-branches.sh](guard-branches.sh) | yes | Block force push and direct commits to protected branches |
| [guard-secrets.sh](guard-secrets.sh) | yes | Block `git add/commit` of env files and keys |

## Permissions

`install.sh` and `update.sh` run `chmod +x` on all `*.sh` files.

## Legacy JSON files

`typecheck-on-save.json` and `security-on-package-change.json` are reference configs — the active config is `hooks.json`.

## Troubleshooting

1. Confirm symlinks: `ls -la .cursor/hooks.json .cursor/hooks/`
2. Re-run `./.factory/kit/update.sh`
3. Check hook output in Cursor's hook panel / agent transcript
