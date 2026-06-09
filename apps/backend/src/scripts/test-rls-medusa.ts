/**
 * RLS Integration Test — Medusa ProductModule + MikroORM Subscriber
 *
 * Validates that TenantIsolationSubscriber correctly injects
 * `SET LOCAL app.tenant_id` into Medusa module transactions, causing
 * PostgreSQL RLS policies to isolate data between tenants.
 *
 * Prerequisites:
 *   1. A PostgreSQL instance reachable via DATABASE_URL.
 *   2. The connecting role (e.g. mercflow_app) has NOBYPASSRLS.
 *   3. RLS policies on core tables (T036) read `app.tenant_id`.
 *
 * Run:
 *   cd apps/backend
 *   npx medusa exec src/scripts/test-rls-medusa.ts
 */

import type { MedusaContainer } from "@medusajs/framework"
import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type { EntityManager } from "@medusajs/framework/mikro-orm/core"

import { TenantContext } from "../lib/tenant-isolation/tenant-context"
import { registerTenantSubscriber } from "../lib/tenant-isolation/register-tenant-subscriber"

const GUAPO_STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"
const PROBE_STORE_ID = "probe-store-abc"

// ─── Helpers ────────────────────────────────────────────────────────────────

type PassFail = { label: string; pass: boolean; note: string }
const results: PassFail[] = []

function report(label: string, pass: boolean, note: string): void {
  results.push({ label, pass, note })
  const icon = pass ? "✓" : "✗"
  console.log(`  ${icon} ${label}`)
  if (note) console.log(`    ${note}`)
}

function resolveModuleEm(container: MedusaContainer, moduleKey: string): EntityManager {
  const service = container.resolve(moduleKey) as unknown as {
    __container__?: Record<string, unknown>
  }
  if (!service.__container__) {
    throw new Error(
      `Cannot access module container for ${moduleKey}. ` +
        `Expected service.__container__ to be defined.`,
    )
  }
  const em = service.__container__["manager"]
  if (!em) {
    throw new Error(`No "manager" key in module container for ${moduleKey}.`)
  }
  return em as EntityManager
}

async function countProductsInTransaction(
  em: EntityManager,
  txEm: EntityManager,
): Promise<number> {
  const rows: Array<{ count: string }> = await txEm
    .getConnection()
    .execute(
      "SELECT COUNT(*) as count FROM product",
      [],
      "all",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      txEm.getTransactionContext() as any,
    )
  void em
  return parseInt(rows[0]?.count ?? "0", 10)
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default async function testRlsMedusa({ container }: ExecArgs): Promise<void> {
  console.log("\n=== RLS Medusa Integration Test ===\n")

  // ── Step 1: Register subscriber on ProductModule EM ──
  console.log("1. Registering TenantIsolationSubscriber on ProductModule EM...")
  let productEm: EntityManager
  try {
    productEm = resolveModuleEm(container, Modules.PRODUCT)
    registerTenantSubscriber(productEm)
    report("Subscriber registration", true, "TenantIsolationSubscriber registered on ProductModule EM")
  } catch (err) {
    report(
      "Subscriber registration",
      false,
      `Failed: ${err instanceof Error ? err.message : String(err)}`,
    )
    printSummary()
    return
  }

  // ── Step 2: Verify subscriber fires and injects SET LOCAL ──
  console.log("\n2. Testing subscriber fires and injects SET LOCAL...")

  let observedTenantId: string | null = null

  await TenantContext.run(PROBE_STORE_ID, async () => {
    await productEm.transactional(async (txEm: EntityManager) => {
      const rows: Array<{ tenant_id: string }> = await txEm
        .getConnection()
        .execute(
          "SELECT current_setting('app.tenant_id', true) AS tenant_id",
          [],
          "all",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          txEm.getTransactionContext() as any,
        )
      observedTenantId = rows[0]?.tenant_id ?? null
    })
  })

  const subscriberFired = observedTenantId === PROBE_STORE_ID
  report(
    "SET LOCAL injected via subscriber",
    subscriberFired,
    subscriberFired
      ? `app.tenant_id correctly set to '${observedTenantId}' inside transaction`
      : `Expected '${PROBE_STORE_ID}', got '${observedTenantId}' — subscriber did not inject SET LOCAL`,
  )

  // ── Step 3: Verify isolation (T036 RLS on product table) ──
  console.log("\n3. Testing tenant isolation via RLS on product table...")

  let guapoCount = -1
  let probeCount = -1
  let noContextCount = -1
  let tableExists = false

  try {
    const rawCounts: Array<{ count: string }> = await productEm
      .getConnection()
      .execute("SELECT COUNT(*) as count FROM product")
    noContextCount = parseInt(rawCounts[0]?.count ?? "0", 10)
    tableExists = true
  } catch {
    report(
      "Product table RLS isolation",
      false,
      "product table not accessible or does not exist — run medusa migrations first",
    )
  }

  if (tableExists) {
    try {
      await TenantContext.run(GUAPO_STORE_ID, async () => {
        await productEm.transactional(async (txEm: EntityManager) => {
          guapoCount = await countProductsInTransaction(productEm, txEm)
        })
      })

      await TenantContext.run(PROBE_STORE_ID, async () => {
        await productEm.transactional(async (txEm: EntityManager) => {
          probeCount = await countProductsInTransaction(productEm, txEm)
        })
      })

      const rlsActive = noContextCount === 0
      const rlsIsolating = probeCount === 0 && guapoCount >= 0
      const tableHasData = guapoCount > 0

      let note: string
      if (rlsActive && rlsIsolating && tableHasData) {
        note =
          `No-context: ${noContextCount}, Guapo (${GUAPO_STORE_ID}): ${guapoCount}, ` +
          `probe (${PROBE_STORE_ID}): ${probeCount} — full RLS isolation confirmed`
      } else if (!rlsActive) {
        note = `No-context shows ${noContextCount} rows — RLS not enforced (check BYPASSRLS on DB role or missing RLS policy)`
      } else if (!tableHasData) {
        note =
          `No-context: ${noContextCount}, Guapo: ${guapoCount}, probe: ${probeCount} — ` +
          `RLS blocks unscoped queries but product table is empty; seed data to fully verify Guapo row visibility`
      } else if (probeCount !== 0) {
        note =
          `No-context: ${noContextCount}, Guapo: ${guapoCount}, probe: ${probeCount} — ` +
          `probe tenant should see 0 rows when RLS policy uses app.tenant_id`
      } else {
        note = `No-context: ${noContextCount}, Guapo: ${guapoCount}, probe: ${probeCount}`
      }

      report(
        "Product table RLS isolation",
        rlsActive && rlsIsolating,
        note,
      )
    } catch (err) {
      report(
        "Product table RLS isolation",
        false,
        `Query error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  printSummary()
}

function printSummary(): void {
  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass).length
  console.log(`\n─── Summary: ${passed} passed / ${failed} failed ───`)

  if (failed === 0) {
    console.log("\n✓ Subscriber approach works end-to-end against core product RLS.")
  } else {
    console.log("\n✗ Some checks failed. Review notes above.")
  }
  console.log()
}
