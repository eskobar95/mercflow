# Paperclip setup for MercFlow

Denne mappe dokumenterer, hvordan MercFlow bruger Paperclip til APM, batch-planlægning, agentkoordinering og issue-flow.

Dokumenterne er delt i to typer:

- **Dansk procesdokumentation** til os mennesker: hvordan vi tænker Paperclip-strukturen og bruger den i praksis.
- **Engelske rules/commands** til Paperclip-agenterne: de kan kopieres ind i agent instructions, skills, commands eller issue templates.

## Filer

- `WORKFLOW.md` — dansk gennemgang af projekt, batch-epics, sub-issues, blockers, reviewers og approvers.
- `RUNBOOK-APM-PAPERCLIP.md` — operationel sekvens fra lokal APM planlægning til Paperclip orchestration.
- `rules/mercflow-paperclip-rules.md` — engelske regler for alle MercFlow Paperclip-agenter.
- `commands/walter-batch-orchestration.md` — engelske kommando-/promptmønstre til Walter, især når en ny batch skal startes.
- `agents/team.md` — dansk team-overblik med rolle, navn, rapportering og Paperclip-opsætning.
- `agents/prompt-templates.md` — engelske prompt templates til Paperclip-agentfelterne.
- `agents/walter.md` — dansk note om Walters rolle og hvor hans faktiske Paperclip instructions ligger.

## Grundmodel

MercFlow bør have **ét Paperclip project** for repoet. Batches er ikke nye projects; de er **epic issues** med sub-issues.

Anbefalet struktur:

```text
Project: MercFlow
└── Issue: [Batch 2] <name> — Orchestration
    ├── Sub-issue: <feature> — Backend
    ├── Sub-issue: <feature> — Frontend
    ├── Sub-issue: <feature> — Review
    └── Sub-issue: <docs / cleanup / verification>
```

Walter ejer typisk orchestration-issuet. Backend, Frontend og Reviewer ejer konkrete sub-issues. Afhængigheder sættes med **Blocked by** frem for kun tekst i beskrivelser.

## Agent instruction sources

De konkrete agentfiler ligger under `paperclip/`:

- `paperclip/walter/` — Tech Lead / PM
- `paperclip/todd/` — Backend Engineer
- `paperclip/jesse/` — Frontend Engineer
- `paperclip/saul/` — Reviewer / QA

## Sprog

- Paperclip-agent instructions, issue commands og Task Briefs skrives på **engelsk**.
- Menneskelig dokumentation i denne mappe kan være på **dansk**.

