# Paperclip sync — Batch 2

- **Synced at (UTC):** 2026-04-25 (Manager sync via `paperclipCreateIssue` / `paperclipAddComment`)
- **Project:** Mercflow (Paperclip id `4cd6a010-0149-4f0b-bfea-6e8d1888e093`, urlKey `mercflow`)
- **Source documents (repo):** `.apm/plan.md`, `.apm/spec.md`, `.apm/tracker.md`, `AGENTS.md`, `.cursor/docs/PRD-batch2.md`

## Orchestration issue

| Field | Value |
|-------|--------|
| Identifier | **MER-12** |
| UUID | `d40ffc4a-908a-4f72-8161-3a455c93ac90` |
| Assignee | Walter (Tech Lead) |
| Status | `backlog` |

## Execution issues (21)

**Convention:** `Blocked by` in Paperclip matches APM Plan dependencies. All execution issues use `parentId` = MER-12. Assignees: **Todd** = backend, **Jesse** = frontend, **Saul** = review/docs; mapping from APM Workers (Platform/SEO/Feed/Inventory → Todd; Admin UI → Jesse; QA Docs → Saul).

| APM task | MER | Title (short) | UUID | Blocked by (issue ids) | Assignee |
|----------|-----|---------------|------|------------------------|----------|
| 1.1 | MER-13 | Module scaffolds and backend integration | `ec157f6b-e0c9-47db-a05f-d20cab83d6c6` | — | Todd |
| 1.2 | MER-14 | SEO domain contracts and schema plan | `52ecfb61-1731-430a-a726-203110ab754a` | MER-13 | Todd |
| 1.3 | MER-17 | Feed domain contracts and schema plan | `f4ae5859-caf7-400f-ba0c-0d918cedd162` | MER-13, MER-14 | Todd |
| 1.4 | MER-15 | Inventory and order domain contracts | `180fd30f-287c-4d74-a6d9-3190064bb921` | MER-13 | Todd |
| 1.5 | MER-16 | Batch 2 admin navigation and page patterns | `5fd80eee-d10d-4f47-98c9-45a39ca3043a` | MER-13 | Jesse |
| 2.1 | MER-18 | Nordic slug utility and redirect core | `9e19a6df-6a2c-41ee-a456-0addcebef898` | MER-13, MER-14 | Todd |
| 2.2 | MER-19 | Redirect APIs and public redirect handling | `e98cf33f-5164-4a95-a3ab-7aff675f5dc6` | MER-18, MER-13 | Todd |
| 2.3 | MER-20 | Sitemap and robots backend output | `2c259f39-29cf-4a50-8e9c-fba087e8e5ae` | MER-19, MER-13 | Todd |
| 2.4 | MER-21 | SEO admin pages | `7bc93109-f5d9-4985-9fa3-8268e16fd8df` | MER-19, MER-20, MER-16 | Jesse |
| 3.1 | MER-22 | Structured metadata services | `5593a2d7-8b8b-4ed3-89f2-6c168597d671` | MER-14, MER-20 | Todd |
| 3.2 | MER-23 | Google Shopping XML backend | `d9a2a50a-24a0-4f51-b4ff-d1c65f42ce76` | MER-17, MER-22, MER-13 | Todd |
| 3.3 | MER-24 | Metadata and feed admin UI | `2fae29b8-59f6-4c29-8374-616989ba22d7` | MER-22, MER-23, MER-16 | Jesse |
| 3.4 | MER-25 | Feed and SEO output tests | `fd69c75a-23c5-4668-b382-36bb3791376b` | MER-22, MER-23 | Saul |
| 4.1 | MER-26 | Supplier and purchase order backend | `8965ce1c-6007-4309-aa78-8dfc6d27a99d` | MER-15, MER-13 | Todd |
| 4.2 | MER-27 | PO receipts, incoming, inventory overview | `554829ec-3e96-4f0d-827b-b004362d8907` | MER-26 | Todd |
| 4.3 | MER-28 | Internal order notes and pick list backend | `142e615b-f6dc-4175-a295-3a575a9a9c76` | MER-27 | Todd |
| 4.4 | MER-29 | Supplier and PO admin workflows | `135f8de2-574c-49dc-a45e-be7f17cbd1a6` | MER-26, MER-27, MER-16 | Jesse |
| 4.5 | MER-30 | Inventory dashboard and order operations UI | `43757212-0752-4723-a6ae-deed5df25850` | MER-27, MER-28, MER-29 | Jesse |
| 5.1 | MER-31 | Package and app README updates | `1a1c71d1-4088-4075-b97f-ad30021bd3b5` | MER-21, MER-24, MER-30 | Saul |
| 5.2 | MER-32 | Cross-domain automated validation | `c4502f80-18a4-48c5-92a0-64bd27dfd1f7` | MER-31, MER-25 | Saul |
| 5.3 | MER-33 | Internal scenario and release readiness | `3d401e4a-e4ed-46df-bbc7-9826693106e5` | MER-32, MER-21, MER-24, MER-30 | Saul |

**Totals:** 1 orchestration + 21 execution = **22** issues in Paperclip for this batch.

## Dependency graph status

- **Status:** **Complete** for the 21 APM tasks in `.apm/plan.md`. Each issue’s `blockedByIssueIds` was set at creation to match Plan dependencies.
- **Cross-check:** Re-run `paperclipGetIssue` on a sample of issues (e.g. MER-23) to confirm `blockedBy` in API response if needed.

## Needs human decision / follow-up

1. **Labels:** Recommended `mercflow` and `batch-2` (see `.paperclip/WORKFLOW.md`). MCP create/update in this run did not set `labelIds` (UUIDs for labels were not available read-only in this path).
2. **APM vs Paperclip names:** APM `platform-agent` / SEO / Feed / Inventory Workers map to **Todd** for Paperclip; `admin-ui-agent` → **Jesse**; `qa-docs-agent` → **Saul**. Walter owns orchestration, not per-task APM execution (Cursor Workers remain the APM path).

## Next steps (process)

1. Commit and push this file (and any related repo changes) per `/apm-2.6-commit-sync`.
2. Run `/apm-2.7-start-orchestration` to trigger Walter on **MER-12** after push.
