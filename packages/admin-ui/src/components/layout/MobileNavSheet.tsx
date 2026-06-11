import { type ReactNode, useCallback, useMemo, useRef, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"

import { DRAWER_EASE, ENTER_EASE } from "@/constants/motion"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"
import { BrandAvatar } from "@/components/ui/BrandAvatar"
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconContent,
  IconFeed,
  IconInventory,
  IconSettings,
} from "@/components/ui/icons"
import {
  contentSidebarSection,
  feedSidebarSection,
  inventorySidebarSection,
  primarySidebarNav,
  settingsSidebarSection,
  type SidebarNavItem,
  type SidebarSubItem,
} from "@/config/sidebarNav"

type MobileNavSheetProps = {
  /** Whether the sheet is currently visible. */
  open: boolean
  /** Close handler — fires on X tap, route change, or sub-row navigation. */
  onClose: () => void
}

/**
 * Mobile navigation sheet — bento-grid + drill-down architecture.
 *
 * Replaces the long iOS-Settings row list with an app-launcher style 2-col
 * grid of tiles. Each tile is either a direct destination ("leaf") or a
 * drillable group with its own sub-tiles. When you tap a drillable tile
 * the sheet pushes a new pane showing only that group's children — iOS
 * navigation stack pattern. The header morphs to act as both label and
 * back affordance, so there's no extra back button taking up space.
 *
 * The tile model leaves room for "quick actions" (Add product, New order,
 * etc.) as additional tiles in the root grid without redesign.
 */

