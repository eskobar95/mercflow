import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: ADR-008 / T039 — RLS tenant isolation on metafield_values (values always tenant-owned).
 * Changes: ENABLE + FORCE RLS; policy store_id = current_setting('app.tenant_id', true) for all operations.
 * Reversible: Yes — down() drops policy and disables RLS
 */
export class Migration20260610120300EnableRlsMetafieldValues extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "metafield_values" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "metafield_values" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS metafield_values_tenant_isolation ON "metafield_values";`)
    this.addSql(`
      CREATE POLICY metafield_values_tenant_isolation ON "metafield_values"
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP POLICY IF EXISTS metafield_values_tenant_isolation ON "metafield_values";`)
    this.addSql(`ALTER TABLE "metafield_values" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "metafield_values" DISABLE ROW LEVEL SECURITY;`)
  }
}
