import path from "path"
import { fileURLToPath } from "url"

import { loadProvisionTenantEnv } from "./provision-tenant/env"
import {
  formatProvisionTenantOutput,
  provisionTenant,
} from "./provision-tenant/provision"
import {
  parseProvisionTenantArgs,
  ProvisionTenantCliError,
  printProvisionTenantUsage,
} from "./provision-tenant/parse-args"
import { TraefikRouteConflictError } from "./provision-tenant/traefik-routes"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

async function main(): Promise<void> {
  try {
    const args = parseProvisionTenantArgs(process.argv.slice(2))
    const env = loadProvisionTenantEnv(repoRoot)
    const output = await provisionTenant(repoRoot, args, env)
    process.stdout.write(`${formatProvisionTenantOutput(output, args.email)}\n`)
  } catch (error) {
    if (error instanceof ProvisionTenantCliError) {
      process.stderr.write(`${error.message}\n`)
      printProvisionTenantUsage()
      process.exit(1)
    }
    if (error instanceof TraefikRouteConflictError) {
      process.stderr.write(`${error.message}\n`)
      process.exit(1)
    }
    throw error
  }
}

void main()