type TileSource = {
  key: string
  label: string
  icon: SidebarNavItem["icon"]
  /** Direct route — present on leaf tiles. */
  to?: string
  end?: boolean
  /** Sub-items — present on drillable tiles. */
  drillTo?: string
  subItems?: SidebarSubItem[]
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Build the root tile list                                               */
/* ─────────────────────────────────────────────────────────────────────── */

function flattenSettingsSubItems(items: SidebarNavItem[]): SidebarSubItem[] {
  const flattened: SidebarSubItem[] = []
  for (const item of items) {
    if (item.subItems && item.subItems.length > 0) {
      for (const sub of item.subItems) {
        flattened.push(sub)
      }
    } else {
      flattened.push({
        label: item.label,
        to: item.to,
        end: item.end,
        icon: item.icon,
      })
    }
  }
  return flattened
}

function buildRootTiles(): TileSource[] {
  const primary: TileSource[] = primarySidebarNav.map((item) => ({
    key: item.to,
    label: item.label,
    icon: item.icon,
    to: item.subItems ? undefined : item.to,
    end: item.end,
    drillTo: item.subItems ? item.to : undefined,
    subItems: item.subItems,
  }))

  return [
    ...primary,
    {
      key: "feed-group",
      label: "Feed",
      icon: IconFeed,
      drillTo: "feed",
      subItems: feedSidebarSection.items.map(
        (item): SidebarSubItem => ({
          label: item.label,
          to: item.to,
          end: item.end,
          icon: item.icon,
        })
      ),
    },
    {
      key: "inventory-group",
      label: "Inventory",
      icon: IconInventory,
      drillTo: "inventory",
      subItems: inventorySidebarSection.items.map(
        (item): SidebarSubItem => ({
          label: item.label,
          to: item.to,
          end: item.end,
          icon: item.icon,
        })
      ),
    },
    {
      key: "content-group",
      label: "Content",
      icon: IconContent,
      drillTo: "content",
      subItems: contentSidebarSection.items.map(
        (item): SidebarSubItem => ({
          label: item.label,
          to: item.to,
          end: item.end,
          icon: item.icon,
        })
      ),
    },
    {
      key: "settings-group",
      label: "Settings",
      icon: IconSettings,
      drillTo: "settings",
      subItems: flattenSettingsSubItems(settingsSidebarSection.items),
    },
  ]
}

const SHEET_EASE = DRAWER_EASE

export function MobileNavSheet({
  open,
  onClose,
}: MobileNavSheetProps): ReactNode {
  const rootTiles = useMemo(buildRootTiles, [])
  const [drillKey, setDrillKey] = useState<string | null>(null)
  const location = useLocation()
  const closeResetTimerRef = useRef<number | null>(null)

  const requestClose = useCallback((): void => {
    onClose()
    if (closeResetTimerRef.current !== null) {
      window.clearTimeout(closeResetTimerRef.current)
    }
    closeResetTimerRef.current = window.setTimeout(() => {
      setDrillKey(null)
      closeResetTimerRef.current = null
    }, 250)
  }, [onClose])

  const drillTile = useMemo(
    () => (drillKey ? rootTiles.find((t) => t.drillTo === drillKey) ?? null : null),
    [drillKey, rootTiles]
  )

  const isDrilled = drillKey !== null

  return (
    <aside
      className="flex h-full w-full flex-col bg-surface-appCanvas"
      aria-label="Main navigation"
    >
      <SheetHeader
        isDrilled={isDrilled}
        drillLabel={drillTile?.label ?? null}
        onClose={requestClose}
        onBack={() => setDrillKey(null)}
      />

      {/* Pane stack — root is the resting pane, drill slides over from the right. */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <RootPane
          open={open}
          isActive={!isDrilled}
          tiles={rootTiles}
          currentPath={location.pathname}
          onDrill={setDrillKey}
          onNavigate={requestClose}
        />
        <DrillPane
          open={open}
          isActive={isDrilled}
          tile={drillTile}
          onNavigate={requestClose}
        />
      </div>
    </aside>
  )
}

function isPathInSubItems(
  pathname: string,
  subItems: SidebarSubItem[] | undefined
): boolean {
  if (!subItems) return false
  return subItems.some((sub) =>
    sub.end
      ? pathname === sub.to
      : pathname === sub.to || pathname.startsWith(`${sub.to}/`)
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Header — morphs between workspace title and back affordance            */
/* ─────────────────────────────────────────────────────────────────────── */

function SheetHeader({
  isDrilled,
  drillLabel,
  onClose,
  onBack,
}: {
  isDrilled: boolean
  drillLabel: string | null
  onClose: () => void
  onBack: () => void
}): ReactNode {
  return (
    <header className="sticky top-0 z-sticky flex h-14 shrink-0 items-center gap-3 border-b border-border-app bg-surface-appCard px-3 backdrop-blur-sm">
      {/*
        Avatar always lives at the far left, matching its position in the
        topbar so the sheet feels like it slid out from beneath the avatar
        rather than from a different anchor. Tapping it closes the sheet —
        same affordance, opposite action, no extra visual chrome.
      */}
      <BrandAvatar
        size={36}
        interactive
        active
        onClick={onClose}
        ariaLabel="Close menu"
        ariaControls="mobile-nav-sheet"
        ariaExpanded
      />

      <div className="relative flex h-full min-w-0 flex-1 items-center">
        {/* Root header label */}
        <p
          aria-hidden={isDrilled}
          className="absolute left-0 truncate text-interface font-semibold tracking-tight text-content-primary"
          style={{
            top: "50%",
            opacity: isDrilled ? 0 : 1,
            transform: isDrilled
              ? "translate(-8px, -50%)"
              : "translate(0, -50%)",
            transition: `opacity 200ms ${ENTER_EASE}, transform 240ms ${ENTER_EASE}`,
          }}
        >
          MercFlow
        </p>

        {/* Drill header — compact back-pill, NOT a full-height block.
            Pill is h-9 (36px) centered in the 56px header so the hover
            background reads as a contained tap target rather than a
            sectioned region. */}
        <button
          type="button"
          onClick={onBack}
          tabIndex={isDrilled ? 0 : -1}
          className="absolute left-0 inline-flex h-9 items-center gap-1 rounded-full pl-1.5 pr-3 text-interface font-semibold tracking-tight text-content-primary transition-colors duration-150 hover:bg-surface-subtle active:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{
            top: "50%",
            opacity: isDrilled ? 1 : 0,
            transform: isDrilled
              ? "translate(0, -50%)"
              : "translate(8px, -50%)",
            transition: `opacity 200ms ${ENTER_EASE} 60ms, transform 240ms ${ENTER_EASE} 60ms, background-color 150ms ${ENTER_EASE}`,
            pointerEvents: isDrilled ? "auto" : "none",
          }}
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center text-content-secondary"
            aria-hidden
          >
            <IconChevronLeft size={16} />
          </span>
          <span className="truncate">{drillLabel ?? "Back"}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-content-secondary transition-[background-color,transform] duration-150 hover:bg-surface-subtle active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        style={{ transitionTimingFunction: ENTER_EASE }}
      >
        <IconClose size={18} />
      </button>
    </header>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Root pane — full grid of tiles                                         */
/* ─────────────────────────────────────────────────────────────────────── */

function RootPane({
  open,
  isActive,
  tiles,
  currentPath,
  onDrill,
  onNavigate,
}: {
  open: boolean
  isActive: boolean
  tiles: TileSource[]
  currentPath: string
  onDrill: (key: string) => void
  onNavigate: () => void
}): ReactNode {
  return (
    <div
      aria-hidden={!isActive}
      className="absolute inset-0 overflow-y-auto px-4 pb-8 pt-4"
      style={{
        // Parallax: when drilled, root slides slightly left + dims to give depth.
        transform: isActive ? "translateX(0)" : "translateX(-20%)",
        opacity: isActive ? 1 : 0.4,
        transition: `transform 320ms ${SHEET_EASE}, opacity 280ms ${SHEET_EASE}`,
        pointerEvents: isActive ? "auto" : "none",
      }}
    >
      <TileGrid>
        {tiles.map((tile, i) => (
          <Tile
            key={tile.key}
            tile={tile}
            inSection={isPathInSubItems(currentPath, tile.subItems)}
            open={open && isActive}
            staggerIndex={i}
            onDrill={onDrill}
            onNavigate={onNavigate}
          />
        ))}
      </TileGrid>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Drill pane — sub-items as tiles                                        */
/* ─────────────────────────────────────────────────────────────────────── */

function DrillPane({
  open,
  isActive,
  tile,
  onNavigate,
}: {
  open: boolean
  isActive: boolean
  tile: TileSource | null
  onNavigate: () => void
}): ReactNode {
  // Keep the last-known tile in memo so the exit animation plays with the
  // right content even after `tile` becomes null on close.
  const lastTileRef = useRef<TileSource | null>(tile)

  useAdjustStateWhenKeyChanges(tile?.key ?? null, () => {
    if (tile) {
      lastTileRef.current = tile
    }
  })

  const renderTile = tile ?? lastTileRef.current
  const subItems = renderTile?.subItems ?? []

  return (
    <div
      aria-hidden={!isActive}
      className="absolute inset-0 overflow-y-auto px-4 pb-8 pt-4"
      style={{
        transform: isActive ? "translateX(0)" : "translateX(100%)",
        transition: `transform ${isActive ? "320ms" : "280ms"} ${SHEET_EASE}`,
        pointerEvents: isActive ? "auto" : "none",
      }}
    >
      <TileGrid>
        {subItems.map((sub, i) => (
          <SubTile
            key={sub.to}
            sub={sub}
            fallbackIcon={renderTile?.icon}
            open={open && isActive}
            staggerIndex={i}
            onNavigate={onNavigate}
          />
        ))}
      </TileGrid>

      {renderTile ? (
        <p
          className="mt-5 px-1 text-xs text-content-tertiary"
          style={{
            opacity: isActive && open ? 1 : 0,
            transform: isActive && open ? "translateY(0)" : "translateY(4px)",
            transition: `opacity 240ms ${ENTER_EASE} ${
              60 + subItems.length * 40
            }ms, transform 240ms ${ENTER_EASE} ${60 + subItems.length * 40}ms`,
          }}
        >
          {subItems.length} {subItems.length === 1 ? "destination" : "destinations"} in {renderTile.label.toLowerCase()}
        </p>
      ) : null}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Grid + Tile primitives                                                 */
/* ─────────────────────────────────────────────────────────────────────── */

function TileGrid({ children }: { children: React.ReactNode }): ReactNode {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

const tileBase =
  "group/tile relative flex h-[136px] flex-col justify-between rounded-2xl border border-border-default bg-surface-appCard p-3.5 text-left shadow-sm transition-[background-color,border-color,transform,box-shadow] duration-150 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

/**
 * Tile — either navigates (NavLink) or drills (button). The visual is
 * identical so the user perceives one consistent UI primitive.
 */
function Tile({
  tile,
  inSection,
  open,
  staggerIndex,
  onDrill,
  onNavigate,
}: {
  tile: TileSource
  /** True when the current route lives inside this tile's sub-items. */
  inSection: boolean
  open: boolean
  staggerIndex: number
  onDrill: (key: string) => void
  onNavigate: () => void
}): ReactNode {
  const Icon = tile.icon
  const isDrillable = Boolean(tile.drillTo && tile.subItems)
  const subCount = tile.subItems?.length ?? 0

  const enterStyle = {
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 320ms ${ENTER_EASE} ${
      40 + staggerIndex * 35
    }ms, transform 320ms ${ENTER_EASE} ${
      40 + staggerIndex * 35
    }ms, background-color 150ms ${ENTER_EASE}, border-color 150ms ${ENTER_EASE}, box-shadow 150ms ${ENTER_EASE}, transform 150ms ${ENTER_EASE}`,
    transitionTimingFunction: ENTER_EASE,
  } as const

  if (isDrillable) {
    // When the current route lives in this section, give the tile a subtle
    // amber outline + a dot on its icon chip. Less aggressive than the full
    // "current" leaf treatment, but a clear hint of where you are.
    return (
      <button
        type="button"
        onClick={() => onDrill(tile.drillTo!)}
        className={[
          tileBase,
          inSection
            ? "border-accent shadow-sm hover:shadow-md"
            : "hover:border-border-strong hover:shadow-md",
        ].join(" ")}
        style={enterStyle}
      >
        <TileTop Icon={Icon} active={false} showSectionDot={inSection} />
        <TileBottom
          label={tile.label}
          meta={
            inSection
              ? "You are here"
              : `${subCount} ${subCount === 1 ? "item" : "items"}`
          }
          active={inSection}
          drill
        />
      </button>
    )
  }

  return (
    <NavLink
      to={tile.to!}
      end={tile.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          tileBase,
          isActive
            ? "border-accent bg-accent-subtle text-content-primary"
            : "hover:border-border-strong hover:shadow-md",
        ].join(" ")
      }
      style={enterStyle}
    >
      {({ isActive }) => (
        <>
          <TileTop Icon={Icon} active={isActive} />
          <TileBottom
            label={tile.label}
            meta={isActive ? "Current" : undefined}
            active={isActive}
          />
        </>
      )}
    </NavLink>
  )
}

function SubTile({
  sub,
  fallbackIcon,
  open,
  staggerIndex,
  onNavigate,
}: {
  sub: SidebarSubItem
  fallbackIcon: SidebarNavItem["icon"] | undefined
  open: boolean
  staggerIndex: number
  onNavigate: () => void
}): ReactNode {
  const Icon = sub.icon ?? fallbackIcon
  if (!Icon) {
    // Defensive — sub-items always carry an icon in our config, but the
    // type allows undefined and we want the tile to render gracefully.
    return <span className="hidden" />
  }

  const enterStyle = {
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 280ms ${ENTER_EASE} ${
      40 + staggerIndex * 35
    }ms, transform 280ms ${ENTER_EASE} ${
      40 + staggerIndex * 35
    }ms, background-color 150ms ${ENTER_EASE}, border-color 150ms ${ENTER_EASE}, box-shadow 150ms ${ENTER_EASE}, transform 150ms ${ENTER_EASE}`,
  } as const

  return (
    <NavLink
      to={sub.to}
      end={sub.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          tileBase,
          isActive
            ? "border-accent bg-accent-subtle text-content-primary"
            : "hover:border-border-strong hover:shadow-md",
        ].join(" ")
      }
      style={enterStyle}
    >
      {({ isActive }) => (
        <>
          <TileTop Icon={Icon} active={isActive} />
          <TileBottom
            label={sub.label}
            meta={isActive ? "Current" : undefined}
            active={isActive}
          />
        </>
      )}
    </NavLink>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Tile inner pieces                                                      */
/* ─────────────────────────────────────────────────────────────────────── */

function TileTop({
  Icon,
  active,
  showSectionDot = false,
}: {
  Icon: SidebarNavItem["icon"]
  active: boolean
  /** Render an amber dot on the icon chip indicating the current route lives in this section. */
  showSectionDot?: boolean
}): ReactNode {
  return (
    <div className="flex items-start justify-between">
      <span
        className={[
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
          active
            ? "bg-accent text-content-inverse"
            : "bg-surface-subtle text-content-secondary group-hover/tile:bg-accent-subtle group-hover/tile:text-accent-text",
        ].join(" ")}
        aria-hidden
      >
        <Icon size={20} />
        {showSectionDot ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-accent ring-2 ring-surface-appCard"
            aria-hidden
          />
        ) : null}
      </span>
    </div>
  )
}

function TileBottom({
  label,
  meta,
  active,
  drill = false,
}: {
  label: string
  meta?: string
  active: boolean
  drill?: boolean
}): ReactNode {
  return (
    <div className="flex items-end justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-interface font-semibold tracking-tight text-content-primary">
          {label}
        </p>
        {meta ? (
          <p
            className={[
              "mt-0.5 truncate text-2xs font-medium",
              active ? "text-accent-text" : "text-content-tertiary",
            ].join(" ")}
          >
            {meta}
          </p>
        ) : null}
      </div>
      {drill ? (
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-content-secondary transition-[background-color,transform] duration-150 group-hover/tile:bg-accent group-hover/tile:text-content-inverse group-hover/tile:translate-x-0.5"
          aria-hidden
        >
          <IconChevronRight size={12} />
        </span>
      ) : null}
    </div>
  )
}
