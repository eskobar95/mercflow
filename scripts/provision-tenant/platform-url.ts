export function resolvePlatformAdminUrl(backendUrl: string): string {
  const origin = backendUrl.replace(/\/$/, "")
  return `${origin}/app`
}

export function resolvePlatformHost(backendUrl: string): string {
  return new URL(backendUrl).host
}
