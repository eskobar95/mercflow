import fs from "fs"
import path from "path"

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

/**
 * Loads KEY=value pairs into process.env without overriding existing variables.
 */
export function loadEnvFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false
  }

  const content = fs.readFileSync(filePath, "utf8")
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim()
    if (line === "" || line.startsWith("#")) {
      continue
    }

    const separatorIndex = line.indexOf("=")
    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = unquote(line.slice(separatorIndex + 1).trim())

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return true
}

export function loadProvisionTenantDotenv(repoRoot: string): string[] {
  const loaded: string[] = []
  const candidates = [
    path.join(repoRoot, "apps", "backend", ".env"),
    path.join(repoRoot, ".env.provision.local"),
  ]

  for (const candidate of candidates) {
    if (loadEnvFile(candidate)) {
      loaded.push(path.relative(repoRoot, candidate))
    }
  }

  return loaded
}
