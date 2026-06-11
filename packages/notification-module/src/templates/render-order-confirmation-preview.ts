export type OrderConfirmationPreviewBranding = {
  logoUrl: string | null
  brandColor: string
  storeName: string
  replyTo: string | null
  supportEmail: string | null
}

const DEFAULT_BRAND_COLOR = "#2563EB"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function normalizeBrandColor(value: string | null | undefined): string {
  if (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    return value
  }
  return DEFAULT_BRAND_COLOR
}

export function renderOrderConfirmationPreview(
  branding: OrderConfirmationPreviewBranding,
): string {
  const brandColor = normalizeBrandColor(branding.brandColor)
  const storeName = escapeHtml(branding.storeName.trim() || "Your store")
  const supportEmail = branding.supportEmail?.trim() ?? ""
  const replyTo = branding.replyTo?.trim() ?? ""
  const logoUrl = branding.logoUrl?.trim() ?? ""
  const logoMarkup =
    logoUrl !== ""
      ? `<img src="${escapeHtml(logoUrl)}" alt="${storeName} logo" width="120" />`
      : `<strong style="color:${brandColor}">${storeName}</strong>`

  return `<!DOCTYPE html><html><body style="font-family:sans-serif"><header style="border-bottom:4px solid ${brandColor};padding:16px">${logoMarkup}</header><main style="padding:16px"><h1>Order confirmation</h1><p>Thanks for your order from ${storeName}.</p><p><a style="background:${brandColor};color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none" href="#">View order</a></p></main><footer style="padding:16px;background:#f9fafb">${supportEmail ? `<p>Support: ${escapeHtml(supportEmail)}</p>` : ""}${replyTo ? `<p>Reply-to: ${escapeHtml(replyTo)}</p>` : ""}</footer></body></html>`
}
