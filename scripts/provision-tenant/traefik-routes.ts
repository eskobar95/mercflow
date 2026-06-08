import fs from "fs"
import path from "path"

import { resolvePlatformHost } from "./platform-url"

export class TraefikRouteConflictError extends Error {
  readonly name = "TraefikRouteConflictError"
}

export function slugifyDomainForTraefik(domain: string): string {
  return domain.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase()
}

export function buildTenantTraefikFilename(domain: string): string {
  return `tenant-${slugifyDomainForTraefik(domain)}.yml`
}

function escapeRegexDots(value: string): string {
  return value.replace(/\./g, "\\.")
}

export function buildTenantTraefikYaml(domain: string, platformBackendUrl: string): string {
  const routerName = `tenant-${slugifyDomainForTraefik(domain)}`
  const middlewareName = `${routerName}-redirect-admin`
  const platformHost = resolvePlatformHost(platformBackendUrl)
  const domainEscaped = escapeRegexDots(domain)

  return `# MercFlow tenant route (T030). Domain: ${domain}
# Storefront + public APIs on tenant host. /app and /admin redirect to platform admin (${platformHost}).
http:
  middlewares:
    ${middlewareName}:
      redirectRegex:
        permanent: true
        regex: "^https://${domainEscaped}/(app|admin).*"
        replacement: "https://${platformHost}/app"
  routers:
    ${routerName}-admin:
      rule: Host(\`${domain}\`) && (PathPrefix(\`/app\`) || PathPrefix(\`/admin\`))
      priority: 200
      entryPoints:
        - websecure
      middlewares:
        - ${middlewareName}
      service: ${routerName}
      tls:
        certResolver: letsencrypt
    ${routerName}:
      rule: Host(\`${domain}\`)
      priority: 1
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

export function writeTenantTraefikRoute(
  dynamicDir: string,
  domain: string,
  platformBackendUrl: string,
): string {
  if (domainAlreadyProvisioned(dynamicDir, domain)) {
    throw new TraefikRouteConflictError(
      `Traefik route for domain "${domain}" already exists in ${dynamicDir}`,
    )
  }

  fs.mkdirSync(dynamicDir, { recursive: true })
  const filename = buildTenantTraefikFilename(domain)
  const filePath = path.join(dynamicDir, filename)
  fs.writeFileSync(filePath, buildTenantTraefikYaml(domain, platformBackendUrl), "utf8")
  return filePath
}
