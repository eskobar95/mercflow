import { Link } from "react-router-dom"

import {
  IconArrowRight,
  IconArrowUpRight,
  IconCatalogue,
  IconCategories,
  IconProducts,
} from "@/components/ui/icons"

type ShortcutTile = {
  emphasis: "loud" | "calm"
  title: string
  hint: string
  to: string
  icon: typeof IconProducts
}

/**
 * What the user can actually reach today — only routes that ship real
 * (or realistic mock) views, not placeholders. Avoids the "Quick actions"
 * trap of seeding broken links into placeholder pages.
 *
 * `emphasis: "loud"` is the one tile we want operators to click first when
 * they have nothing better to do; everything else is calm.
 */
const SHORTCUTS: ShortcutTile[] = [
  {
    emphasis: "loud",
    title: "Open catalogue",
    hint: "Products and variants",
    to: "/products",
    icon: IconCatalogue,
  },
  {
    emphasis: "calm",
    title: "Add a product",
    hint: "Start with the essentials",
    to: "/products/new",
    icon: IconProducts,
  },
  {
    emphasis: "calm",
    title: "Manage categories",
    hint: "Organise the storefront",
    to: "/product-categories",
    icon: IconCategories,
  },
]

type ShippingItem = {
  status: "shipped" | "next"
  label: string
}

const SHIPPING_LOG: ShippingItem[] = [
  { status: "shipped", label: "Catalogue list, detail, and edit" },
  { status: "shipped", label: "Product categories" },
  { status: "shipped", label: "Multi-locale content editing" },
  { status: "next", label: "Orders" },
  { status: "next", label: "Customers" },
  { status: "next", label: "Articles, pages, and globals" },
]

/**
 * Home — the workspace landing.
 *
 * Past iterations tried to look like a Stripe/Mercury dashboard with KPI
 * tiles and a time-of-day greeting. With no live data flowing through
 * Medusa yet, those tiles were polite lies ("0 orders vs yesterday") and
 * the greeting was AI-mock-dashboard cliché. This version replaces both
 * with an honest workspace surface:
 *
 *   1. A single "store not connected" banner — the truth, with the
 *      action that resolves it.
 *   2. A row of shortcuts to the routes that actually work today, with
 *      one of them sized larger as the primary "where most operators
 *      need to go first" tile.
 *   3. A small shipping log so the visitor knows what's live and what's
 *      next — without ever showing internal sprint progress.
 *
 * The whole page is information you couldn't reach otherwise from this
 * screen. Nothing decorative. Nothing fake.
 */
export function HomePage(): JSX.Element {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      {/* ── Workspace status banner ─────────────────────────────── */}
      <section
        aria-labelledby="workspace-status"
        className="relative overflow-hidden rounded-2xl border border-border-default bg-surface-appCard p-5 shadow-sm md:p-7"
      >
        {/* Subtle corner-accent — a single chromatic move, not a wash */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/8"
          style={{ filter: "blur(40px)" }}
        />

        <div className="relative flex flex-col gap-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-content-tertiary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Store not connected
          </span>

          <h2
            id="workspace-status"
            className="max-w-[20ch] text-2xl font-semibold leading-[1.1] tracking-tight text-content-primary md:text-4xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Your workspace is ready. Bring a store on board.
          </h2>

          <div className="flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-base leading-relaxed text-content-secondary">
              Connect Medusa and the catalogue, orders, customers, and revenue
              you see below will start flowing through this admin in real time.
            </p>

            <Link
              to="/settings/connectors"
              className="group/cta inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-content-primary px-4 text-sm font-semibold text-content-inverse shadow-sm transition-[background-color,transform,box-shadow] duration-150 hover:shadow-md active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              style={{
                transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            >
              Connect a store
              <IconArrowRight
                size={14}
                className="transition-transform duration-200 group-hover/cta:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Shortcuts — only to routes that actually work ───────── */}
      <section aria-labelledby="shortcuts-heading" className="mt-6">
        <div className="flex items-end justify-between">
          <h3
            id="shortcuts-heading"
            className="text-sm font-semibold uppercase tracking-label text-content-tertiary"
          >
            Open today
          </h3>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {SHORTCUTS.map((tile) => (
            <Shortcut key={tile.to} tile={tile} />
          ))}
        </div>
      </section>

      {/* ── Shipping log — honest, no internal sprint detail ─────── */}
      <section aria-labelledby="shipping-heading" className="mt-7">
        <div className="rounded-2xl border border-border-default bg-surface-appCard">
          <header className="flex items-center justify-between border-b border-border-default px-5 py-3.5">
            <h3
              id="shipping-heading"
              className="text-sm font-semibold text-content-primary"
            >
              MercFlow is shipping in slices
            </h3>
            <span className="hidden text-xs text-content-tertiary md:inline">
              {SHIPPING_LOG.filter((s) => s.status === "shipped").length} live
              · {SHIPPING_LOG.filter((s) => s.status === "next").length} next
            </span>
          </header>

          <ul className="divide-y divide-border-default md:grid md:grid-cols-2 md:gap-x-px md:divide-y-0 md:bg-border-default">
            {SHIPPING_LOG.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 bg-surface-appCard px-5 py-3"
              >
                <StatusGlyph status={item.status} />
                <p
                  className={[
                    "text-sm",
                    item.status === "shipped"
                      ? "text-content-secondary"
                      : "text-content-tertiary",
                  ].join(" ")}
                >
                  {item.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function Shortcut({ tile }: { tile: ShortcutTile }): JSX.Element {
  const Icon = tile.icon
  const loud = tile.emphasis === "loud"

  return (
    <Link
      to={tile.to}
      className="group/tile relative flex h-full flex-col gap-5 rounded-2xl border border-border-default bg-surface-appCard p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      <span
        className={[
          "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover/tile:scale-[1.05]",
          loud
            ? "bg-accent text-content-inverse shadow-sm"
            : "bg-surface-subtle text-content-secondary group-hover/tile:bg-accent-subtle group-hover/tile:text-accent-text",
        ].join(" ")}
        aria-hidden
      >
        <Icon size={20} />
      </span>

      <div className="flex flex-1 flex-col justify-end">
        <p className="text-interface font-semibold tracking-tight text-content-primary">
          {tile.title}
        </p>
        <p className="mt-1 text-sm text-content-tertiary">{tile.hint}</p>
        {loud ? (
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-text">
            Go
            <IconArrowUpRight
              size={12}
              className="transition-transform duration-200 group-hover/tile:-translate-y-px group-hover/tile:translate-x-px"
            />
          </span>
        ) : null}
      </div>
    </Link>
  )
}

function StatusGlyph({ status }: { status: ShippingItem["status"] }): JSX.Element {
  if (status === "shipped") {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-feedback-success text-white"
        aria-label="Shipped"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12.5 10 17l9-10" />
        </svg>
      </span>
    )
  }
  return (
    <span
      className="h-5 w-5 shrink-0 rounded-full border border-dashed border-border-strong"
      aria-label="Coming next"
    />
  )
}
