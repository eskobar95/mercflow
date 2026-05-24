/** Public Shipmondo read-only probe endpoint (validated credentials ⇒ HTTP 200). */
export const SHIPMONDO_SHIPMENTS_URL =
  "https://app.shipmondo.com/api/public/v3/shipments?page=1&per_page=1"

export type ShipmondoHttpClientDeps = {
  fetchImpl?: typeof fetch
}

export async function probeShipmondoShipments(opts: {
  apiUser: string
  apiKey: string
  fetchImpl?: typeof fetch
}): Promise<{ ok: boolean; httpStatus: number }> {
  const fetchFn = opts.fetchImpl ?? globalThis.fetch
  const credentials = `${opts.apiUser}:${opts.apiKey}`
  const authorization = Buffer.from(credentials, "utf8").toString("base64")

  let response: Response
  try {
    response = await fetchFn(SHIPMONDO_SHIPMENTS_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authorization}`,
      },
    })
  } catch {
    return { ok: false, httpStatus: 0 }
  }

  const httpStatus = response.status
  return { ok: httpStatus >= 200 && httpStatus < 300, httpStatus }
}
