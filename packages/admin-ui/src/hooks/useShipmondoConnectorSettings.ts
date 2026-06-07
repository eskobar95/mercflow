import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getShipmondoConnectorAdmin,
  patchShipmondoConnectorAdmin,
  postShipmondoConnectorTest,
} from "@/features/connectors/shipmondoConnectorApi"
import type { ShipmondoConnectorGetDto, ShipmondoTestResultDto } from "@/features/connectors/shipmondoTypes"

export const ADMIN_SHIPMONDO_SETTINGS_QUERY_KEY = ["admin-shipmondo-connector"] as const

export function useShipmondoConnectorSettings(): {
  data: ShipmondoConnectorGetDto | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  isFetching: boolean
  refetch: ReturnType<typeof useQuery<ShipmondoConnectorGetDto>>["refetch"]
  patch: ReturnType<typeof useMutation<ShipmondoConnectorGetDto, Error, Record<string, unknown>>>
  test: ReturnType<typeof useMutation<ShipmondoTestResultDto, Error, void>>
} {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ADMIN_SHIPMONDO_SETTINGS_QUERY_KEY,
    queryFn: getShipmondoConnectorAdmin,
  })

  const patch = useMutation({
    mutationFn: patchShipmondoConnectorAdmin,
    onSuccess: (next) => {
      queryClient.setQueryData(ADMIN_SHIPMONDO_SETTINGS_QUERY_KEY, next)
    },
  })

  const test = useMutation({
    mutationFn: async (): Promise<ShipmondoTestResultDto> => postShipmondoConnectorTest(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_SHIPMONDO_SETTINGS_QUERY_KEY })
    },
  })

  return { data, isLoading, isError, error, isFetching, refetch, patch, test }
}
