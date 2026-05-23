import { forwardRef } from "react"

type BrandAvatarProps = {
  /** Diameter in px. Defaults to 32 (the topbar/sheet-header size). */
  size?: number
  /** Render as a clickable button. When true, requires `onClick` + `aria-label`. */
  interactive?: boolean
  /** Visual indicator state — bumps the ring when the menu it controls is open. */
  active?: boolean
  /** Click handler — only meaningful when `interactive`. */
  onClick?: () => void
  /** Accessible label — required when interactive. */
  ariaLabel?: string
  /** `aria-controls` of the menu it toggles. */
  ariaControls?: string
  /** `aria-expanded` — used when this is a menu trigger. */
  ariaExpanded?: boolean
  className?: string
}

/**
 * BrandAvatar — circular "M" monogram on amber, used as the workspace
 * identity slot. Appears in three places, always the same visual:
 *
 *   1. Desktop sidebar header (informational, non-interactive).
 *   2. Mobile topbar, top-left (interactive — toggles the nav sheet).
 *   3. Mobile sheet header, top-left (interactive — closes the sheet).
 *
 * When `active` is true the ring deepens, so the user has a clear hint that
 * the sheet it controls is currently open.
 */
export const BrandAvatar = forwardRef<HTMLButtonElement, BrandAvatarProps>(
  function BrandAvatar(
    {
      size = 32,
      interactive = false,
      active = false,
      onClick,
      ariaLabel,
      ariaControls,
      ariaExpanded,
      className,
    },
    ref
  ): JSX.Element {
    const fontSize = Math.round(size * 0.45)

    const visualClass = [
      "relative inline-flex shrink-0 items-center justify-center rounded-full bg-accent text-content-inverse",
      "shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.18),0_1px_2px_rgba(15,23,42,0.12)]",
      interactive
        ? "transition-[transform,box-shadow] duration-150 hover:shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.18),0_2px_4px_rgba(15,23,42,0.18)] active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        : "",
      active
        ? "ring-2 ring-accent/40 ring-offset-2 ring-offset-surface-appCard"
        : "",
      className ?? "",
    ].join(" ")

    const inner = (
      <span
        className="select-none font-semibold leading-none tracking-tight"
        style={{ fontSize: `${fontSize}px` }}
      >
        M
      </span>
    )

    if (interactive) {
      return (
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          aria-label={ariaLabel}
          aria-controls={ariaControls}
          aria-expanded={ariaExpanded}
          className={visualClass}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          {inner}
        </button>
      )
    }

    return (
      <span
        aria-hidden
        className={visualClass}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {inner}
      </span>
    )
  }
)
