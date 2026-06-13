import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../http/zod-error"
import { upsertPaymentProviderBodySchema } from "../../../modules/payment/http-schemas"
import { PAYMENT_MODULE } from "../../../modules/payment/types"
import {
  paymentProviderAdminDtoFromRow,
  type PaymentProviderAdminDto,
} from "../../../modules/payment/payment-provider-admin-json"
import { resolveMercflowStoreId } from "../../../modules/payment/resolve-store-id"
import type PaymentModuleService from "../../../modules/payment/service"

function toAdminDto(
  storeId: string,
  snapshot: Awaited<ReturnType<PaymentModuleService["getAdminProviderSnapshot"]>>
): PaymentProviderAdminDto {
  if (snapshot === null) {
    return paymentProviderAdminDtoFromRow(storeId, "stripe", null, null)
  }

  return {
    id: snapshot.id,
    store_id: snapshot.store_id,
    provider: snapshot.provider,
    mode: snapshot.mode,
    publishable_key: snapshot.publishable_key,
    test_publishable_key: snapshot.test_publishable_key,
    live_publishable_key: snapshot.live_publishable_key,
    test_has_secret_key: snapshot.test_has_secret_key,
    live_has_secret_key: snapshot.live_has_secret_key,
    test_has_webhook_secret: snapshot.test_has_webhook_secret,
    live_has_webhook_secret: snapshot.live_has_webhook_secret,
    configured: snapshot.configured,
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(PAYMENT_MODULE) as unknown as PaymentModuleService
  const snapshot = await service.getAdminProviderSnapshot(storeId)
  res.status(200).json({ payment_provider: toAdminDto(storeId, snapshot) })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const body = upsertPaymentProviderBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(body.error)
  }

  const service = req.scope.resolve(PAYMENT_MODULE) as unknown as PaymentModuleService
  await service.upsertProviderConfig(storeId, body.data)
  const snapshot = await service.getAdminProviderSnapshot(storeId, body.data.provider)
  res.status(200).json({ payment_provider: toAdminDto(storeId, snapshot) })
}
