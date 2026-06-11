import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T057 / ADR-009 — persist SES DKIM/SPF DNS record snapshot on email_configs for admin UI.
 * Changes: add dns_records jsonb nullable column to email_configs.
 * Reversible: Yes — down() drops dns_records column.
 * Fields derived from: .factory/planning/tasks.md T057, PRD-notification-system.md
 */
export class Migration20260611120000AddEmailConfigsDnsRecords extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "email_configs" add column if not exists "dns_records" jsonb null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "email_configs" drop column if exists "dns_records";`)
  }
}
