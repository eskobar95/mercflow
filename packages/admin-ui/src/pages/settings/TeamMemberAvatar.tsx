import type { ReactNode } from "react"

type TeamMemberAvatarProps = {
  name: string
  imageUrl: string | null
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return "?"
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function TeamMemberAvatar({ name, imageUrl }: TeamMemberAvatarProps): ReactNode {
  if (imageUrl !== null && imageUrl.trim() !== "") {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-8 w-8 rounded-full object-cover ring-1 ring-inset ring-border-default"
      />
    )
  }

  return (
    <span
      aria-hidden
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle text-xs font-semibold text-content-secondary ring-1 ring-inset ring-border-default"
    >
      {deriveInitials(name)}
    </span>
  )
}
