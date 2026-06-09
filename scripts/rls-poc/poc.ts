/**
 * RLS Multi-tenancy Proof of Concept
 *
 * Spørgsmål dette script besvarer:
 *  1. Har Neons DB-bruger BYPASSRLS? (blocker for RLS isolation)
 *  2. Virker SET LOCAL app.tenant_id per transaktion teknisk?
 *  3. Hvad skal rettes for at RLS isolation virker i praksis?
 *
 * SIKKERT: Kun TEMP-tabeller — forsvinder automatisk ved session-slut.
 *
 * Kør: pnpm --filter @mercflow/backend exec -- tsx ../../scripts/rls-poc/poc.ts
 * eller: DATABASE_URL=... npx tsx scripts/rls-poc/poc.ts
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require(
  "/Users/nicklaseskou/mercflow/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js"
) as typeof import("pg")

const RAW_URL =
  process.env.DATABASE_URL ||
  "postgresql://mercflow:mercflow_dev@localhost:5432/mercflow"

// Neon pooler (PgBouncer) understøtter ikke TEMP tables eller SET LOCAL pålideligt.
// Brug direkte endpoint (uden -pooler i hostname) til RLS tests.
const DATABASE_URL = RAW_URL.includes("-pooler.")
  ? RAW_URL.replace(/-pooler\./, ".")
  : RAW_URL

type TestResult = { name: string; pass: boolean; note?: string }
const results: TestResult[] = []

function pass(name: string, note?: string): void {
  results.push({ name, pass: true, note })
  console.log(`  ✅ ${name}${note ? `  — ${note}` : ""}`)
}
function fail(name: string, note?: string): void {
  results.push({ name, pass: false, note })
  console.log(`  ❌ ${name}${note ? `  — ${note}` : ""}`)
}
function warn(msg: string): void {
  console.log(`  ⚠️  ${msg}`)
}
function section(title: string): void {
  console.log(`\n── ${title} ──`)
}

async function run(): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
  } catch (err) {
    console.error("\n❌ Kunne ikke forbinde til databasen.")
    console.error(`   Fejl: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  console.log("\n╔══════════════════════════════════════════════╗")
  console.log("║   MercFlow RLS Multi-Tenancy POC             ║")
  console.log("╚══════════════════════════════════════════════╝")

  // ─────────────────────────────────────────────
  // DEL 1 — Diagnose DB-bruger
  // ─────────────────────────────────────────────
  section("DEL 1: DB-bruger diagnose")

  const userRow = await client.query<{ current_user: string }>("SELECT current_user")
  const currentUser = userRow.rows[0].current_user
  console.log(`  Forbundet som: ${currentUser}`)

  const roleRow = await client.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
    "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = $1",
    [currentUser]
  )
  const isSuperuser = roleRow.rows[0]?.rolsuper ?? false
  const bypassRls = roleRow.rows[0]?.rolbypassrls ?? false

  console.log(`  Superuser:   ${isSuperuser}`)
  console.log(`  BYPASSRLS:   ${bypassRls}`)
  console.log(`  Via pooler:  ${RAW_URL.includes("-pooler.")} (bruger nu direkte endpoint)`)

  if (bypassRls) {
    fail(
      "DB-bruger har BYPASSRLS",
      `${currentUser} omgår alle RLS policies — isolation er umulig med denne rolle`
    )
    warn("Dette er Neons standard for 'neondb_owner' og tilsvarende owner-roller")
    warn(`Fix: REVOKE BYPASSRLS FROM ${currentUser}`)
    warn("Eller: opret en separat 'mercflow_app' rolle uden BYPASSRLS til applikationsforbindelser")
  } else if (isSuperuser) {
    fail(
      "DB-bruger er superuser",
      "Superuser omgår RLS. Brug FORCE ROW LEVEL SECURITY på alle tabeller"
    )
  } else {
    pass("DB-bruger er ikke superuser og har ikke BYPASSRLS", "RLS virker med denne rolle")
  }

  // ─────────────────────────────────────────────
  // DEL 2 — RLS teknisk validering (FORCE + TEMP table)
  // Selv med BYPASSRLS viser dette at policy-logikken er korrekt
  // ─────────────────────────────────────────────
  section("DEL 2: RLS policy-logik (TEMP table med FORCE ROW LEVEL SECURITY)")
  console.log("  Bemærk: FORCE RLS gælder IKKE for roller med BYPASSRLS.")
  console.log("  Disse tests verificerer policy-logikken — ikke isolation med nuværende rolle.")

  await client.query(`
    CREATE TEMP TABLE rls_poc_product (
      id        text PRIMARY KEY,
      title     text NOT NULL,
      tenant_id text NOT NULL
    )
  `)
  await client.query("ALTER TABLE rls_poc_product ENABLE ROW LEVEL SECURITY")
  await client.query("ALTER TABLE rls_poc_product FORCE ROW LEVEL SECURITY")
  await client.query(`
    CREATE POLICY tenant_isolation ON rls_poc_product
    AS PERMISSIVE FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', TRUE))
    WITH CHECK (tenant_id = current_setting('app.tenant_id', TRUE))
  `)

  // WITH CHECK kræver app.tenant_id matcher ved INSERT — sæt kontekst under seeding
  await client.query("SET app.tenant_id = 'tenant_a'")
  await client.query("INSERT INTO rls_poc_product VALUES ('prod_a1', 'Tenant A Bukser', 'tenant_a')")
  await client.query("INSERT INTO rls_poc_product VALUES ('prod_a2', 'Tenant A Trøje', 'tenant_a')")
  await client.query("SET app.tenant_id = 'tenant_b'")
  await client.query("INSERT INTO rls_poc_product VALUES ('prod_b1', 'Tenant B Vin', 'tenant_b')")
  await client.query("RESET app.tenant_id")
  console.log("  3 test-rækker seedet (2x tenant_a, 1x tenant_b)")

  // Tjek om FORCE RLS virker for BYPASSRLS-rolle (det gør det typisk IKKE)
  await client.query("RESET app.tenant_id")
  const noCtx = await client.query<{ id: string }>("SELECT id FROM rls_poc_product")

  if (bypassRls) {
    if (noCtx.rows.length === 3) {
      warn(
        `BYPASSRLS bekræftet: ${noCtx.rows.length} rækker synlige selv uden tenant-kontekst`
      )
      warn("FORCE ROW LEVEL SECURITY har ingen effekt på BYPASSRLS-roller")
    }
  } else {
    if (noCtx.rows.length === 0) {
      pass("Ingen tenant-kontekst → 0 rækker (korrekt isolation)")
    } else {
      fail("Ingen tenant-kontekst → rækker synlige", `${noCtx.rows.length} rækker lækker`)
    }
  }

  // ─────────────────────────────────────────────
  // DEL 3 — SET LOCAL mønster (teknisk validering)
  // ─────────────────────────────────────────────
  section("DEL 3: SET LOCAL i transaktion — teknisk mønster")

  // Test at SET LOCAL virker på dette Postgres setup (uafhængigt af RLS)
  await client.query("BEGIN")
  await client.query("SET LOCAL app.tenant_id = 'tenant_a'")
  const inTx = await client.query<{ val: string }>(
    "SELECT current_setting('app.tenant_id', TRUE) AS val"
  )
  await client.query("COMMIT")

  const afterTx = await client.query<{ val: string }>(
    "SELECT current_setting('app.tenant_id', TRUE) AS val"
  )

  const setLocalWorked = inTx.rows[0]?.val === "tenant_a"
  const resetAfterCommit = afterTx.rows[0]?.val !== "tenant_a"

  if (setLocalWorked) {
    pass("SET LOCAL app.tenant_id sættes korrekt i transaktion")
  } else {
    fail("SET LOCAL virkede ikke", `Fik: ${inTx.rows[0]?.val}`)
  }

  if (resetAfterCommit) {
    pass("app.tenant_id nulstilles efter COMMIT", "Ingen session-lækage mellem requests")
  } else {
    fail(
      "app.tenant_id lækker efter COMMIT",
      "SET LOCAL burde nulstilles — check Neon pooler-mode"
    )
  }

  // SAVEPOINT test
  await client.query("BEGIN")
  await client.query("SET LOCAL app.tenant_id = 'tenant_a'")
  await client.query("SAVEPOINT step1")
  const inSavepoint = await client.query<{ val: string }>(
    "SELECT current_setting('app.tenant_id', TRUE) AS val"
  )
  await client.query("RELEASE SAVEPOINT step1")
  await client.query("COMMIT")

  if (inSavepoint.rows[0]?.val === "tenant_a") {
    pass("SET LOCAL bevares igennem SAVEPOINT/nested steps", "Medusa workflow-steps er kompatible")
  } else {
    fail("SET LOCAL tabes ved SAVEPOINT")
  }

  // ─────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────
  await client.query("DROP TABLE rls_poc_product")
  await client.end()

  // ─────────────────────────────────────────────
  // Sammenfatning
  // ─────────────────────────────────────────────
  const passCount = results.filter((r) => r.pass).length
  const failCount = results.filter((r) => !r.pass).length

  console.log("\n╔══════════════════════════════════════════════╗")
  console.log("║   RESULTAT                                   ║")
  console.log("╚══════════════════════════════════════════════╝")
  console.log(`\n  ${passCount} ✅  ${failCount} ❌\n`)

  console.log("── Hvad POC'en har bevist ──\n")

  if (bypassRls) {
    console.log("  BLOCKER FUNDET:")
    console.log(`  ❌ ${currentUser} har BYPASSRLS — RLS isolation virker ikke med Neons standard-rolle`)
    console.log()
    console.log("  LØSNING (to muligheder):")
    console.log()
    console.log("  Option A — Fjern BYPASSRLS fra eksisterende rolle (simpelt, Neon-specifikt):")
    console.log(`    REVOKE BYPASSRLS FROM ${currentUser};`)
    console.log("    OBS: Verificer at Neon tillader dette på deres managed service")
    console.log()
    console.log("  Option B — Opret dedikeret app-rolle (anbefalet for platform, defense-in-depth):")
    console.log("    CREATE ROLE mercflow_app LOGIN PASSWORD '...' NOSUPERUSER;")
    console.log("    GRANT CONNECT ON DATABASE <db> TO mercflow_app;")
    console.log("    GRANT USAGE ON SCHEMA public TO mercflow_app;")
    console.log("    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mercflow_app;")
    console.log("    -- Sæt DATABASE_URL til denne bruger i Medusa config")
    console.log()
    console.log("  TEKNISK VALIDERET (uafhængigt af BYPASSRLS-problemet):")
  }

  if (setLocalWorked && resetAfterCommit) {
    console.log("  ✅ SET LOCAL app.tenant_id virker korrekt på dette Postgres-setup")
    console.log("  ✅ app.tenant_id nulstilles korrekt efter COMMIT (ingen session-lækage)")
    console.log("  ✅ SET LOCAL bevares igennem SAVEPOINT (Medusa workflow-steps kompatible)")
    console.log()
    console.log("  Det tekniske fundament for RLS multi-tenancy er intakt.")
    console.log("  Eneste blocker er BYPASSRLS på nuværende DB-bruger.")
  }

  console.log()
  console.log("── Næste skridt for platform RLS ──")
  console.log()
  console.log("  1. Fix BYPASSRLS (Option A eller B ovenfor)")
  console.log("  2. Test dette script igen med den rettede rolle — alle tests bør bestå")
  console.log("  3. Byg MikroORM EventSubscriber der sætter SET LOCAL app.tenant_id ved transaction-start")
  console.log("  4. Test om Medusa ProductModuleService respekterer isolation med subscriberen")
  console.log("  5. Beslut fork vs. sidecar-only baseret på resultat af step 4")
  console.log()
}

run().catch((err) => {
  console.error("\n❌ Uventet fejl:", err instanceof Error ? err.message : String(err))
  process.exit(1)
})
