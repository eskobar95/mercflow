import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function resolveStoreCurrencyCode(scope: MedusaContainer): Promise<string> {
  const regionModule = scope.resolve(Modules.REGION)
  const regions = await regionModule.listRegions({}, { take: 1 })
  const currency = regions[0]?.currency_code
  if (typeof currency === "string" && currency.trim() !== "") {
    return currency.trim().toLowerCase()
  }
  return "dkk"
}
