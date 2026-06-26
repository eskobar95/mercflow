# Design system notes (optional)

> Copy to `.factory/context/DESIGN-SYSTEM.md` when UI consistency matters for agent-built interfaces.
> Enforce via lint rules (e.g. no inline styles) + component library — not prompt memory.

---

## Principles

- [e.g. One primary CTA per page]
- [e.g. No inline styles — use design tokens / Tailwind classes from theme]
- [e.g. Reuse shadcn components before creating new ones]

---

## Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `[color]` | Main actions |
| Secondary | `[color]` | Secondary actions |
| Radius | `[value]` | Cards, buttons |

---

## Components

| Component | Path | When to use |
|-----------|------|-------------|
| Button | `src/components/ui/button.tsx` | All clickable actions |
| [Component] | `[path]` | [usage] |

### Previews

Link Storybook / component gallery URL or note where agents can read component source.

---

## Agent rules

- Check this file before adding new UI patterns
- Extend existing components; do not duplicate button/card variants
- UI-heavy tasks may use browser iteration — see harness UI focus in `docs/INSPIRATION.md`
