# /po-synthesize

**Usage:** `/po-synthesize <notion-feature-request-url>`

Run Phase 2 of the PO Orchestrator on a completed Q&A Feature Request.

## What it does
1. Reads all Q&A answers from the Feature Request page
2. Evaluates the feature against MercFlow scope criteria (4 dimensions, scored 1–5)
3. If promoted (avg ≥ 3.0): creates Roadmap Project + PRD draft, links everything
4. If declined: writes decline reasoning with specific conditions for reconsideration
5. Updates Status to "Promoted" or "Declined"

## Instructions
Read and follow `.cursor/skills/po-orchestrator/SKILL.md`, then execute **Phase 2: Synthesis** on the provided Notion URL.

The feature request URL is: $input
