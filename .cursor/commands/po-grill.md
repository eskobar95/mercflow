# /po-grill

**Usage:** `/po-grill` or `/po-grill <feature idea or Notion URL>`

Start a Grill Me-style product discovery interview about a feature idea.

## What it does
The agent interviews you relentlessly — one question at a time — about the feature until it has enough shared understanding to write a professional PRD. For each question, it provides its recommended answer so you can simply say "yes" or refine it.

When all decision branches are resolved, it writes a complete PRD to Notion and links it to the Feature Requests database if a Notion URL was provided.

## Instructions
Read and follow `.cursor/skills/po-orchestrator/SKILL.md`, then execute **Role 1: PO Grill**.

If a Notion Feature Request URL was provided, fetch that page first and use its content as the starting context before beginning the interview.

Input: $input

Start the interview now with the first question.
