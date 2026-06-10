import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { ShipmondoCreateLabelResultDto } from "@/features/connectors/shipmondoTypes"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseCreateLabelEnvelope(json: unknown): ShipmondoCreateLabelResultDto {
  if (!isRecord(json) || !isRecord(json.data)) {
    throw new TypeError("Invalid Shipmondo label response")
  }

  const data = json.data
  const shipmentId = data.shipmentId
  if (typeof shipmentId !== "string" && typeof shipmentId !== "number") {
    throw new TypeError("Missing Shipmondo shipment id")
  }

  const productCode = typeof data.productCode === "string" ? data.productCode : ""
  const reference = typeof data.reference === "string" ? data.reference : ""
  const trackingUrl =
    typeof data.trackingUrl === "string" && data.trackingUrl.trim() !== ""
      ? data.trackingUrl
      : null
  const labelPdfBase64 =
    typeof data.labelPdfBase64 === "string" && data.labelPdfBase64.trim() !== ""
      ? data.labelPdfBase64
      : null

  return {
    shipmentId,
    trackingUrl,
    labelPdfBase64,
    productCode,
    reference,
  }
}

export async function postShipmondoShipmentLabel(input: {
  fulfillmentId: string
  packagingTypeId: string | null
}): Promise<ShipmondoCreateLabelResultDto> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (for example http://localhost:9000)."
    )
  }

  const response = await fetch(`${base}/admin/connectors/shipmondo/shipments`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({
      fulfillment_id: input.fulfillmentId,
      packaging_type_id: input.packagingTypeId,
    }),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  return parseCreateLabelEnvelope(json)
}

export function downloadShipmondoLabelPdf(base64: string, reference: string): void {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  const blob = new Blob([bytes], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${reference.replace(/\s+/g, "-").toLowerCase() || "shipmondo-label"}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}
