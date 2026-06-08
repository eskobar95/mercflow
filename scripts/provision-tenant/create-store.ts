import { spawnSync } from "child_process"
import path from "path"

import { ProvisionTenantCliError } from "./parse-args"

type CreateStoreResult = {
  readonly storeId: string
}

export function createStoreViaMedusaExec(
  repoRoot: string,
  input: {
    readonly name: string
    readonly currency: string
    readonly databaseUrl: string
  },
): CreateStoreResult {
  const backendDir = path.join(repoRoot, "apps", "backend")
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "medusa",
      "exec",
      "./src/scripts/provision-tenant-store.ts",
    ],
    {
      cwd: backendDir,
      env: {
        ...process.env,
        DATABASE_URL: input.databaseUrl,
        PROVISION_TENANT_NAME: input.name,
        PROVISION_TENANT_CURRENCY: input.currency,
      },
      encoding: "utf8",
    },
  )

  if (result.status !== 0) {
    const stderr = result.stderr?.trim() ?? ""
    const stdout = result.stdout?.trim() ?? ""
    throw new ProvisionTenantCliError(
      `medusa exec store creation failed${stderr === "" ? "" : `: ${stderr}`}${stdout === "" ? "" : ` (${stdout})`}`,
    )
  }

  const lines = (result.stdout ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{"))

  const jsonLine = lines.at(-1)
  if (jsonLine === undefined) {
    throw new ProvisionTenantCliError(
      "medusa exec did not return store JSON on stdout",
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonLine) as unknown
  } catch {
    throw new ProvisionTenantCliError("medusa exec returned invalid store JSON")
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { store_id?: unknown }).store_id !== "string"
  ) {
    throw new ProvisionTenantCliError("medusa exec store JSON missing store_id")
  }

  return { storeId: (parsed as { store_id: string }).store_id }
}
