import { cn } from "@/lib/cn"

/** Shared transition class fragments backed by design-token motion utilities. */
export const transitionEnter =
  "duration-page ease-enter motion-reduce:transition-none"

export const transitionOpacityEnter = cn(
  transitionEnter,
  "transition-opacity",
)

export const transitionGridReveal = cn(
  transitionEnter,
  "transition-[grid-template-rows]",
)

export const transitionShadowEnter = cn(
  transitionEnter,
  "transition-shadow",
)
