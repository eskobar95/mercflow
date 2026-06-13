const ADMIN_LIST_DEFAULT_LIMIT = 50
const ADMIN_LIST_MAX_LIMIT = 100

export function resolveAdminListLimit(limit: number | undefined): number {
  return Math.min(limit ?? ADMIN_LIST_DEFAULT_LIMIT, ADMIN_LIST_MAX_LIMIT)
}

export function resolveAdminListOffset(offset: number | undefined): number {
  if (offset === undefined || offset < 0) {
    return 0
  }
  return offset
}
