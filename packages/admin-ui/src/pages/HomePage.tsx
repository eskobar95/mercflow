import { Link } from "react-router-dom"

import {
  IconArrowRight,
  IconArrowUpRight,
  IconArticles,
  IconCustomers,
  IconOrders,
  IconProducts,
} from "@/components/ui/icons"

type StatTile = {
  label: string
  value: string
  delta: { kind: "up" | "down" | "flat"; copy: string }
  hint: string
}

const STAT_TILES: StatTile[] = [
  {
    label: "Sessions today",
    value: "—",
    delta: { kind: "flat", copy: "Awaiting first data" },
    hint: "Live storefront traffic",
  },
  {
    label: "Orders today",
    value: "0",
    delta: { kind: "flat", copy: "0 vs yesterday" },
    hint: "Across all channels",
  },
  {
    label: "Sales today",
    value: "€0.00",
    delta: { kind: "flat", copy: "0% vs last week" },
    hint: "Gross, before refunds",
  },
  {
    label: "Conversion",
    value: "—",
    delta: { kind: "flat", copy: "Awaiting first session" },
    hint: "Sessions → completed orders",
  },
]

type QuickAction = {
  title: string
  body: string
  to: string
  icon: typeof IconProducts
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Add a product",
    body: "Create a new SKU with variants and content.",
    to: "/products/new",
    icon: IconProducts,
  },
  {
    title: "View recent orders",
    body: "Inspect fulfilment, refunds, and shipments.",
    to: "/orders",
    icon: IconOrders,
  },
  {
    title: "Customers",
    body: "Open the customer index for support and segments.",
    to: "/customers",
    icon: IconCustomers,
  },
  {
    title: "Write an article",
    body: "Editorial content for category and storefront pages.",
    to: "/content/articles",
    icon: IconArticles,
  },
]

type SetupStep = {
  label: string
  done: boolean
}

const SETUP_STEPS: SetupStep[] = [
  { label: "Design tokens · Brand Kit v1", done: true },
  { label: "Admin shell · sidebar, top bar, page routing", done: true },
  { label: "Product list and detail · real data wired", done: false },
  { label: "Orders and customers · pulled from Medusa", done: false },
  { label: "Content module · articles, pages, globals", done: false },
]

function DeltaPill({ delta }: { delta: StatTile["delta"] }): JSX.Element {
  const tone =
    delta.kind === "up"
      ? "text-feedback-success-content bg-feedback-success-subtle"
      : delta.kind === "down"
        ? "text-feedback-danger-content bg-feedback-danger-subtle"
        : "text-content-tertiary bg-surface-canvas"
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium ${tone}`}
    >
      {delta.copy}
    </span>
  )
}

/**
 * Operational home — Shopify-inspired dashboard scaffold.
 *
 * Layout:
 *   1. Welcome + time-stamped header bar (no editorial preamble).
 *   2. KPI tile row — 4 stat cards (sessions, orders, sales, conversion).
 *   3. Two-column lower half: Quick actions (catalogue/orders shortcuts)
 *      + Setup checklist (transparency about what's wired).
 *
 * All values are zero/empty placeholders until the backend connectors land;
 * the surface intentionally signals "ready to receive data" rather than
 * pretending to render fake numbers.
 */
export function HomePage(): JSX.Element {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-label text-content-tertiary">
            Today · {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date())}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-content-primary md:text-[28px]">
            Good to see you, MercFlow
          </h2>
        </div>
        <Link
          to="/products/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-interactive-primary px-4 text-xs font-semibold text-content-inverse shadow-sm transition-colors hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
        >
          Add product
          <IconArrowRight size={14} />
        </Link>
      </header>

      <section className="mt-6">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_TILES.map((tile) => (
            <li
              key={tile.label}
              className="rounded-lg border border-border-app bg-surface-appCard p-4 shadow-sm"
            >
              <p className="text-2xs font-semibold uppercase tracking-label text-content-tertiary">
                {tile.label}
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-content-primary">
                {tile.value}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <DeltaPill delta={tile.delta} />
                <span className="truncate text-2xs text-content-tertiary">{tile.hint}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-lg border border-border-app bg-surface-appCard shadow-sm">
            <div className="flex items-center justify-between border-b border-border-app px-5 py-4">
              <h3 className="text-sm font-semibold text-content-primary">Quick actions</h3>
              <Link
                to="/products"
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-text hover:text-amber-strong"
              >
                Open catalogue
                <IconArrowUpRight size={12} />
              </Link>
            </div>
            <ul className="divide-y divide-border-app">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <li key={action.to}>
                    <Link
                      to={action.to}
                      className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-appCanvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-subtle text-amber-text">
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-content-primary">
                          {action.title}
                        </p>
                        <p className="truncate text-xs text-content-secondary">
                          {action.body}
                        </p>
                      </div>
                      <IconArrowRight
                        size={16}
                        className="shrink-0 text-content-tertiary transition-colors group-hover:text-content-primary"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="h-full rounded-lg border border-border-app bg-surface-appCard p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-content-primary">
                Setup progress
              </h3>
              <span className="rounded-full bg-amber-subtle px-2 py-0.5 text-2xs font-semibold text-amber-text">
                {SETUP_STEPS.filter((s) => s.done).length} / {SETUP_STEPS.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-content-secondary">
              Tracking the MercFlow shell rollout. New slices land per sprint.
            </p>
            <ul className="mt-4 space-y-2.5">
              {SETUP_STEPS.map((step) => (
                <li key={step.label} className="flex items-start gap-2.5">
                  <span
                    className={
                      step.done
                        ? "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-feedback-success-subtle text-feedback-success-content"
                        : "mt-0.5 h-4 w-4 shrink-0 rounded-full border border-border-default bg-surface-appCanvas"
                    }
                    aria-hidden
                  >
                    {step.done ? (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12.5 10 17l9-10" />
                      </svg>
                    ) : null}
                  </span>
                  <p
                    className={
                      step.done
                        ? "text-sm text-content-secondary line-through decoration-content-tertiary"
                        : "text-sm font-medium text-content-primary"
                    }
                  >
                    {step.label}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
