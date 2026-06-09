import { Migration } from "@medusajs/framework/mikro-orm/migrations"

import { GUAPO_BACKFILL_STORE_ID, M0_CORE_TABLES } from "../core-tables-constants"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory T036 / PRD-fork-setup J003 / ADR-004, ADR-005, ADR-007 — add store_id NOT NULL,
 *   RLS tenant_isolation (app.tenant_id), and write-bridge triggers on M0 Medusa core tables without
 *   forking @medusajs/product or @medusajs/order DML.
 * Changes:
 *   - product, product_variant, product_category, order, customer, order_line_item — store_id NOT NULL,
 *     index, ENABLE+FORCE RLS, tenant_isolation policy (USING + WITH CHECK), BEFORE INSERT OR UPDATE trigger
 *   - Shared function mercflow_set_store_id_from_tenant_id() sets store_id from app.tenant_id when unset
 * Reversible: Yes — down() drops triggers, function, policies, RLS, indexes, and store_id columns
 * Fields derived from: .factory/planning/tasks.md T036 HITL decision (locked), PRD-fork-setup.md
 */
const TRIGGER_FUNCTION = "mercflow_set_store_id_from_tenant_id"

export class Migration20260609120000CoreTablesStoreIdRls extends Migration {
  override async up(): Promise<void> {
    this.createTriggerFunctionUp()

    for (const table of M0_CORE_TABLES) {
      this.addCoreTableStoreIdUp(table)
      this.enableRlsOnTable(table)
      this.attachStoreIdTrigger(table)
    }
  }

  override async down(): Promise<void> {
    for (const table of [...M0_CORE_TABLES].reverse()) {
      this.detachStoreIdTrigger(table)
      this.disableRlsOnTable(table)
      this.dropCoreTableStoreIdDown(table)
    }

    this.dropTriggerFunctionDown()
  }

  private createTriggerFunctionUp(): void {
    this.addSql(`
      CREATE OR REPLACE FUNCTION "${TRIGGER_FUNCTION}"()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF NEW.store_id IS NULL OR NEW.store_id = '' THEN
          NEW.store_id := current_setting('app.tenant_id', true);
        END IF;
        RETURN NEW;
      END;
      $$;
    `)
  }

  private dropTriggerFunctionDown(): void {
    this.addSql(`DROP FUNCTION IF EXISTS "${TRIGGER_FUNCTION}"();`)
  }

  private attachStoreIdTrigger(table: string): void {
    const triggerName = `trg_${table}_set_store_id_from_tenant`
    this.addSql(`DROP TRIGGER IF EXISTS "${triggerName}" ON "${table}";`)
    this.addSql(`
      CREATE TRIGGER "${triggerName}"
      BEFORE INSERT OR UPDATE ON "${table}"
      FOR EACH ROW
      EXECUTE FUNCTION "${TRIGGER_FUNCTION}"();
    `)
  }

  private detachStoreIdTrigger(table: string): void {
    const triggerName = `trg_${table}_set_store_id_from_tenant`
    this.addSql(`DROP TRIGGER IF EXISTS "${triggerName}" ON "${table}";`)
  }

  private addCoreTableStoreIdUp(table: string): void {
    const storeId = GUAPO_BACKFILL_STORE_ID

    this.addSql(
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "store_id" text DEFAULT '';`
    )
    this.addSql(
      `UPDATE "${table}" SET "store_id" = '${storeId}' WHERE "store_id" IS NULL OR "store_id" = '';`
    )
    this.addSql(`ALTER TABLE "${table}" ALTER COLUMN "store_id" SET NOT NULL;`)
    this.addSql(`ALTER TABLE "${table}" ALTER COLUMN "store_id" DROP DEFAULT;`)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_${table}_store_id" ON "${table}" ("store_id");`
    )
  }

  private dropCoreTableStoreIdDown(table: string): void {
    this.addSql(`DROP INDEX IF EXISTS "IDX_${table}_store_id";`)
    this.addSql(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "store_id";`)
  }

  private enableRlsOnTable(table: string): void {
    this.addSql(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS tenant_isolation ON "${table}";`)
    this.addSql(`
      CREATE POLICY tenant_isolation ON "${table}"
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
  }

  private disableRlsOnTable(table: string): void {
    this.addSql(`DROP POLICY IF EXISTS tenant_isolation ON "${table}";`)
    this.addSql(`ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`)
  }
}
