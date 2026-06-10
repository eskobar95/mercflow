import { useQuery } from "@tanstack/react-query"

import { getShipmondoConnectorAdmin } from "@/features/connectors/shipmondoConnectorApi"

export const ADMIN_SHIPMONDO_LABEL_READY_QUERY_KEY = ["admin-shipmondo-label-ready"] as const

export function useShipmondoLabelGenerationReady(): {
  isReady: boolean
  isLoading: boolean
} {
  const { data, isLoading } = useQuery({
    queryKey: ADMIN_SHIPMONDO_LABEL_READY_QUERY_KEY,
    queryFn: getShipmondoConnectorAdmin,
    staleTime: 60_000,
  })

  const configured =
    data !== undefined &&
    data.credentials.apiUserConfigured &&
    data.credentials.apiKeyConfigured &&
    data.active

  const senderComplete =
    data !== undefined &&
    data.labelSettings.senderName.trim() !== "" &&
    data.labelSettings.senderAddress1.trim() !== "" &&
    data.labelSettings.senderPostalCode.trim() !== "" &&
    data.labelSettings.senderCity.trim() !== "" &&
    data.labelSettings.senderCountryCode.trim().length === 2 &&
    data.labelSettings.senderEmail.trim() !== "" &&
    data.labelSettings.senderPhone.trim() !== ""

  return {
    isReady: configured === true && senderComplete === true,
    isLoading,
  }
}
