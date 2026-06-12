import { type ReactNode, useRef, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"

import { IconChevronRight } from "@/components/ui/icons"
import { SETTINGS_NAV_GROUPS, type SettingsNavGroup, type SettingsNavItem } from "@/config/settingsNav"
import { cn } from "@/lib/cn"

const itemBase =
  "group/nav flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

function getActiveItemPath(pathname: string, items: SettingsNavItem[]): string | null {
  let bestMatch: string | null = null

  for (const item of items) {
    const isMatch =
      pathname === item.path || pathname.startsWith(`${item.path}/`)

    if (isMatch && (!bestMatch || item.path.length > bestMatch.length)) {
      bestMatch = item.path
    }
  }

  return bestMatch
}

function SettingsNavLink({
  item,
  activePath,
}: {
  item: SettingsNavItem
  activePath: string | null
}): ReactNode {
  const isActive = activePath === item.path
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      className={cn(
        itemBase,
        isActive
          ? "bg-surface-subtle font-medium text-content-primary"
          : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        size={16}
        className={
          isActive
            ? "shrink-0 text-content-primary"
            : "shrink-0 text-content-tertiary transition-colors group-hover/nav:text-content-secondary"
        }
      />
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}

function SettingsNavGroupSection({ group }: { group: SettingsNavGroup }): ReactNode {
  const location = useLocation()
  const activeItemPath = getActiveItemPath(location.pathname, group.items)
  const isActive = activeItemPath !== null
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

  const userExpanded = expandedOverrideRef.current
  const expanded = userExpanded ?? isActive
  const GroupIcon = group.icon

  return (
    <section aria-labelledby={`settings-group-${group.label}`}>
      <button
        type="button"
        id={`settings-group-${group.label}`}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide transition-colors",
          isActive ? "text-content-primary" : "text-content-tertiary hover:text-content-secondary",
        )}
        onClick={() => {
          expandedOverrideRef.current = !expanded
          rerenderGroup((n) => n + 1)
        }}
      >
        <GroupIcon size={14} className="shrink-0" aria-hidden />
        <span className="flex-1 truncate">{group.label}</span>
        <IconChevronRight
          size={12}
          className={cn(
            "shrink-0 transition-transform duration-150",
            expanded ? "rotate-90" : "",
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <ul className="overflow-hidden">
          {group.items.map((item) => (
            <li key={item.path} className="mt-0.5 pl-2">
              <SettingsNavLink item={item} activePath={activeItemPath} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function SettingsShellSidebar(): ReactNode {
  return (
    <nav aria-label="Settings" className="space-y-4 px-3 py-6">
      {SETTINGS_NAV_GROUPS.map((group) => (
        <SettingsNavGroupSection key={group.label} group={group} />
      ))}
    </nav>
  )
}
