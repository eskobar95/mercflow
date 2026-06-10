/**
 * Shipmondo requires an explicit service point for pickup products (e.g. GLS
 * Pakkeshop). When none is stored on the order, request automatic selection.
 */
export function shouldAutoSelectShipmondoServicePoint(
  servicePointId: string | null
): boolean {
  return servicePointId === null || servicePointId.trim() === ""
}
