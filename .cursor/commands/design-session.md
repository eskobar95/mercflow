# /design-session

**Usage:** `/design-session <page-or-component-name>`

**Purpose:** Interactive UI/UX design session before implementation. Produces a canvas wireframe for structure exploration, then a token-accurate TSX mockup using real MercFlow components and design tokens.

## Instructions

Read and follow `.cursor/skills/design-session/SKILL.md` exactly.

## Session flow

1. **Phase 1 — Canvas wireframe**
   Ask Grill Me questions (one at a time) about layout, density, actions, and references.
   Build a canvas wireframe. Iterate until structure is approved.

2. **Phase 2 — TSX mockup**
   Translate approved structure to `packages/admin-ui/src/design-sessions/<Name>.mockup.tsx`
   Using real MercFlow tokens + base components. No API calls, no hooks, realistic dummy data.

3. **Phase 3 — Design output**
   Produce component inventory (reuse vs new), token list, design decisions.
   Save to Notion as sub-page under the relevant PRD.

## What the user can do during the session

- Describe changes verbally: "I want the filters on the left"
- Send reference screenshots (drag into chat)
- Say "like Shopify" or "like Linear" — the agent will name the specific patterns
- Iterate on canvas as many times as needed before moving to Phase 2

## What the output gives the implementation agent

- Visual reference: the approved `.mockup.tsx` file
- Component inventory: exactly what to build vs what already exists
- Token reference: which Tailwind token classes to use
- Design rationale: decisions that must be respected during implementation

Target: $input
