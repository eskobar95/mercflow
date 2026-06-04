import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory S002 T004 / ADR-005 — RLS tenant_isolation on seo-module tables from day one (same pattern as T002).
 * Changes:
 *   - ENABLE + FORCE ROW LEVEL SECURITY on mercflow_seo_config, mercflow_redirect
 *   - CREATE POLICY tenant_isolation USING (store_id = current_setting('app.store_id', true))
 * Reversible: Yes — down() drops policies and disables RLS
 * Fields derived from: content-module Migration20260604220000EnableRlsTenantIsolation
 */
const SEO_TABLES = ["mercflow_seo_config", "mercflow_redirect"] as const

export class Migration20260604141000EnableRlsMercflowSeo extends Migration {
  override async up(): Promise<void> {
    for (const table of SEO_TABLES) {
      this.enableRlsOnTable(table)
    }
  }

  override async down(): Promise<void> {
    for (const table of [...SEO_TABLES].reverse()) {
      this.disableRlsOnTable(table)
    }
  }

  private enableRlsOnTable(table: string): void {
    this.addSql(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS tenant_isolation ON "${table}";`)
    this.addSql(`
      CREATE POLICY tenant_isolation ON "${table}"
        USING (store_id = current_setting('app.store_id', true));
    `)
  }

  private disableRlsOnTable(table: string): void {
    this.addSql(`DROP POLICY IF EXISTS tenant_isolation ON "${table}";`)
    this.addSql(`ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`)
  }
}
