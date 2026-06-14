import type Medusa from "@medusajs/js-sdk"
import { FetchError } from "@medusajs/js-sdk"
import type {
  AdminCreateFlatRateShippingOption,
  AdminShippingOption,
  AdminShippingProfile,
  AdminUpdateShippingOption,
} from "@medusajs/types"

export type ShippingProfileFormInput = { name: string; type: string }
export type ShippingRateFormInput = { name: string; amountMajor: string; shippingProfileId: string }
export type ShippingSetupContext = {
  serviceZoneId: string
  providerId: string
  regionId: string
  currencyCode: string
}

const SHIPPING_OPTION_FIELDS =
  "id,name,price_type,provider_id,*provider,*type,shipping_profile_id,*shipping_profile,*prices,*rules"

export function toShippingSettingsError(error: unknown): Error {
  if (error instanceof FetchError && error.message.trim() !== "") return new Error(error.message)
  if (error instanceof Error) return error
  return new Error("Unexpected error while contacting Medusa Admin.")
}

export async function listShippingProfiles(sdk: Medusa): Promise<AdminShippingProfile[]> {
  return (await sdk.admin.shippingProfile.list({ limit: 100 })).shipping_profiles ?? []
}

export async function createShippingProfile(sdk: Medusa, input: ShippingProfileFormInput): Promise<AdminShippingProfile> {
  return (await sdk.admin.shippingProfile.create({ name: input.name.trim(), type: input.type.trim() })).shipping_profile
}

export async function updateShippingProfile(
  sdk: Medusa,
  id: string,
  input: ShippingProfileFormInput,
): Promise<AdminShippingProfile> {
  return (await sdk.admin.shippingProfile.update(id, { name: input.name.trim(), type: input.type.trim() })).shipping_profile
}

export async function deleteShippingProfile(sdk: Medusa, id: string): Promise<void> {
  await sdk.admin.shippingProfile.delete(id)
}

export async function listShippingOptionsForProfile(sdk: Medusa, shippingProfileId: string): Promise<AdminShippingOption[]> {
  return (
    await sdk.admin.shippingOption.list({
      limit: 100,
      shipping_profile_id: shippingProfileId,
      fields: SHIPPING_OPTION_FIELDS,
    })
  ).shipping_options ?? []
}

export async function fetchShippingSetupContext(sdk: Medusa): Promise<ShippingSetupContext> {
  const [locationsResponse, providersResponse, regionsResponse] = await Promise.all([
    sdk.admin.stockLocation.list({ limit: 20, fields: "id,*fulfillment_sets,*fulfillment_sets.service_zones" }),
    sdk.admin.fulfillmentProvider.list({ limit: 20 }),
    sdk.admin.region.list({ limit: 20 }),
  ])
  const serviceZoneId = resolveFirstServiceZoneId(locationsResponse.stock_locations ?? [])
  const providerId = resolvePreferredProviderId(providersResponse.fulfillment_providers ?? [])
  const region = regionsResponse.regions?.[0]
  if (!serviceZoneId) {
    throw new FetchError(
      "No fulfillment service zone found. Add a stock location with a service zone in Medusa before creating shipping rates.",
      "Bad Request",
      400,
    )
  }
  if (!providerId) {
    throw new FetchError(
      "No fulfillment provider found. Enable a fulfillment provider in Medusa before creating shipping rates.",
      "Bad Request",
      400,
    )
  }
  if (!region?.id) {
    throw new FetchError(
      "No region found. Create a sales region in Medusa before creating shipping rates.",
      "Bad Request",
      400,
    )
  }
  return {
    serviceZoneId,
    providerId,
    regionId: region.id,
    currencyCode: region.currency_code?.trim().toLowerCase() || "usd",
  }
}

function resolveFirstServiceZoneId(
  locations: Array<{ fulfillment_sets?: Array<{ service_zones?: Array<{ id?: string }> }> | null }>,
): string | null {
  for (const location of locations) {
    for (const set of location.fulfillment_sets ?? []) {
      for (const zone of set.service_zones ?? []) {
        if (zone.id?.trim()) return zone.id
      }
    }
  }
  return null
}

function resolvePreferredProviderId(providers: Array<{ id?: string }>): string | null {
  const manual = providers.find((p) => (p.id?.toLowerCase() ?? "").includes("manual"))
  return manual?.id || providers[0]?.id || null
}

function parseAmountMinor(amountMajor: string): number | null {
  const parsed = Number.parseFloat(amountMajor.trim().replace(",", "."))
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

export async function createFlatShippingRate(
  sdk: Medusa,
  input: ShippingRateFormInput,
  setup: ShippingSetupContext,
): Promise<AdminShippingOption> {
  const amountMinor = parseAmountMinor(input.amountMajor)
  if (amountMinor === null) throw new FetchError("Enter a valid flat rate amount.", "Bad Request", 400)
  const payload: AdminCreateFlatRateShippingOption = {
    name: input.name.trim(),
    price_type: "flat",
    service_zone_id: setup.serviceZoneId,
    shipping_profile_id: input.shippingProfileId,
    provider_id: setup.providerId,
    prices: [{ region_id: setup.regionId, amount: amountMinor }],
  }
  return (await sdk.admin.shippingOption.create(payload, { fields: SHIPPING_OPTION_FIELDS })).shipping_option
}

export async function updateFlatShippingRate(
  sdk: Medusa,
  id: string,
  input: Pick<ShippingRateFormInput, "name" | "amountMajor">,
  setup: ShippingSetupContext,
): Promise<AdminShippingOption> {
  const body: AdminUpdateShippingOption = { name: input.name.trim() }
  const amountMinor = parseAmountMinor(input.amountMajor)
  if (amountMinor !== null) body.prices = [{ region_id: setup.regionId, amount: amountMinor }]
  return (await sdk.admin.shippingOption.update(id, body, { fields: SHIPPING_OPTION_FIELDS })).shipping_option
}

export async function deleteShippingRate(sdk: Medusa, id: string): Promise<void> {
  await sdk.admin.shippingOption.delete(id)
}
