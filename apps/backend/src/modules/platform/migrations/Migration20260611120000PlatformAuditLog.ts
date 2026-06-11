import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T068 — Platform Console tenant management audit trail (PRD-platform-console.md J001/J005)
 * Changes:
 *   - New table: platform_audit_log (operator_email, action, entity_type, entity_id, metadata)
 *   - Add store.is_disabled for tenant suspension (PRD OQ-03 belt-and-suspenders with API key revoke)
 * Reversible: Yes — down() drops platform_audit_log and removes store.is_disabled
 * Generated via: Hand-authored to match DML in `src/modules/platform/models/platform-audit-log.ts`
 * Fields derived from: tasks.md T068, PRD-platform-console.md platform_audit_log section
 */
export class Migration20260611120000PlatformAuditLog extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "platform_audit_log" (
        "id" text not null,
        "operator_email" text not null,
        "action" text not null,
        "entity_type" text not null,
        "entity_id" text not null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "platform_audit_log_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_platform_audit_log_created_at" ON "platform_audit_log" ("created_at");`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_platform_audit_log_entity" ON "platform_audit_log" ("entity_type", "entity_id");`,
    )

    this.addSql(`
      alter table if exists "store"
      add column if not exists "is_disabled" boolean not null default false;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "platform_audit_log" cascade;`)
    this.addSql(`alter table if exists "store" drop column if exists "is_disabled";`)
  }
}
