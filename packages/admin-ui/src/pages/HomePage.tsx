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
  { label: "Design tokens · Brand Kit v2", done: true },
  { label: "Admin shell · sidebar, top bar, page routing", done: true },
  { label: "Product list and detail · real data wired", done: false },
  { label: "Orders and customers · pulled from Medusa", done: false },
  { label: "Content module · articles, pages, globals", done: false },
]

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return "Good evening"
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function DeltaText({ delta }: { delta: StatTile["delta"] }): JSX.Element {
  const color =
    delta.kind === "up"
      ? "text-feedback-success-content"
      : delta.kind === "down"
        ? "text-feedback-danger-content"
        : "text-content-tertiary"
  return <span className={`text-[12px] font-medium ${color}`}>{delta.copy}</span>
}

/**
 * Home dashboard — Mercury bento + Asana greeting + Stripe restraint.
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  Good afternoon, Nicklas · 23 May 2026     [ Create + ] │
 *   ├─────────────────────────────────────────────────────────┤
 *   │  [ Sessions ] [ Orders ] [ Sales ] [ Conversion ]       │
 *   ├──────────────────────────────────┬──────────────────────┤
 *   │  Quick actions                   │  Setup progress      │
 *   │   - Add product                  │  2 / 5  • • • ○ ○    │
 *   │   - View orders                  │                      │
 *   │   - Customers                    │                      │
 *   │   - Write article                │                      │
 *   └──────────────────────────────────┴──────────────────────┘
 */
export function HomePage(): JSX.Element {
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date())

  const done = SETUP_STEPS.filter((s) => s.done).length

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      {/* ── Greeting header ──────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-content-tertiary">{today}</p>
          <h2 className="mt-1 text-[26px] font-semibold tracking-tight text-content-primary md:text-[28px]">
            {greeting()}, Nicklas
          </h2>
        </div>
        <Link
          to="/products/new"
          className="group/cta inline-flex h-9 items-center gap-1.5 rounded-full bg-amber px-4 text-[13px] font-semibold text-content-inverse shadow-sm transition-all duration-150 hover:bg-amber-strong active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          Add product
          <IconArrowRight
            size={14}
            className="transition-transform duration-200 group-hover/cta:translate-x-0.5"
          />
        </Link>
      </header>

      {/* ── KPI tiles — Mercury bento ────────────────────────────── */}
      <section className="mt-5">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STAT_TILES.map((tile, i) => (
            <li
              key={tile.label}
              className="rounded-md border border-border-default bg-surface-appCard p-4 shadow-sm transition-all duration-200 hover:border-border-strong hover:shadow-md"
              style={{
                transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                animation: `mercflow-stat-in 400ms cubic-bezier(0.23, 1, 0.32, 1) ${i * 60}ms both`,
              }}
            >
              <p className="text-xs font-medium text-content-secondary">
                {tile.label}
              </p>
              <p className="mt-2 font-mono text-[22px] font-semibold leading-none tracking-tight text-content-primary">
                {tile.value}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <DeltaText delta={tile.delta} />
                <span className="hidden truncate text-right text-[11px] text-content-tertiary sm:block">
                  {tile.hint}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Quick actions + setup progress ───────────────────────── */}
      <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-md border border-border-default bg-surface-appCard shadow-sm">
            <div className="flex items-center justify-between border-b border-border-default px-5 py-3.5">
              <h3 className="text-sm font-semibold text-content-primary">
                Quick actions
              </h3>
              <Link
                to="/products"
                className="group/link inline-flex items-center gap-1 text-[12px] font-medium text-amber-text transition-colors hover:text-amber-strong"
              >
                Open catalogue
                <IconArrowUpRight
                  size={12}
                  className="transition-transform duration-200 group-hover/link:-translate-y-px group-hover/link:translate-x-px"
                />
              </Link>
            </div>
            <ul className="divide-y divide-border-default">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <li key={action.to}>
                    <Link
                      to={action.to}
                      className="group/row flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-subtle text-amber-text transition-transform duration-200 group-hover/row:scale-[1.04]">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-content-primary">
                          {action.title}
                        </p>
                        <p className="truncate text-[12px] text-content-tertiary">
                          {action.body}
                        </p>
                      </div>
                      <IconArrowRight
                        size={14}
                        className="shrink-0 text-content-disabled transition-all duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-content-secondary"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="h-full rounded-md border border-border-default bg-surface-appCard p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-content-primary">
                Setup progress
              </h3>
              <span className="rounded-full bg-amber-subtle px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-text">
                {done}/{SETUP_STEPS.length}
              </span>
            </div>

            {/* Progress bar — visual signal alongside the count */}
            <div
              className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-subtle"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={SETUP_STEPS.length}
            >
              <div
                className="h-full rounded-full bg-amber transition-all"
                style={{
                  width: `${(done / SETUP_STEPS.length) * 100}%`,
                  transitionDuration: "600ms",
                  transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              />
            </div>

            <p className="mt-3 text-[12px] text-content-tertiary">
              Tracking the MercFlow shell rollout. New slices land per sprint.
            </p>

            <ul className="mt-4 space-y-2.5">
              {SETUP_STEPS.map((step) => (
                <li key={step.label} className="flex items-start gap-2.5">
                  {step.done ? (
                    <span
                      className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-feedback-success-default text-white"
                      aria-hidden
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12.5 10 17l9-10" />
                      </svg>
                    </span>
                  ) : (
                    <span
                      className="mt-px h-4 w-4 shrink-0 rounded-full border-[1.5px] border-border-strong bg-surface-appCard"
                      aria-hidden
                    />
                  )}
                  <p
                    className={
                      step.done
                        ? "text-[13px] text-content-tertiary line-through"
                        : "text-[13px] text-content-primary"
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
