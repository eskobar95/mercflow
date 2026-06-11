import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T056 / PRD-notification-system M012 — transactional email delivery audit log with idempotency.
 * Changes: email_deliveries table with store_id, template metadata, idempotency_key unique, status enum, RLS policy.
 * Reversible: Yes — down() drops policy and table
 * Fields derived from: .factory/planning/tasks.md T056, PRD-notification-system.md
 */
export class Migration20260611110000CreateEmailDeliveries extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "email_deliveries" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"template_key" text not null, ` +
        `"to_email" text not null, ` +
        `"entity_id" text not null, ` +
        `"idempotency_key" text not null, ` +
        `"status" text not null default 'queued', ` +
        `"error_message" text null, ` +
        `"sent_at" timestamptz null, ` +
        `"ses_message_id" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "email_deliveries_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_email_deliveries_store_id" ON "email_deliveries" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_email_deliveries_idempotency_key" ON "email_deliveries" ("idempotency_key");`
    )

    this.addSql(`ALTER TABLE "email_deliveries" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "email_deliveries" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS email_deliveries_tenant_isolation ON "email_deliveries";`)
    this.addSql(`
      CREATE POLICY email_deliveries_tenant_isolation ON "email_deliveries"
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP POLICY IF EXISTS email_deliveries_tenant_isolation ON "email_deliveries";`)
    this.addSql(`ALTER TABLE "email_deliveries" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "email_deliveries" DISABLE ROW LEVEL SECURITY;`)
    this.addSql(`drop table if exists "email_deliveries" cascade;`)
  }
}
