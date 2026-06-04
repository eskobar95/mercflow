import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: ADR-005 — RLS tenant isolation on new MercFlow inventory tables (S008 T026).
 * Changes: ENABLE + FORCE RLS on mercflow_order_note; policy tenant_isolation on store_id.
 * Reversible: Yes — down() drops policy and disables RLS.
 */
export class Migration20260604230100EnableRlsMercflowOrderNote extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "mercflow_order_note" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "mercflow_order_note" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS tenant_isolation ON "mercflow_order_note";`)
    this.addSql(`
      CREATE POLICY tenant_isolation ON "mercflow_order_note"
        USING (store_id = current_setting('app.store_id', true));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP POLICY IF EXISTS tenant_isolation ON "mercflow_order_note";`)
    this.addSql(`ALTER TABLE "mercflow_order_note" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "mercflow_order_note" DISABLE ROW LEVEL SECURITY;`)
  }
}
