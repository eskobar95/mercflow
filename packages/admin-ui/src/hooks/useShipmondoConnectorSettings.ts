import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getShipmondoConnectorAdmin,
  patchShipmondoConnectorAdmin,
  postShipmondoConnectorTest,
} from "@/features/connectors/shipmondoConnectorApi"
import type { ShipmondoConnectorGetDto, ShipmondoTestResultDto } from "@/features/connectors/shipmondoTypes"

const SHIPMONDO_QUERY_KEY = ["admin-shipmondo-connector"] as const

export function useShipmondoConnectorSettings(): {
  query: ReturnType<typeof useQuery<ShipmondoConnectorGetDto>>
  patch: ReturnType<typeof useMutation<ShipmondoConnectorGetDto, Error, Record<string, unknown>>>
  test: ReturnType<typeof useMutation<ShipmondoTestResultDto, Error, void>>
} {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SHIPMONDO_QUERY_KEY,
    queryFn: getShipmondoConnectorAdmin,
  })

  const patch = useMutation({
    mutationFn: patchShipmondoConnectorAdmin,
    onSuccess: (data) => {
      queryClient.setQueryData(SHIPMONDO_QUERY_KEY, data)
    },
  })

  const test = useMutation({
    mutationFn: async (): Promise<ShipmondoTestResultDto> => postShipmondoConnectorTest(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SHIPMONDO_QUERY_KEY })
    },
  })

  return { query, patch, test }
}
