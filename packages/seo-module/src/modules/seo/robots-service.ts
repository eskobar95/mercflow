import type {
  MercflowRobotsConfigRecord,
  RobotsChangeHistoryEntry,
  RobotsRule,
  RobotsStructuredConfig,
} from "./robots-types"

const MAX_HISTORY = 10

const DEFAULT_RULES: RobotsStructuredConfig = {
  rules: [
    {
      user_agent: "*",
      allow: ["/"],
      disallow: [],
    },
  ],
}

function trimBaseUrl(url: string): string {
  return url.replace(/\/+$/, "")
}

function normalizeRule(rule: RobotsRule): RobotsRule {
  return {
    user_agent: rule.user_agent.trim() || "*",
    allow: rule.allow.map((p) => p.trim()).filter((p) => p.length > 0),
    disallow: rule.disallow.map((p) => p.trim()).filter((p) => p.length > 0),
  }
}

function renderStructuredRules(rules: RobotsRule[]): string {
  const lines: string[] = []
  for (const raw of rules) {
    const rule = normalizeRule(raw)
    lines.push(`User-agent: ${rule.user_agent}`)
    for (const path of rule.allow) {
      lines.push(`Allow: ${path}`)
    }
    for (const path of rule.disallow) {
      lines.push(`Disallow: ${path}`)
    }
    lines.push("")
  }
  return lines.join("\n").trimEnd()
}

export function appendSitemapDirective(storefrontUrl: string, body: string): string {
  const sitemapUrl = `${trimBaseUrl(storefrontUrl)}/sitemap.xml`
  const trimmedBody = body.trimEnd()
  if (trimmedBody.length === 0) {
    return `Sitemap: ${sitemapUrl}\n`
  }
  if (trimmedBody.includes("Sitemap:")) {
    return `${trimmedBody}\n`
  }
  return `${trimmedBody}\n\nSitemap: ${sitemapUrl}\n`
}

export function renderRobotsTxt(
  config: MercflowRobotsConfigRecord,
  storefrontUrl: string | null
): string {
  const freetext = config.freetext_override?.trim()
  let body: string
  if (freetext && freetext.length > 0) {
    body = freetext
  } else {
    const structured = normalizeRobotsStructured(config.structured_rules)
    const rules =
      structured.rules.length > 0 ? structured.rules : DEFAULT_RULES.rules
    body = renderStructuredRules(rules)
  }
  if (storefrontUrl) {
    return appendSitemapDirective(storefrontUrl, body)
  }
  return body.endsWith("\n") ? body : `${body}\n`
}

export function appendHistoryEntry(
  existing: RobotsChangeHistoryEntry[],
  summary: string,
  now: Date = new Date()
): RobotsChangeHistoryEntry[] {
  const entry: RobotsChangeHistoryEntry = {
    changed_at: now.toISOString(),
    summary,
  }
  return [entry, ...existing].slice(0, MAX_HISTORY)
}

export function defaultRobotsStructuredConfig(): RobotsStructuredConfig {
  return {
    rules: DEFAULT_RULES.rules.map((rule) => ({
      user_agent: rule.user_agent,
      allow: [...rule.allow],
      disallow: [...rule.disallow],
    })),
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

/**
 * Coerces DB/admin JSON into a safe structured config (never leaves `rules` missing).
 */
export function normalizeRobotsStructured(value: unknown): RobotsStructuredConfig {
  if (value === null || value === undefined) {
    return defaultRobotsStructuredConfig()
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return defaultRobotsStructuredConfig()
  }
  const rawRules = (value as { rules?: unknown }).rules
  if (!Array.isArray(rawRules)) {
    return defaultRobotsStructuredConfig()
  }
  const rules: RobotsRule[] = []
  for (const entry of rawRules) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      continue
    }
    const row = entry as Record<string, unknown>
    const user_agent = typeof row.user_agent === "string" ? row.user_agent : "*"
    const allow = isStringArray(row.allow) ? row.allow : []
    const disallow = isStringArray(row.disallow) ? row.disallow : []
    rules.push({ user_agent, allow, disallow })
  }
  if (rules.length === 0) {
    return defaultRobotsStructuredConfig()
  }
  return { rules }
}
