import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory S003 T009/T011 / ADR-005 — RLS on sitemap and robots config tables.
 * Changes:
 *   - ENABLE + FORCE ROW LEVEL SECURITY on mercflow_sitemap_config, mercflow_robots_config
 *   - CREATE POLICY tenant_isolation USING (store_id = current_setting('app.store_id', true))
 * Reversible: Yes — down() drops policies and disables RLS
 */
const TABLES = ["mercflow_sitemap_config", "mercflow_robots_config"] as const

export class Migration20260605091000EnableRlsSitemapRobots extends Migration {
  override async up(): Promise<void> {
    for (const table of TABLES) {
      this.enableRlsOnTable(table)
    }
  }

  override async down(): Promise<void> {
    for (const table of [...TABLES].reverse()) {
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
