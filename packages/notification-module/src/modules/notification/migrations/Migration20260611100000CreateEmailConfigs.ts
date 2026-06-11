import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T056 / PRD-notification-system M012 — per-tenant email configuration for SES and branding.
 * Changes: email_configs table with store_id, domain/branding fields, ses_domain_status enum, RLS policy.
 * Reversible: Yes — down() drops policy and table
 * Fields derived from: .factory/planning/tasks.md T056, PRD-notification-system.md
 */
export class Migration20260611100000CreateEmailConfigs extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "email_configs" (` +
        `"id" text not null, ` +
        `"store_id" text not null, ` +
        `"domain" text null, ` +
        `"from_email" text null, ` +
        `"from_name" text null, ` +
        `"reply_to" text null, ` +
        `"logo_url" text null, ` +
        `"brand_color" text null, ` +
        `"support_email" text null, ` +
        `"ses_domain_status" text not null default 'pending', ` +
        `"ses_identity_arn" text null, ` +
        `"fallback_from" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "email_configs_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_email_configs_store_id" ON "email_configs" ("store_id");`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_email_configs_store_unique" ON "email_configs" ("store_id") WHERE deleted_at IS NULL;`
    )

    this.addSql(`ALTER TABLE "email_configs" ENABLE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "email_configs" FORCE ROW LEVEL SECURITY;`)
    this.addSql(`DROP POLICY IF EXISTS email_configs_tenant_isolation ON "email_configs";`)
    this.addSql(`
      CREATE POLICY email_configs_tenant_isolation ON "email_configs"
        USING (store_id = current_setting('app.tenant_id', true))
        WITH CHECK (store_id = current_setting('app.tenant_id', true));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP POLICY IF EXISTS email_configs_tenant_isolation ON "email_configs";`)
    this.addSql(`ALTER TABLE "email_configs" NO FORCE ROW LEVEL SECURITY;`)
    this.addSql(`ALTER TABLE "email_configs" DISABLE ROW LEVEL SECURITY;`)
    this.addSql(`drop table if exists "email_configs" cascade;`)
  }
}
