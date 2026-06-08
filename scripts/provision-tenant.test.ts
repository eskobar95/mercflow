import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it } from "vitest"

import {
  buildTenantTraefikFilename,
  buildTenantTraefikYaml,
  domainAlreadyProvisioned,
  slugifyDomainForTraefik,
  TraefikRouteConflictError,
  writeTenantTraefikRoute,
} from "./provision-tenant/traefik-routes"
import { loadEnvFile } from "./provision-tenant/load-dotenv"
import { generateTenantAdminPassword } from "./provision-tenant/password"
import { parseProvisionTenantArgs, ProvisionTenantCliError } from "./provision-tenant/parse-args"

describe("parseProvisionTenantArgs", () => {
  it("parses required flags", () => {
    const args = parseProvisionTenantArgs([
      "--name",
      "Salon Maria",
      "--domain",
      "shop.salon-maria.dk",
      "--email",
      "maria@salon-maria.dk",
      "--currency",
      "dkk",
    ])

    expect(args).toEqual({
      name: "Salon Maria",
      domain: "shop.salon-maria.dk",
      email: "maria@salon-maria.dk",
      currency: "dkk",
    })
  })

  it("rejects duplicate domains at traefik layer", () => {
    expect(() =>
      parseProvisionTenantArgs([
        "--name",
        "A",
        "--domain",
        "not a domain",
        "--email",
        "a@b.co",
      ]),
    ).toThrow(ProvisionTenantCliError)
  })
})

describe("traefik tenant routes", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
    tempDirs.length = 0
  })

  it("slugifies domains for router names", () => {
    expect(slugifyDomainForTraefik("shop.Salon-Maria.dk")).toBe("shop-salon-maria-dk")
    expect(buildTenantTraefikFilename("shop.salon-maria.dk")).toBe(
      "tenant-shop-salon-maria-dk.yml",
    )
  })

  it("writes a tenant route file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mercflow-traefik-"))
    tempDirs.push(dir)

    const filePath = writeTenantTraefikRoute(
      dir,
      "shop.example.com",
      "https://api.mercflow.shop",
    )
    expect(fs.existsSync(filePath)).toBe(true)
    const yaml = buildTenantTraefikYaml(
      "shop.example.com",
      "https://api.mercflow.shop",
    )
    expect(yaml).toContain("Host(`shop.example.com`)")
    expect(yaml).toContain("api.mercflow.shop/app")
    expect(yaml).toContain("PathPrefix(`/app`)")
    expect(domainAlreadyProvisioned(dir, "shop.example.com")).toBe(true)
  })

  it("throws on duplicate domain", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mercflow-traefik-dup-"))
    tempDirs.push(dir)
    writeTenantTraefikRoute(dir, "shop.example.com", "https://api.mercflow.shop")

    expect(() =>
      writeTenantTraefikRoute(dir, "shop.example.com", "https://api.mercflow.shop"),
    ).toThrow(
      TraefikRouteConflictError,
    )
  })
})

describe("loadEnvFile", () => {
  it("loads variables without overriding existing env", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mercflow-dotenv-"))
    const envPath = path.join(dir, ".env")
    fs.writeFileSync(
      envPath,
      "MEDUSA_BACKEND_URL=https://api.example.com\nPROVISION_TENANT_TEST_URL=loaded-from-file\n",
      "utf8",
    )

    const previousBackend = process.env.MEDUSA_BACKEND_URL
    const previousTestUrl = process.env.PROVISION_TENANT_TEST_URL
    process.env.MEDUSA_BACKEND_URL = "https://already-set.test"
    delete process.env.PROVISION_TENANT_TEST_URL

    loadEnvFile(envPath)

    expect(process.env.MEDUSA_BACKEND_URL).toBe("https://already-set.test")
    expect(process.env.PROVISION_TENANT_TEST_URL).toBe("loaded-from-file")

    if (previousBackend === undefined) {
      delete process.env.MEDUSA_BACKEND_URL
    } else {
      process.env.MEDUSA_BACKEND_URL = previousBackend
    }
    if (previousTestUrl === undefined) {
      delete process.env.PROVISION_TENANT_TEST_URL
    } else {
      process.env.PROVISION_TENANT_TEST_URL = previousTestUrl
    }
    fs.rmSync(dir, { recursive: true, force: true })
  })
})

describe("generateTenantAdminPassword", () => {
  it("returns a 16-character password", () => {
    const password = generateTenantAdminPassword()
    expect(password).toHaveLength(16)
  })
})
