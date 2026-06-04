export function computeAvailable(stocked: number, reserved: number): number {
  return stocked - reserved
}

export function computeIncomingForLine(
  orderedQty: number,
  receivedTotal: number
): number {
  return Math.max(0, orderedQty - receivedTotal)
}

export function isLowStock(available: number, threshold: number): boolean {
  return available < threshold
}
