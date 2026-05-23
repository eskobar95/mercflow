import { NavLink } from "react-router-dom"

import { IconArrowUpRight, IconChevronRight, IconClose } from "@/components/ui/icons"
import {
  contentSidebarSection,
  primarySidebarNav,
  settingsSidebarSection,
  type SidebarNavItem,
  type SidebarSubItem,
} from "@/config/sidebarNav"

type MobileNavSheetProps = {
  /** Whether the sheet is rendered in its open (visible) state. */
  open: boolean
  /** Close handler — called by the X button and by row navigation. */
  onClose: () => void
}

/**
 * Mobile navigation sheet — iOS Settings grouped-cards pattern.
 *
 * Hierarchy on phones is communicated by CARD GROUPING, not by indent.
 *
 *   - Top card (no label):  Home, Orders, Customers — daily destinations.
 *   - "PRODUCTS" card:      Catalogue + Categories (sub-pages promoted to
 *                            first-class rows inside their own card; no
 *                            indented mini-rows, no "SECTION" badge, no
 *                            parent/child double-highlight).
 *   - "CONTENT" card:       Articles, Pages, Globals.
 *   - "SETTINGS" card:      General, Connectors, Workspace, Team, Billing.
 *   - Footer card:          Account row.
 *
 * Density target: every row ≤ 48px tall so the menu feels phone-native,
 * not iPad-stretched. 32px icon square, 16px monoline icon, 14px label.
 */

type SheetRowSource = {
  /** Stable identifier used for the React key. */
  key: string
  label: string
  to: string
  end?: boolean
  icon: SidebarNavItem["icon"]
}

/**
 * Split the primary nav into "leaf" rows (direct destinations) and "groups"
 * (items that own sub-pages). On mobile we render each group as its own
 * labelled card with its sub-items as first-class rows.
 */
function splitPrimaryNav(): {
  leaves: SheetRowSource[]
  groups: { label: string; rows: SheetRowSource[] }[]
} {
  const leaves: SheetRowSource[] = []
  const groups: { label: string; rows: SheetRowSource[] }[] = []

  for (const item of primarySidebarNav) {
    if (item.subItems && item.subItems.length > 0) {
      groups.push({
        label: item.label,
        rows: item.subItems.map((sub) => subItemToRow(sub, item.icon)),
      })
    } else {
      leaves.push({
        key: item.to,
        label: item.label,
        to: item.to,
        end: item.end,
        icon: item.icon,
      })
    }
  }

  return { leaves, groups }
}

function subItemToRow(
  sub: SidebarSubItem,
  fallbackIcon: SidebarNavItem["icon"]
): SheetRowSource {
  return {
    key: sub.to,
    label: sub.label,
    to: sub.to,
    end: sub.end,
    icon: sub.icon ?? fallbackIcon,
  }
}

