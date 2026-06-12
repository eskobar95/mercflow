import { type ReactNode, useRef, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"

import { IconChevronRight } from "@/components/ui/icons"
import {
  SETTINGS_NAV_GROUPS,
  type SettingsNavGroup,
  type SettingsNavItem,
} from "@/config/settingsNav"

const groupHeaderBase =
  "group/settings-nav flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary transition-colors hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

const itemBase =
  "group/settings-item flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

function itemClass({ isActive }: { isActive: boolean }): string {
  if (isActive) {
    return `${itemBase} bg-surface-subtle text-content-primary ring-1 ring-inset ring-border-default`
  }
  return `${itemBase} text-content-secondary hover:bg-surface-subtle hover:text-content-primary`
}

function isItemActive(pathname: string, item: SettingsNavItem): boolean {
  if (item.end) {
    return pathname === item.path
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`)
}

function isGroupActive(pathname: string, group: SettingsNavGroup): boolean {
  return group.items.some((item) => isItemActive(pathname, item))
}

function SettingsNavGroupSection({ group }: { group: SettingsNavGroup }): ReactNode {
  const location = useLocation()
  const isActive = isGroupActive(location.pathname, group)
  const expandedOverrideRef = useRef<boolean | undefined>(undefined)
  const prevIsActiveRef = useRef(isActive)
  const [, rerenderGroup] = useState(0)

  if (isActive !== prevIsActiveRef.current) {
    if (isActive && !prevIsActiveRef.current) {
      expandedOverrideRef.current = undefined
      rerenderGroup((n) => n + 1)
    }
    prevIsActiveRef.current = isActive
  }

  const open = expandedOverrideRef.current ?? isActive
  const GroupIcon = group.icon

  return (
    <section aria-label={group.label} className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          expandedOverrideRef.current = !(expandedOverrideRef.current ?? isActive)
          rerenderGroup((n) => n + 1)
        }}
        className={groupHeaderBase}
      >
        <GroupIcon size={14} className="shrink-0 text-content-tertiary" />
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <IconChevronRight
          size={12}
          className={[
            "shrink-0 text-content-tertiary transition-transform duration-200",
            open ? "rotate-90" : "rotate-0",
          ].join(" ")}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-200"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        aria-hidden={!open}
      >
        <ul className="min-h-0 overflow-hidden pl-1 pt-0.5">
          {group.items.map((item) => {
            const ItemIcon = item.icon
            return (
              <li key={item.path}>
                <NavLink to={item.path} end={item.end} className={itemClass}>
                  {({ isActive: linkActive }) => (
                    <>
                      <ItemIcon
                        size={16}
                        className={
                          linkActive
                            ? "shrink-0 text-content-primary"
                            : "shrink-0 text-content-tertiary transition-colors group-hover/settings-item:text-content-secondary"
                        }
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/** Secondary settings sidebar — grouped sub-navigation for all `/settings/*` routes. */
export function SettingsShellSidebar(): ReactNode {
  return (
    <nav
      aria-label="Settings"
      className="flex w-full shrink-0 flex-col gap-4 border-b border-border-subtle bg-surface-appCard px-3 py-4 md:w-56 md:border-b-0 md:border-r md:py-6"
    >
      {SETTINGS_NAV_GROUPS.map((group) => (
        <SettingsNavGroupSection key={group.label} group={group} />
      ))}
    </nav>
  )
}
