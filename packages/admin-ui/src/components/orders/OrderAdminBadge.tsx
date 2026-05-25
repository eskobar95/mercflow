/**
 * Neutral status chip for order payment / fulfillment labels (token-backed).
 */
export function OrderAdminBadge(props: {
  /** Raw Medusa snake_case enum is fine — we soften display. */
  value: string
  "aria-label"?: string
}): JSX.Element {
  const display = props.value.trim() === "" ? "—" : props.value.replaceAll("_", " ")
  const label = props["aria-label"] ?? display

  return (
    <span
      aria-label={label}
      className="inline-flex max-w-[12rem] items-center rounded-md border border-border-subtle bg-surface-subtle px-2 py-0.5 text-xs font-medium capitalize text-content-secondary"
    >
      <span className="truncate">{display}</span>
    </span>
  )
}
