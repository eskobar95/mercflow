import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type ProvisionStoreResult = {
  store_id: string
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export default async function provisionTenantStore({
  container,
}: ExecArgs): Promise<void> {
  const name = readRequiredEnv("PROVISION_TENANT_NAME")
  const currency = (process.env.PROVISION_TENANT_CURRENCY ?? "dkk").toLowerCase()

  const storeModule = container.resolve(Modules.STORE)
  const store = await storeModule.createStores({
    name,
    supported_currencies: [
      {
        currency_code: currency,
        is_default: true,
      },
    ],
  })

  const result: ProvisionStoreResult = {
    store_id: store.id,
  }

  process.stdout.write(`${JSON.stringify(result)}\n`)
}
