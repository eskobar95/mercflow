import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import type { SettingsLandingSection } from "@/config/settingsSections"
import { IconArrowUpRight } from "@/components/ui/icons"

type SettingsSectionCardProps = {
  section: SettingsLandingSection
}

/**
 * Clickable card on the settings landing page — icon, title, description, link.
 */
export function SettingsSectionCard({ section }: SettingsSectionCardProps): ReactNode {
  const Icon = section.icon

  return (
    <Link
      to={section.to}
      className="group/card flex h-full flex-col rounded-2xl border border-border-default bg-surface-appCard p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-150 hover:border-border-strong hover:shadow-md active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:active:scale-100"
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-subtle text-content-secondary transition-colors duration-150 group-hover/card:text-content-primary">
        <Icon size={20} />
      </span>

      <span className="mt-4 flex items-start justify-between gap-2">
        <span className="text-base font-semibold text-content-primary">{section.title}</span>
        <IconArrowUpRight
          size={14}
          className="mt-0.5 shrink-0 text-content-tertiary opacity-0 transition-[opacity,transform] duration-150 group-hover/card:translate-x-0.5 group-hover/card:translate-y-[-1px] group-hover/card:opacity-100"
        />
      </span>

      <span className="mt-1.5 text-sm leading-relaxed text-content-secondary">
        {section.description}
      </span>
    </Link>
  )
}
