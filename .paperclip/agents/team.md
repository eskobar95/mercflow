# MercFlow Paperclip team

Dette er den anbefalede Paperclip-agentstruktur for MercFlow.


| Role              | Name   | Paperclip title              | Reports to | Purpose                                                                   |
| ----------------- | ------ | ---------------------------- | ---------- | ------------------------------------------------------------------------- |
| Technical Lead    | Walter | PM / Tech Lead               | CEO        | Orchestrates batches, sets sequencing, validates API contracts and scope. |
| Backend Engineer  | Todd   | Engineer / Backend Engineer  | Walter     | Executes backend tasks exactly as assigned; owns data-to-API boundary.    |
| Frontend Engineer | Jesse  | Engineer / Frontend Engineer | Walter     | Builds admin UI from documented API contracts and design-token patterns.  |
| Reviewer          | Saul   | QA / Reviewer                | Walter     | Finds issues before merge/go-live; read-only review and verification.     |


## Recommended Paperclip setup

### Walter

- Role dropdown: `PM`
- Title: `Tech Lead`
- Reports to: `CEO`
- Assignee type: orchestration / planning
- Instructions source: `paperclip/walter/*`

### Todd

- Role dropdown: `Engineer`
- Title: `Backend Engineer`
- Reports to: `Walter`
- Assignee type: backend implementation
- Instructions source: `paperclip/todd/*`

### Jesse

- Role dropdown: `Engineer`
- Title: `Frontend Engineer`
- Reports to: `Walter`
- Assignee type: frontend implementation
- Instructions source: `paperclip/jesse/*`

### Saul

- Role dropdown: `QA`
- Title: `Reviewer`
- Reports to: `Walter`
- Assignee type: review / verification
- Instructions source: `paperclip/saul/*`

## Operational rules

- Walter owns the parent batch orchestration issue.
- Todd/Jesse/Saul own sub-issues.
- Use `Blocked by` for dependencies.
- Use Reviewer for technical review and Approver for scope/process sign-off.
- Use English in all agent-facing instructions, issue comments, Task Briefs, and handoffs.