import { NavLink } from "react-router-dom"

import {
  IconArrowUpRight,
  IconChevronRight,
  IconClose,
} from "@/components/ui/icons"
import {
  contentSidebarSection,
  primarySidebarNav,
  settingsSidebarSection,
  type SidebarNavItem,
  type SidebarNavSection,
  type SidebarSubItem,
} from "@/config/sidebarNav"

type MobileNavSheetProps = {
  /** Whether the sheet is rendered in its open (visible) state. */
  open: boolean
  /** Close handler — called by the X button and by sub-row navigation. */
  onClose: () => void
}

/**
 * Mobile navigation sheet — iOS-Settings-inspired grouped cards.
 *
 *   Pattern source: iOS Settings + Notion mobile menu. Each section is its
 *   own rounded white card with internal hairline dividers between rows.
 *   Familiar to anyone with an iPhone — zero learning curve for non-tech
 *   operators.
 *
 * Why not a vertical dark sidebar like the desktop rail?
 *   - Dark wall-of-nav on a small screen feels heavy.
 *   - Grouped cards visually segment the IA without the user having to
 *     parse uppercase section labels on a uniform dark surface.
 *   - Each row gets a 36px tinted icon square — instantly tappable,
 *     dramatically higher contrast than 18px monoline icons on dark.
 *
 * Motion is owned by the parent (`AdminShell`) so the sheet itself stays
 * pure markup. Parent handles slide-from-left + backdrop fade.
 */
export function MobileNavSheet({
  open,
  onClose,
}: MobileNavSheetProps): JSX.Element {
  return (
    <aside
      className="flex h-full w-full flex-col bg-surface-appCanvas"
      aria-label="Main navigation"
    >
      {/* Header — title + close. Sticky so it survives long scrolls. */}
      <header className="sticky top-0 z-sticky flex h-14 shrink-0 items-center justify-between border-b border-border-default bg-surface-appCanvas/95 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber text-content-inverse shadow-sm"
            aria-hidden
          >
            <span className="text-[13px] font-bold leading-none">M</span>
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-content-primary">
              Menu
            </p>
            <p className="truncate text-[11px] font-medium text-content-tertiary">
              MercFlow workspace
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-9 w-9 items-center justify-center rounded-full text-content-secondary transition-[background-color,transform] duration-150 hover:bg-surface-subtle active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          <IconClose size={18} />
        </button>
      </header>

      {/* Body — scrollable. Sections stagger in when sheet opens. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-5">
        <SheetCard open={open} index={0}>
          <SheetRows>
            {primarySidebarNav.map((item) => (
              <SheetRowGroup key={item.to} item={item} onNavigate={onClose} />
            ))}
          </SheetRows>
        </SheetCard>

        <SectionCard
          open={open}
          index={1}
          section={contentSidebarSection}
          onNavigate={onClose}
        />
        <SectionCard
          open={open}
          index={2}
          section={settingsSidebarSection}
          onNavigate={onClose}
        />

        {/* Footer row — sign-out / workspace switcher placeholder. */}
        <div
          className="mt-6 flex items-center justify-between rounded-md border border-border-default bg-surface-appCard px-4 py-3 shadow-sm"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(6px)",
            transition:
              "opacity 240ms cubic-bezier(0.23, 1, 0.32, 1) 180ms, transform 240ms cubic-bezier(0.23, 1, 0.32, 1) 180ms",
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-subtle text-amber-text"
              aria-hidden
            >
              <span className="text-[13px] font-semibold">N</span>
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
            aria-label="Workspace settings"
            className="flex h-8 w-8 items-center justify-center rounded-full text-content-tertiary transition-colors duration-150 hover:bg-surface-subtle hover:text-content-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            <IconArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Card primitives — extracted so each is responsible for one thing       */
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
  return (
    <section
      className="mb-5"
      style={{
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 280ms cubic-bezier(0.23, 1, 0.32, 1) ${
          60 + index * 40
        }ms, transform 280ms cubic-bezier(0.23, 1, 0.32, 1) ${
          60 + index * 40
        }ms`,
      }}
    >
      {label ? (
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-label text-content-tertiary">
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

function SectionCard({
  open,
  index,
  section,
  onNavigate,
}: {
  open: boolean
  index: number
  section: SidebarNavSection
  onNavigate: () => void
}): JSX.Element {
  return (
    <SheetCard open={open} index={index} label={section.label}>
      <SheetRows>
        {section.items.map((item) => (
          <SheetRow key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </SheetRows>
    </SheetCard>
  )
}

/**
 * A row that may also contain nested sub-items. If the item has subItems,
 * we render a non-link "header row" (kept visually identical to a leaf) and
 * then the sub-items as indented rows below it. No collapsing on mobile —
 * the sheet has plenty of vertical space and discoverability beats compactness.
 */
function SheetRowGroup({
  item,
  onNavigate,
}: {
  item: SidebarNavItem
  onNavigate: () => void
}): JSX.Element {
  if (!item.subItems || item.subItems.length === 0) {
    return <SheetRow item={item} onNavigate={onNavigate} />
  }

  return (
    <>
      <SheetRow item={item} onNavigate={onNavigate} isParent />
      {item.subItems.map((sub) => (
        <SheetSubRow
          key={sub.to}
          sub={sub}
          fallbackIcon={item.icon}
          onNavigate={onNavigate}
        />
      ))}
    </>
  )
}

const rowBase =
  "flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber"

function SheetRow({
  item,
  onNavigate,
  isParent = false,
}: {
  item: SidebarNavItem
  onNavigate: () => void
  isParent?: boolean
}): JSX.Element {
  const Icon = item.icon

  // Parent rows for an expandable group navigate to the group's root
  // (e.g. /products), but we hide the chevron-right since the sub-items
  // below already invite navigation. This avoids two affordances stacked.
  const targetHref = isParent && item.subItems ? item.subItems[0]?.to ?? item.to : item.to
  const targetEnd = isParent && item.subItems ? item.subItems[0]?.end : item.end

  return (
    <li>
      <NavLink
        to={targetHref}
        end={targetEnd}
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
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                isActive
                  ? "bg-amber text-content-inverse"
                  : "bg-surface-subtle text-content-secondary",
              ].join(" ")}
              aria-hidden
            >
              <Icon size={18} />
            </span>
            <span className="flex-1 truncate font-medium">{item.label}</span>
            {!isParent ? (
              <IconChevronRight
                size={14}
                className="shrink-0 text-content-tertiary"
              />
            ) : (
              <span className="text-[11px] font-medium uppercase tracking-label text-content-tertiary">
                Section
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  )
}

function SheetSubRow({
  sub,
  fallbackIcon,
  onNavigate,
}: {
  sub: SidebarSubItem
  fallbackIcon: SidebarNavItem["icon"]
  onNavigate: () => void
}): JSX.Element {
  const Icon = sub.icon ?? fallbackIcon

  return (
    <li>
      <NavLink
        to={sub.to}
        end={sub.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          [
            "flex w-full items-center gap-3 py-2.5 pl-[60px] pr-4 text-left text-[13.5px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber",
            isActive
              ? "bg-amber-subtle text-content-primary"
              : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary",
          ].join(" ")
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              size={16}
              className={
                isActive ? "shrink-0 text-amber-text" : "shrink-0 text-content-tertiary"
              }
            />
            <span className="flex-1 truncate font-medium">{sub.label}</span>
            <IconChevronRight
              size={14}
              className="shrink-0 text-content-tertiary"
            />
          </>
        )}
      </NavLink>
    </li>
  )
}
