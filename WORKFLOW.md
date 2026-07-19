# Workflow

Orchestration policy for this Project. Edited via Factory Conductor.

## Branch strategy

- development: `development`
- staging: `staging`
- production: `main`

## Auto-merge categories

Tasks in these categories may auto-merge to development when CI is green:

- docs
- dependencies
- minor-fix

## Sandbox seed

- `sa`

## Concurrency

- limit: 2
