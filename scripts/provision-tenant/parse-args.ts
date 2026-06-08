import type { ProvisionTenantArgs } from "./types"

const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class ProvisionTenantCliError extends Error {
  readonly name = "ProvisionTenantCliError"
}

export function printProvisionTenantUsage(): void {
  process.stdout.write(`Usage:
  pnpm provision-tenant --name "Salon Maria" --domain shop.example.com --email admin@example.com [--currency dkk]

Environment (operator workstation):
  MEDUSA_BACKEND_URL          Medusa origin (e.g. https://api.mercflow.shop)
  MEDUSA_ADMIN_API_TOKEN      Secret admin API token (Authorization: Basic)
  DATABASE_URL                Neon URL — required to create a new Medusa store (medusa exec)
  TRAEFIK_DYNAMIC_DIR         Optional; default infra/traefik/dynamic/tenants

Notes:
  - Medusa v2.14 has no POST /admin/stores; store creation uses medusa exec against DATABASE_URL.
  - Sales channel, publishable API key, and admin user use the Admin API.
  - Traefik writes one YAML file per tenant; sync repo to VPS and Traefik reloads automatically.
`)
}

function readFlagValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag)
  if (index === -1) {
    return null
  }
  const value = argv[index + 1]
  if (typeof value !== "string" || value.trim() === "" || value.startsWith("--")) {
    throw new ProvisionTenantCliError(`Missing value for ${flag}`)
  }
  return value.trim()
}

export function parseProvisionTenantArgs(argv: string[]): ProvisionTenantArgs {
  if (argv.includes("--help") || argv.includes("-h")) {
    printProvisionTenantUsage()
    process.exit(0)
  }

  const name = readFlagValue(argv, "--name")
  const domain = readFlagValue(argv, "--domain")
  const email = readFlagValue(argv, "--email")
  const currencyRaw = readFlagValue(argv, "--currency") ?? "dkk"

  if (name === null || domain === null || email === null) {
    throw new ProvisionTenantCliError("--name, --domain, and --email are required")
  }

  const domainNormalized = domain.toLowerCase()
  if (!DOMAIN_PATTERN.test(domainNormalized)) {
    throw new ProvisionTenantCliError(`Invalid domain: ${domain}`)
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new ProvisionTenantCliError(`Invalid email: ${email}`)
  }

  const currency = currencyRaw.toLowerCase()
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new ProvisionTenantCliError(`Invalid currency code: ${currencyRaw}`)
  }

  return {
    name,
    domain: domainNormalized,
    email,
    currency,
  }
}
