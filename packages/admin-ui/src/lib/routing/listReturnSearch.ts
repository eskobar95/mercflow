/** Search param on detail routes that stores the originating list query string. */
export const LIST_RETURN_SEARCH_PARAM = "listReturn"

export function appendListReturnSearchParam(
  detailPath: string,
  listSearchQuery: string,
): string {
  const trimmed = listSearchQuery.replace(/^\?/, "").trim()
  if (trimmed.length === 0) {
    return detailPath
  }

  const params = new URLSearchParams()
  params.set(LIST_RETURN_SEARCH_PARAM, trimmed)
  return `${detailPath}?${params.toString()}`
}

export function buildListHrefFromReturnParam(
  listPath: string,
  searchParams: URLSearchParams,
): string {
  const listReturn = searchParams.get(LIST_RETURN_SEARCH_PARAM)
  if (listReturn === null || listReturn.trim().length === 0) {
    return listPath
  }
  return `${listPath}?${listReturn}`
}