export function MobileNavSheet({
  open,
  onClose,
}: MobileNavSheetProps): JSX.Element {
  const { leaves, groups } = splitPrimaryNav()

  // Card index drives the stagger delay so groups cascade into place when
  // the sheet opens. Counter is bumped per rendered card.
  let cardIndex = 0

  return (
    <aside
      className="flex h-full w-full flex-col bg-surface-appCanvas"
      aria-label="Main navigation"
    >
      <header className="sticky top-0 z-sticky flex h-12 shrink-0 items-center justify-between border-b border-border-default bg-surface-appCanvas/95 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber text-content-inverse"
            aria-hidden
          >
            <span className="text-[11px] font-bold leading-none">M</span>
          </span>
          <p className="truncate text-[14px] font-semibold tracking-tight text-content-primary">
            MercFlow
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-content-secondary transition-[background-color,transform] duration-150 hover:bg-surface-subtle active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          <IconClose size={16} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <SheetCard open={open} index={cardIndex++}>
          <SheetRows>
            {leaves.map((row) => (
              <SheetRow key={row.key} row={row} onNavigate={onClose} />
            ))}
          </SheetRows>
        </SheetCard>

        {groups.map((group) => (
          <SheetCard
            key={`group-${group.label}`}
            open={open}
            index={cardIndex++}
            label={group.label}
          >
            <SheetRows>
              {group.rows.map((row) => (
                <SheetRow key={row.key} row={row} onNavigate={onClose} />
              ))}
            </SheetRows>
          </SheetCard>
        ))}

        <SheetCard open={open} index={cardIndex++} label={contentSidebarSection.label}>
          <SheetRows>
            {contentSidebarSection.items.map((item) => (
              <SheetRow
                key={item.to}
                row={{
                  key: item.to,
                  label: item.label,
                  to: item.to,
                  end: item.end,
                  icon: item.icon,
                }}
                onNavigate={onClose}
              />
            ))}
          </SheetRows>
        </SheetCard>

        <SheetCard open={open} index={cardIndex++} label={settingsSidebarSection.label}>
          <SheetRows>
            {settingsSidebarSection.items.map((item) => (
              <SheetRow
                key={item.to}
                row={{
                  key: item.to,
                  label: item.label,
                  to: item.to,
                  end: item.end,
                  icon: item.icon,
                }}
                onNavigate={onClose}
              />
            ))}
          </SheetRows>
        </SheetCard>

        <FooterCard open={open} delayMs={60 + cardIndex * 40} />
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Card primitives — each owns one render responsibility                  */
/* ─────────────────────────────────────────────────────────────────────── */

function SheetCard({
  children,
  open,
  index,
  label,
}: {
  children: React.ReactNode
  open: boolean
  index: number
  label?: string
}): JSX.Element {
  const delay = 60 + index * 40
  return (
    <section
      className="mb-4 last:mb-0"
      style={{
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 260ms cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms, transform 260ms cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`,
      }}
    >
      {label ? (
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-label text-content-tertiary">
          {label}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-md border border-border-default bg-surface-appCard shadow-sm">
        {children}
      </div>
    </section>
  )
}

function SheetRows({ children }: { children: React.ReactNode }): JSX.Element {
  return <ul className="divide-y divide-border-subtle">{children}</ul>
}

const rowBase =
  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber"

function SheetRow({
  row,
  onNavigate,
}: {
  row: SheetRowSource
  onNavigate: () => void
}): JSX.Element {
  const Icon = row.icon

  return (
    <li>
      <NavLink
        to={row.to}
        end={row.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          [
            rowBase,
            isActive
              ? "bg-amber-subtle text-content-primary"
              : "text-content-primary hover:bg-surface-subtle active:bg-surface-subtle",
          ].join(" ")
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                isActive
                  ? "bg-amber text-content-inverse"
                  : "bg-surface-subtle text-content-secondary",
              ].join(" ")}
              aria-hidden
            >
              <Icon size={16} />
            </span>
            <span className="flex-1 truncate font-medium">{row.label}</span>
            <IconChevronRight
              size={14}
              className={
                isActive
                  ? "shrink-0 text-amber-text"
                  : "shrink-0 text-content-tertiary"
              }
            />
          </>
        )}
      </NavLink>
    </li>
  )
}

function FooterCard({
  open,
  delayMs,
}: {
  open: boolean
  delayMs: number
}): JSX.Element {
  return (
    <div
      className="mt-6 flex items-center justify-between rounded-md border border-border-default bg-surface-appCard px-3 py-2.5 shadow-sm"
      style={{
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(6px)",
        transition: `opacity 240ms cubic-bezier(0.23, 1, 0.32, 1) ${delayMs}ms, transform 240ms cubic-bezier(0.23, 1, 0.32, 1) ${delayMs}ms`,
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-subtle text-amber-text"
          aria-hidden
        >
          <span className="text-[12px] font-semibold">N</span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-content-primary">
            Nicklas
          </p>
          <p className="truncate text-[11px] text-content-tertiary">
            Workspace owner
          </p>
        </div>
      </div>
      <button
        type="button"
        aria-label="Account settings"
        className="flex h-8 w-8 items-center justify-center rounded-full text-content-tertiary transition-colors duration-150 hover:bg-surface-subtle hover:text-content-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
      >
        <IconArrowUpRight size={14} />
      </button>
    </div>
  )
}
