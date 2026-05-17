---
name: design-session
description: Interactive UI/UX design session inside Cursor. Builds a live canvas wireframe first, then a token-accurate TSX mockup using MercFlow design tokens and base components. Integrates Emil Kowalski's design engineering principles and UX thinking for non-technical users. Use when designing a new page, feature, or component before implementation.
---

# Design Session

Interactive UI design process in two phases. Phase 1 is fast canvas wireframing for structure and UX decisions. Phase 2 is a pixel-accurate TSX mockup using real MercFlow tokens and components — the output the implementation agent will reference.

**Design philosophy:** MercFlow exists because Medusa's admin is built for developers. Every design decision in this session must ask: *can a non-technical shop owner do this confidently, without support?* If the answer is no, redesign.

**Load the Emil Kowalski design engineering skill** before starting: `.agents/skills/emil-design-eng/SKILL.md`. Apply its animation, interaction, and polish principles throughout Phase 2.

---

## Before starting — take reference screenshots

If the existing Medusa admin UI is relevant, capture it using the browser MCP:

```
1. Open browser MCP → navigate to the Medusa admin URL (check .env.local for VITE_BACKEND_URL)
2. Log in with admin credentials
3. Navigate to the relevant section (products, orders, etc.)
4. Take screenshot → describe what you see: what works, what's confusing, what's painful
```

This gives you a concrete "before" state to design against.

The user can also drag reference screenshots directly into the chat (Shopify, Linear, Notion, etc.) — accept and analyse them specifically.

---

## When to use

- Before any new page or significant UI component is built
- When a PRD describes UI behaviour but not visual structure
- When the user wants to explore design options interactively

---

## Phase 1 — Canvas Wireframe

### Purpose
Establish layout structure, interaction patterns, and UX flows. Nothing is hardcoded here — this is about spatial and behavioural decisions, not final styling.

### Protocol: One question at a time (Grill Me)

Ask one question, wait for the answer, then ask the next. No batching. Questions cover:

**User & context**
1. Who uses this screen? (Shop owner doing daily ops / partner doing occasional admin / developer configuring)
2. How often will they use it? (Multiple times per day / weekly / rarely)
3. What is the one thing they must be able to do confidently without reading any instructions?

**Flow & orientation**
4. What triggers them to arrive here? (Nav menu / previous action / notification)
5. What do they do when they're done? (Go back to list / go to next step / close tab)
6. What is the worst thing that could go wrong, and how will the UI prevent or recover from it?

**Layout**
7. Full-width table or constrained content width?
8. Does it need a persistent sidebar (filters, navigation) or top-bar actions only?
9. If a list: compact rows (more items visible) or relaxed rows (more breathing room)?

**Density & Actions**
10. Inline row actions or a detail panel/page on click?
11. Does it need bulk selection? If yes, what can you bulk-do?
12. Empty state: what does the user see and what is the single, obvious call-to-action?

**Reference**
13. Do you have reference screenshots to share? (Shopify admin, Linear, Notion, etc.)
    — If yes: analyse them specifically — name the exact patterns to borrow and why.
    — If no: proceed with MercFlow defaults (Shopify Admin inspired, light, spacious).

### Canvas generation rules

After collecting answers, generate a `.canvas.tsx` wireframe:

```
Path: /Users/nicklaseskou/.cursor/projects/Users-nicklaseskou-mercflow-workspace/canvases/design-<slug>.canvas.tsx
```

**Canvas represents structure, not final style:**
- Use `cursor/canvas` components only (Stack, Grid, Card, Table, Row, Button, TextInput, etc.)
- Represent real content, not placeholder text — use realistic data
- Show all states the user described: empty state, loaded state, bulk-selected state
- Mark interactive elements clearly (buttons, row actions, filters)
- Annotate layout decisions as `<Text tone="secondary">` callouts beside sections

**Canvas must not:**
- Use hardcoded hex colors
- Use gradients, shadows, or emojis
- Simulate MercFlow tokens (the canvas is structure-only)

### Iteration loop

After showing the canvas, ask:
> "What would you change? You can describe it, point to a specific element, or send a screenshot of what you have in mind."

Iterate until the user says the structure is approved. Keep the canvas updated.

---

## Phase 2 — Token-Accurate TSX Mockup

### Purpose
Translate the approved canvas structure into a real React component file using MercFlow's actual design tokens and base components — with Emil Kowalski's interaction quality applied. This is what the implementation agent will use as its visual reference.

### File location

```
packages/admin-ui/src/design-sessions/<ComponentName>.mockup.tsx
```

These files are gitignored at the folder level (add `design-sessions/` to `.gitignore` if not already there). They are temporary design artefacts, not production code.

### Component-first lookup before writing

Before writing any JSX, follow `component-first.mdc`:
1. Check `packages/admin-ui/src/components/ui/` — which base components cover this design?
2. Check `packages/admin-ui/src/components/` — do any feature components already exist?
3. List what's reused vs what needs to be built new.

### Token-accurate rules

```tsx
// ✅ Use MercFlow tokens
className="bg-surface text-content-primary rounded-md p-4 border border-border-subtle"

// ❌ Never hardcode
className="bg-[#f4f6f8] text-[#1a1a1a] rounded-[6px] p-[16px]"
```

The mockup must:
- Import and use base components from `@/components/ui/` (Button, Input, Card, Badge, etc.)
- Use MercFlow Tailwind token classes throughout
- Include realistic dummy data (not "lorem ipsum", but plausible product/order names)
- Show the primary user flow: loaded state + at least one interaction state
- Be self-contained (no API calls, no hooks — all data is inline const)

