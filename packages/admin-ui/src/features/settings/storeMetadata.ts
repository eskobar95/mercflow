export type StoreAddress = {
  street: string
  city: string
  postalCode: string
  country: string
}

export type StoreGeneralMetadata = {
  contactEmail: string
  timezone: string
  address: StoreAddress
}

export const DEFAULT_STORE_ADDRESS: StoreAddress = {
  street: "",
  city: "",
  postalCode: "",
  country: "dk",
}

export const DEFAULT_STORE_GENERAL_METADATA: StoreGeneralMetadata = {
  contactEmail: "",
  timezone: "Europe/Copenhagen",
  address: DEFAULT_STORE_ADDRESS,
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function readAddressRecord(value: unknown): StoreAddress {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return DEFAULT_STORE_ADDRESS
  }

  const record = value as Record<string, unknown>
  return {
    street: readString(record.street),
    city: readString(record.city),
    postalCode: readString(record.postal_code),
    country: readString(record.country) || DEFAULT_STORE_ADDRESS.country,
  }
}

export function readStoreGeneralMetadata(
  metadata: Record<string, unknown> | null | undefined,
): StoreGeneralMetadata {
  if (metadata === null || metadata === undefined) {
    return DEFAULT_STORE_GENERAL_METADATA
  }

  return {
    contactEmail: readString(metadata.contact_email),
    timezone: readString(metadata.timezone) || DEFAULT_STORE_GENERAL_METADATA.timezone,
    address: readAddressRecord(metadata.address),
  }
}

export function writeStoreGeneralMetadata(
  existingMetadata: Record<string, unknown> | null | undefined,
  values: StoreGeneralMetadata,
): Record<string, unknown> {
  const base = existingMetadata ?? {}
  return {
    ...base,
    contact_email: values.contactEmail.trim(),
    timezone: values.timezone,
    address: {
      street: values.address.street.trim(),
      city: values.address.city.trim(),
      postal_code: values.address.postalCode.trim(),
      country: values.address.country,
    },
  }
}
