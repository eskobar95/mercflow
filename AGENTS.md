APM_RULES {

## Communication

- Respond to the User in Danish unless the User explicitly requests another language.
- Use English for all code, comments, identifiers, commit messages, and technical documentation.
- Keep status updates concise and actionable.
- When project management context matters, validate the work against the current Batch 1 scope and the project guidelines in this file before proceeding.

## Project Boundaries

- MercFlow is an opinionated Medusa v2 distribution built from MercFlow-owned packages and app-level integration points.
- Do not modify Medusa core packages, `node_modules`, or third-party source files directly.
- Do not touch Guapo production configuration, credentials, environment variables, or other Guapo-specific production assets.
- Batch 1 work is admin-layer work. Do not add storefront integrations, Nordic payment/shipping modules, page builder/blog work, dark mode, or public release work unless the User explicitly changes scope.
- Keep backend custom logic in MercFlow modules and backend registration points. The backend app registers modules; it should not become a dumping ground for custom business logic.

## TypeScript and Code Style

- TypeScript is strict. Do not use `any`; use `unknown` with narrowing or define proper types.
- Prefer `type` for data shapes. Use `interface` only when extension through `extends` is intended.
- Give functions explicit return types unless the type is trivially inferred from a one-line primitive return.
- Avoid top-level barrel re-exports unless they are required for a package public API.
- Order imports as Node built-ins, third-party packages, internal workspace packages, then relative imports, with a blank line between groups.
- Prefer configured path aliases over deep relative imports.
- Use PascalCase for component files and React components, camelCase for hooks/utilities, SCREAMING_SNAKE_CASE for constants, and snake_case for database columns and API route parameters.
- Do not leave `console.log` or debugging artifacts in completed work.

## UI and Design Tokens

- The admin UI should be light, clean, spacious, and easy to scan.
- All visual values must come from `packages/design-tokens`. Do not hardcode hex colors, arbitrary Tailwind values, spacing, font sizes, radii, or shadows.
- If a needed visual value is missing, add or request a token instead of working around the token system.
- Build admin UI in this hierarchy: Radix primitives, MercFlow base components in `components/ui`, feature components, then pages.
- Page-level components compose feature components and delegate business logic to hooks.
- Always handle loading and error states explicitly. Do not silently render nothing on errors.
- Interactive UI must be keyboard accessible, use semantic HTML, associate labels with form inputs, and avoid using color as the only way to convey information.

## Navigation and List Views

- Use dedicated pages with URL routing for primary entity navigation, forms with more than four fields, deep-linkable flows, and primary workflow actions.
- Use modals only for destructive confirmations, short focused forms, and contextual actions that do not need their own URL.
- Page-level navigation should use the shared page transition pattern. Do not invent custom transitions per page.
- List views should include a header, filters, typed table columns, sortable columns where applicable, row actions in a dropdown, pagination, useful empty states, and skeleton loading for full-page loads.
- Every list view should support keyboard-friendly operation.

## Rich Text

- Use TipTap v2 for content rich text editing.
- Store rich text as TipTap JSON. Do not store HTML directly.
- Use the standard extension set unless the User explicitly approves an addition: `StarterKit`, `Link` with `openOnClick: false`, `Image` through media upload, and `CharacterCount`.

## Localization and Medusa (APM)

- **Core vs MercFlow:** Use **Medusa’s** product and category UIs, translation flows, and Admin APIs for **titles, handles, slugs, and Medusa’s own description/translation fields**. Use the **MercFlow content module and admin content routes** for **rich text (`description_rich`), SEO fields, media gallery, and category banner** per the content module README and field definitions. Do not duplicate the same meaningful field in two places.
- **Locale list:** The set of available editing languages is driven by the **store and Medusa admin** (e.g. `GET /admin/locales` or JS SDK equivalent). **Do not** hardcode a production language list in MercFlow.
- **Locale codes:** The `?locale=` query on MercFlow content APIs must use the **same codes** Medusa uses (typically BCP-47 as returned by the Admin API). Align the content UI with that source.
- **Switching language in admin (UX):** **Autosave (or a clear save) before** changing the active editing language for content; if save **fails**, show an error and **do not** complete a silent switch. Loading and error states must be explicit.
- **Upgrades:** Keep MercFlow schema in the **content module**; do not patch `node_modules` or alter Medusa core entity definitions. Follow Medusa’s upgrade notes for breaking API changes; manage MercFlow migrations separately.
- **Documentation is required** when you touch this area: point operators and the next developer to where core translations are edited vs the Content tab, and how locale is resolved.

## Content Module and Medusa Data Layer

- Content-related data models, services, migrations, and API extensions belong in the MercFlow content module.
- Use Medusa DML through `model.define` for data models. Do not write raw MikroORM entity classes.
- Do not define `created_at`, `updated_at`, or `deleted_at` manually; Medusa DML manages them.
- Extend `MedusaService` for module services. Do not build service classes from scratch.
- Put business validation and transformations in the service layer. Route handlers should validate input and delegate business behavior.
- Use Medusa's `MedusaError` for service-layer errors. Do not throw raw `Error` objects from services.
- Use Zod for admin API request validation before accessing request body fields.
- Locale-aware content should read and write only the active locale, defaulting to `en` when no locale is provided.

## Database and Migrations

- PostgreSQL is the local database target for development, preferably running through Docker.
- In local development, migrations may be generated, run, reverted, and iterated as needed for the current task.
- Never generate or run migrations against production or staging without explicit written instruction from the User in the current task.
- Generate schema migrations from DML with Medusa tooling. Do not hand-write migration SQL from scratch.
- Add a migration decision log comment to every migration file, including reason, changes, reversibility, and generation method.
- Once committed, migration files are immutable. Create a new migration for later schema changes.
- Use DML defaults for database types: `model.id()` for primary keys, `model.text()` for strings and foreign key IDs, `model.json()` for structured data, and `model.array()` for arrays of IDs.
- Do not use `varchar(n)` for application data unless a third-party integration requires a database-level length. Enforce length constraints in services and API validation.
- Use soft delete behavior through the service layer. Do not hard-delete application records except in migration rollback cleanup or explicitly confirmed purge operations.

## Documentation

- A README belongs in the directory it describes.
- When creating a new package or app directory, create its `README.md` before writing code in that package or app.
- Package and app READMEs must explain responsibility, how to run/test in isolation, key conventions, and what does not belong there.
- The content module README must also include field definitions, API route reference, and migration workflow.
- Update the relevant package README in the same change when adding significant package functionality.
- Do not create extra package-level markdown files unless explicitly needed, such as a changelog.

## Verification

- Run the most relevant available validation for changed code: typecheck, tests, lint, build, migration commands, or local browser smoke checks depending on the touched area.
- After substantive edits, check diagnostics for recently edited files and fix introduced issues when the fix is clear.
- Validate database and backend work against local PostgreSQL, not production or staging.
- For admin UI work, verify accessibility basics, loading states, error states, and token-backed styling.
- For content module work, verify model definitions, migration behavior, service validation, API validation, and README accuracy.

## Stop and Ask

- Stop and ask the User before changing public API contracts, route paths, response shapes, field names, or content model fields.
- Stop and ask if a task requires a production or staging migration.
- Stop and ask if it is unclear whether a new UI element belongs in `admin-ui` or `design-tokens`.
- Stop and ask if two existing codebase patterns conflict and no canonical pattern is clear.
- Stop and ask if the task is underspecified and reasonable interpretations would lead to meaningfully different implementations.

## Version control and commits

- Follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): short description` (English).
- Use types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, and `migration` for database migration commits only.
- One commit per logical, working change unless an APM Task batch explicitly requires multiple commits on the same branch.
- Feature branch names are short, kebab-case, and describe the work; they do not include APM stage or task numbers.

## APM — Manager use of subagents

The Manager uses **Task** subagents only when the work fits the categories below. Routine coordination (read Task Logs, update Tracker, write Task Prompts, merge clean branches) runs **without** a subagent.


| Situation                                                                                             | Subagent                                   | When to use                                                                                                                              |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Large or ambiguous codebase or artifact investigation; risk of burning Manager context on exploration | `explore` (read-only)                      | Before changing planning documents or follow-up prompts when the answer requires reading many files or tracing patterns across the tree. |
| Non-trivial merge conflicts, or a defect that needs deep cross-file tracing                           | `generalPurpose` or `shell` as appropriate | When the Manager cannot resolve from the Task Log and a focused investigation is needed.                                                 |
| Holistic stage verification (integration checks) that are too heavy to run inline                     | `tester` or `explore`                      | When task-review calls for end-of-stage verification and the Manager cannot run the full validation in-session.                          |
| Medusa or DB migration work                                                                           | `migrator`                                 | Only when a task explicitly involves generating or running MercFlow `content-module` migrations per project rules.                       |


**Do not** spawn subagents for: drafting or delivering Task Prompts, routine Tracker or bus updates, straightforward log review, or merges that complete with no conflicts.

} //APM_RULES