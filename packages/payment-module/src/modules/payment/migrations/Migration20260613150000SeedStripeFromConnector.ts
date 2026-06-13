import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T080 / ADR-013 — copy legacy payment connector credentials into payment_provider_config.
 * Changes: No-op SQL marker; programmatic seeding via migrate-connector-stripe-credentials.ts at deploy when encryption keys are set.
 * Reversible: Yes — down() deletes seeded ppc_* rows.
 * Note: Fresh CI databases have no legacy connector rows; production/staging run the TS helper separately or via ops script.
 */
export class Migration20260613150000SeedStripeFromConnector extends Migration {
  override async up(): Promise<void> {
    this.addSql(`SELECT 1;`)
  }

  override async down(): Promise<void> {
    this.addSql(
      `DELETE FROM "payment_provider_config" WHERE "provider" = 'stripe' AND "id" LIKE 'ppc_%';`
    )
  }
}
