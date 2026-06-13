import type { Context } from "@medusajs/types"
import { MedusaError } from "@medusajs/utils"

/** Medusa store IDs: `store_` + uppercase alphanumeric (e.g. store_01KG0VBTT0714XV2CCTEBRVC47). */
const MEDUSA_STORE_ID_PATTERN = /^store_[0-9A-Z]+$/

type SqlExecutor = {
  execute: (sql: string, params?: unknown[]) => Promise<unknown>
}

type TransactionCapableRepository = {
  transaction: <T>(
    task: (transactionManager: unknown) => Promise<T>,
    options?: Record<string, unknown>
  ) => Promise<T>
}

export function assertMedusaStoreId(storeId: string): void {
  if (!MEDUSA_STORE_ID_PATTERN.test(storeId)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "store_id must be a valid Medusa store identifier"
    )
  }
}

export async function setLocalAppTenantId(
  transactionManager: unknown,
  storeId: string
): Promise<void> {
  assertMedusaStoreId(storeId)
  const runner = resolveSqlExecutor(transactionManager)
  await runner.execute(`SELECT set_config('app.tenant_id', ?, true)`, [storeId])
}

function resolveSqlExecutor(transactionManager: unknown): SqlExecutor {
  const candidate = transactionManager as SqlExecutor & {
    getConnection?: () => SqlExecutor
  }
  if (typeof candidate.execute === "function") {
    return candidate
  }
  const connection = candidate.getConnection?.()
  if (connection && typeof connection.execute === "function") {
    return connection
  }
  throw new MedusaError(
    MedusaError.Types.UNEXPECTED_STATE,
    "Cannot apply tenant scope: missing SQL executor on transaction manager"
  )
}

export async function runWithTenantScope<T>(
  baseRepository: TransactionCapableRepository,
  storeId: string,
  fn: (context: Context) => Promise<T>
): Promise<T> {
  return baseRepository.transaction(async (transactionManager: unknown) => {
    await setLocalAppTenantId(transactionManager, storeId)
    return fn({ transactionManager })
  })
}
