# /tech-lead-plan

**Usage:** `/tech-lead-plan <notion-prd-url>`

Break a finished PRD into vertical sprint tasks — ready for agent execution.

## What it does
1. Reads the PRD from Notion
2. Identifies all user-facing capabilities in the MVP scope
3. Maps them to vertical slices (each slice = one agent task, ~200k context budget)
4. Groups slices into sprints with logical sequencing
5. Creates tasks in the Notion Tasks database with full descriptions, acceptance criteria, package links, and blocked-by dependencies
6. Reports the complete plan summary

## Key principle: vertical slicing
Every task covers one user outcome end-to-end (DB + API + UI + tests). Never horizontal layers. See `.cursor/skills/po-orchestrator/SKILL.md` for the full methodology.

## Instructions
Read and follow `.cursor/skills/po-orchestrator/SKILL.md`, then execute **Role 2: Tech Lead Plan** on the provided PRD URL.

PRD URL: $input
