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
 *   3. An RLS policy exists on the `product` table that reads `app.tenant_id`.
 *      If not, the test will report the raw counts but flag isolation as unverified.
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
    // Medusa v2 stores the module's Awilix container under __container__.
    // __container__ is an Awilix cradle proxy: property access resolves keys.
    // "manager" holds the forked MikroORM EntityManager for this module.
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

  const productModule = container.resolve(Modules.PRODUCT)

  // ── Step 2: Verify subscriber fires and injects SET LOCAL ──
  console.log("\n2. Testing subscriber fires and injects SET LOCAL...")

  const PROBE_STORE_ID = "probe-store-abc"
  let observedTenantId: string | null = null

  await TenantContext.run(PROBE_STORE_ID, async () => {
    // MikroORM passes the transaction's fork EM as the callback argument.
    // Pass txEm.getTransactionContext() (the Knex trx) so the SELECT runs on
    // the SAME physical connection where set_config was called — not on a
    // fresh pooled connection where the SET LOCAL would be invisible.
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

  // ── Step 3: Verify isolation (if product table exists and has RLS) ──
  console.log("\n3. Testing tenant isolation via RLS on product table...")

  let tenantACount = -1
  let tenantBCount = -1
  let noContextCount = -1
  let tableExists = false

  try {
    // Raw count without any tenant context (should return 0 if RLS is active)
    const rawCounts: Array<{ count: string }> = await productEm
      .getConnection()
      .execute("SELECT COUNT(*) as count FROM product")
    noContextCount = parseInt(rawCounts[0].count, 10)
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
      // With tenant A context — pass the trx as ctx so RLS applies
      await TenantContext.run("store_tenant_a", async () => {
        await productEm.transactional(async (txEm: EntityManager) => {
          const rows: Array<{ count: string }> = await txEm
            .getConnection()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .execute("SELECT COUNT(*) as count FROM product", [], "all", txEm.getTransactionContext() as any)
          tenantACount = parseInt(rows[0].count, 10)
        })
      })

      // With tenant B context
      await TenantContext.run("store_tenant_b", async () => {
        await productEm.transactional(async (txEm: EntityManager) => {
          const rows: Array<{ count: string }> = await txEm
            .getConnection()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .execute("SELECT COUNT(*) as count FROM product", [], "all", txEm.getTransactionContext() as any)
          tenantBCount = parseInt(rows[0].count, 10)
        })
      })

      const rlsActive = noContextCount === 0
      const rlsIsolating = tenantACount !== tenantBCount
      const tableHasData = tenantACount > 0 || tenantBCount > 0

      let note: string
      if (rlsActive && rlsIsolating) {
        note = `No-context: ${noContextCount}, tenant_a: ${tenantACount}, tenant_b: ${tenantBCount} — full RLS isolation confirmed`
      } else if (!rlsActive) {
        note = `No-context shows ${noContextCount} rows — RLS not enforced (check BYPASSRLS on DB role or missing RLS policy)`
      } else if (!tableHasData) {
        note = `No-context: ${noContextCount} (RLS correctly blocks unscoped queries) — table is empty, seed data and add RLS policy on product table to fully verify`
      } else {
        note = `No-context: ${noContextCount}, tenant_a: ${tenantACount}, tenant_b: ${tenantBCount} — RLS blocks unscoped but both tenants see same count, check policy`
      }

      report("Product table RLS isolation", rlsActive && rlsIsolating, note)
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
    console.log("\n✓ Subscriber approach works end-to-end.")
    console.log("  Next: apply RLS policies to Medusa core tables and verify.")
  } else {
    console.log("\n✗ Some checks failed. Review notes above.")
  }
  console.log()
}
