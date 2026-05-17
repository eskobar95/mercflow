# MercFlow Paperclip workflow

Dette dokument beskriver, hvordan vi bruger Paperclip som APM-lag oven på MercFlow-repoet.

## Principper

1. **Project er stabilt.** MercFlow er ét Paperclip project, fordi alle batches løbende bygger videre på samme monorepo.
2. **Batch er et epic issue.** Hver batch starter som et overordnet issue, fx `[Batch 2] Merchandising workflow — Orchestration`.
3. **Issue-liste er arbejdet.** Implementeringsopgaver kan ligge som selvstændige issues (samme batch-label) i stedet for at være sub-issues.
4. **Blocked by er den rigtige dependency graph.** Brug Paperclips `Blocked by`-felt, ikke kun tekst som “depends on #123”.
5. **Reviewer og Approver bruges bevidst.** Reviewer bruges til kvalitetstjek. Approver bruges til proces-/scope-signoff, typisk Walter eller menneske afhængigt af typen.
6. **Walter koordinerer.** Walter bruger orchestration-issuet som single entry point og frigiver opgaver én ad gangen ud fra `Blocked by`.

## Team


| Rolle             | Navn   | Bruges til                                                        |
| ----------------- | ------ | ----------------------------------------------------------------- |
| Technical Lead    | Walter | Batch orchestration, scope, sequencing, API-contract readiness    |
| Backend Engineer  | Todd   | Backend implementation, migrations, services, routes, API handoff |
| Frontend Engineer | Jesse  | Admin UI implementation from documented backend contract          |
| Reviewer          | Saul   | Read-only review, verification and blocking findings              |


## Issue-hierarki

### Project

Brug project-navn:

```text
MercFlow
```

Project-beskrivelse:

```text
Planning and delivery for the MercFlow monorepo: forked Medusa admin UI, native content module, design tokens, and the Medusa v2 backend app. Work is executed in rolling batches; later batches add scope on top of the same repository.
```

### Batch epic

Batch-epicet er det issue, der “starter” orchestration for Walter.

Titelmønster:

```text
[Batch N] <short batch name> — Orchestration
```

Beskrivelsen bør indeholde:

- Link til spec/PRD/plan.
- Batch nummeret i både titel (`[Batch N]`) og label (`batch-N`).
- Kort mål.
- In scope / out of scope.
- Liste over forventede workstreams.
- Label: `batch-N`.
- Assignee: Walter.
- Approver: menneske eller CEO, hvis batch-scope kræver godkendelse.

### Execution issues (recommended)

Execution-issues bør bruge dette mønster:

```text
[Batch N] <feature> — Backend
[Batch N] <feature> — Frontend
[Batch N] <feature> — Review
```

De kan være sub-issues, men standarden er at bruge selvstændige issues med fælles `batch-N` label.

Brug `Blocked by` aktivt:

- Frontend er blocked by Backend, når UI afhænger af ny API.
- Review er blocked by Backend/Frontend PR eller task completion.
- Docs/verification er blocked by den implementering, den dokumenterer/verificerer.

## Labels

Anbefalede labels:

- `mercflow`
- `batch-1`, `batch-2`, osv.
- `backend`
- `frontend`
- `review`
- `docs`
- `blocked`
- `api-contract`
- `migration`
- `needs-human`
- `ready-for-review`

Labels skal hjælpe Walter med at filtrere og gruppere. De skal ikke erstatte `Blocked by`.

## Reviewer vs approver

### Reviewer

Bruges til kvalitetskontrol:

- Reviewer agent på review-issues.
- Kan også sættes som reviewer på konkrete Backend/Frontend issues, hvis Paperclip-flowet understøtter det.
- Reviewer bør være read-only.

### Approver

Bruges til scope eller proces:

- Walter kan være approver på engineer tasks, hvis han kun signerer scope/contract readiness.
- Menneske/CEO bør være approver på batch-epics, API-contract ændringer og scope-ændringer.
- Approver er ikke det samme som GitHub merge approval.

## Walter-loop (controlled orchestration)

Når Batch N er planlagt:

1. Opret batch-orchestration-issuet.
2. Link til den **konkrete** PRD/spec/plan for Batch N i orchestration-beskrivelsen.
3. Opret execution-issues via MCP eller UI.
4. Sæt `Blocked by` afhængigheder mellem execution-issues.
5. Hold execution-issues i `backlog` som default.
6. Assign orchestration-issuet til Walter (`todo`/`in_progress` når han skal køre).
7. Kør Walter heartbeat.
8. Walter validerer batchnummer, source document, dependency graph, issue IDs og foreslår næste issue(s) der må flyttes til `todo`.
9. Du (human/operator) godkender og uddelegerer næste issue til rette agent.
10. Når alle execution-issues er korrekt uddelegeret og graphen er stabil, kan orchestration-issuet sættes `done`.

Hvis der findes flere PRD/spec-filer, må Walter kun bruge den fil, der er linket fra orchestration-issuet. Hvis link mangler, skal han spørge mennesket, før han planlægger.

## Orchestration issue template (recommended)

I orchestration-beskrivelsen skal der være en eksplicit issue-liste med IDs:

```markdown
## Batch source
- PRD/spec: <link>
- Batch: <N>

## Execution issues
- MER-101 — Backend: <title>
- MER-102 — Frontend: <title> (blocked by MER-101)
- MER-103 — Review: <title> (blocked by MER-101, MER-102)

## Dispatch policy
- Walter proposes next ready issue(s).
- Human/operator confirms delegation.
```

## Håndafleveringer

Backend til Frontend:

- Backend issue skal indeholde eller kommentere `## API handoff`.
- Frontend issue skal linke til handoff og være blocked by Backend indtil handoff findes.

Frontend/Backend til Reviewer:

- Sæt `ready-for-review`.
- Link PR, hvis den findes.
- Sæt Reviewer som reviewer eller assignee på review-sub-issue.

Walter til menneske:

- Brug label `needs-human`.
- Stil ét klart beslutningsspørgsmål.
- Sæt issue tilbage til menneske/CEO, hvis Paperclip-flowet kræver det.

## MCP-verified issue fields (smoke test)

Følgende blev verificeret via Paperclip MCP-oprettelse/opdatering (MER-4/5/6):

- `projectId` virker og bør sættes på både orchestration issue og sub-issues.
- `parentId` virker til sub-issues.
- `blockedByIssueIds` virker til dependency graph.
- `assigneeAgentId` virker til agent-routing.
- `status` og `priority` virker.
- `comment` ved update virker (god til orchestration log).
- `goalId` bliver automatisk sat fra projektet, hvis projektet er goal-linked.

Praktiske noter:

- Opret først blocker-issue, og brug derefter dets UUID i `blockedByIssueIds`.
- Hvis `blockedByIssueIds` peger på et issue i forkert company, får man `422`.
- Brug `paperclipGetIssue` efter oprettelse for at validere `ancestors`, `blockedBy` og `project`.

Felter der ikke er direkte simple top-level i den nuværende MCP-flow:

- reviewer/approver findes i UI, men i API-feltstrukturen håndteres avanceret godkendelsesflow via `executionPolicy.stages.participants`.
- labels kræver `labelIds` (UUIDs). Der er ikke et simpelt “label by name”-felt i de anvendte create/update tools.