**Apply Emil Kowalski principles:**
- Buttons: `transform: scale(0.97)` on `:active`, `transition: transform 160ms ease-out`
- Dropdowns/popovers: animate from `scale(0.95) opacity-0`, use `transform-origin` from trigger
- Drawers/panels: `translateY(100%)` → `translateY(0)`, `cubic-bezier(0.32, 0.72, 0, 1)`, 300ms
- List items entering: stagger with 30-50ms delay, `translateY(8px) opacity-0` → natural state
- Tooltips: 125ms `ease-out`, skip animation after first tooltip open
- `prefers-reduced-motion`: opacity/color only, no transform-based motion
- No `transition: all` — always specify exact properties
- Duration limits: buttons 100-160ms, tooltips 125-200ms, modals 200-350ms

**UX for non-technical users:**
- Destructive actions (delete, bulk change) always require confirmation — never one-click
- Errors must explain what went wrong AND what to do next (not just "An error occurred")
- Loading states: skeleton loaders for content, spinner only for actions
- Success feedback: brief (2s) toast, no modal for confirmations
- Progressive disclosure: show advanced options in a collapsible, not upfront

### Mockup structure

```tsx
// packages/admin-ui/src/design-sessions/ProductList.mockup.tsx

// DESIGN SESSION MOCKUP — not production code
// Approved: [date]
// For: [PRD/task name]
//
// Components needed (new):
//   - ProductStatusBadge (components/product-list/)
//   - ColumnConfigPanel (components/product-list/)
// Components reused:
//   - DataTable (components/ui/)
//   - Button, Badge, Input (components/ui/)
// Tokens used:
//   - bg-surface, bg-surface-hover, text-content-primary, text-content-secondary
//   - border-border-subtle, rounded-md, p-4

const MOCK_PRODUCTS = [...]

export default function ProductListMockup() {
  return (
    // full layout using real tokens and base components
  )
}
```

### Screenshot with Playwright

After writing the mockup, take a screenshot so the user can review it without starting the dev server:

```typescript
// Requires Vite dev server running: pnpm --filter @mercflow/admin-ui dev
// Then navigate to the mockup route (add temporarily to routes)
// OR render standalone via a quick Playwright script:

import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage()
// Use the Playwright MCP browser tools to navigate and screenshot
```

If the dev server is not running, describe what you built and open the file — the user can view it directly.

---

## Phase 3 — Design Output

When the mockup is approved, produce the design output document:

### Component inventory

```markdown
## Design Session Output — [Component/Page Name]
Approved: [date]
For: [PRD name or Notion task URL]

### Reused components (no new code needed)
- DataTable — covers list view with sort + pagination
- Button (primary, secondary, ghost) — actions
- Input (search) — filter bar

### New components to build
| Component | Location | Description |
|---|---|---|
| ProductStatusBadge | components/product-list/ | Status pill: Draft/Published/Archived |
| ColumnConfigPanel | components/product-list/ | Slide-in panel for column selection |
| BulkActionsBar | components/product-list/ | Sticky bottom bar when rows selected |

### Design tokens in use
- Layout: bg-surface, bg-surface-subtle, border-border-subtle
- Text: text-content-primary, text-content-secondary, text-content-disabled
- Interactive: bg-interactive, text-on-interactive, bg-interactive-hover

### Key design decisions
- Compact row height (40px) to show 20+ products without scrolling
- Column config saved per user in localStorage
- Bulk actions bar appears from bottom on selection (no toolbar shift)
- Empty state: illustration + "Add your first product" CTA

### Mockup file
packages/admin-ui/src/design-sessions/ProductList.mockup.tsx
```

### DB schema implications

From the approved design, extract what the data model needs:

```markdown
### Data model implications
| Field shown in UI | DB column | Type | Notes |
|---|---|---|---|
| Product status badge | status | enum | draft/published/archived |
| Column config (per user) | — | localStorage | No DB needed — client-side |
| Bulk action history | — | NOT in scope for this task | Future audit log |
```

This gives the Tech Lead a head start on the DB migration plan and prevents the implementation agent from guessing schema from UI alone.

### Save to Notion

Save the design output as a sub-page of the relevant PRD in Notion:
```
PRD: [name]
  └── Design Session: [Component/Page Name] — [date]
       (paste the full design output document)
```

Set a comment on the PRD page:
```
Design session complete: [Component/Page Name]
Approved by: Nicklas
Mockup: packages/admin-ui/src/design-sessions/[Name].mockup.tsx
Ready for tech lead task breakdown.
```

---

## Session conduct

- One question at a time — never batch questions
- If the user sends a screenshot: analyse it specifically ("I can see you like the fixed table header and the inline status badge — I'll incorporate both")
- If the user says "like Shopify" or "like Linear": name the specific patterns you're borrowing and why they fit here
- Never describe what you're going to build — show it (canvas first, then mockup)
- If a design decision conflicts with MercFlow conventions (admin-ui.mdc), flag it explicitly and suggest an alternative that fits

## End condition

The session ends when:
1. The mockup is approved by the user
2. The design output document is saved to Notion
3. The user says "done" or "let's build it"

At that point, the implementation agent has everything it needs:
- Mockup file as visual reference
- Component inventory (reuse vs build new)
- Token list
- Design decisions with rationale
