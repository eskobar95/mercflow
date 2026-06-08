import fs from "fs"
import path from "path"

export class TraefikRouteConflictError extends Error {
  readonly name = "TraefikRouteConflictError"
}

export function slugifyDomainForTraefik(domain: string): string {
  return domain.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase()
}

export function buildTenantTraefikFilename(domain: string): string {
  return `tenant-${slugifyDomainForTraefik(domain)}.yml`
}

export function buildTenantTraefikYaml(domain: string): string {
  const routerName = `tenant-${slugifyDomainForTraefik(domain)}`
  return `# MercFlow tenant route (T030). Domain: ${domain}
http:
  routers:
    ${routerName}:
      rule: Host(\`${domain}\`)
      entryPoints:
        - websecure
      service: ${routerName}
      tls:
        certResolver: letsencrypt
  services:
    ${routerName}:
      loadBalancer:
        servers:
          - url: http://medusa-backend:9000
`
}

export function domainAlreadyProvisioned(dynamicDir: string, domain: string): boolean {
  if (!fs.existsSync(dynamicDir)) {
    return false
  }

  const needle = `Host(\`${domain}\`)`
  const entries = fs.readdirSync(dynamicDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".yml")) {
      continue
    }
    const content = fs.readFileSync(path.join(dynamicDir, entry.name), "utf8")
    if (content.includes(needle)) {
      return true
    }
  }
  return false
}

export function writeTenantTraefikRoute(dynamicDir: string, domain: string): string {
  if (domainAlreadyProvisioned(dynamicDir, domain)) {
    throw new TraefikRouteConflictError(
      `Traefik route for domain "${domain}" already exists in ${dynamicDir}`,
    )
  }

  fs.mkdirSync(dynamicDir, { recursive: true })
  const filename = buildTenantTraefikFilename(domain)
  const filePath = path.join(dynamicDir, filename)
  fs.writeFileSync(filePath, buildTenantTraefikYaml(domain), "utf8")
  return filePath
}
