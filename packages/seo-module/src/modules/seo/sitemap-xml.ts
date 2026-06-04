import type { SitemapUrlEntry } from "./sitemap-types"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function renderUrl(entry: SitemapUrlEntry): string {
  const parts = [`    <loc>${escapeXml(entry.loc)}</loc>`]
  if (entry.lastmod) {
    parts.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`)
  }
  if (entry.changefreq) {
    parts.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`)
  }
  if (entry.priority !== undefined) {
    parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)
  }
  return `  <url>\n${parts.join("\n")}\n  </url>`
}

export function buildSitemapXml(entries: SitemapUrlEntry[]): string {
  const urls = entries.map((entry) => renderUrl(entry)).join("\n")
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  )
}
