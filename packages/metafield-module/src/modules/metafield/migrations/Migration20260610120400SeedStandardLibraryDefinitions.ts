import { Migration } from "@medusajs/framework/mikro-orm/migrations"

import {
  METAFIELD_LIBRARY_NAMESPACE,
  STANDARD_LIBRARY_SEEDS,
  seedValidations,
} from "../standard-library-seeds"

/**
 * MIGRATION DECISION LOG
 * Reason: T040 / PRD-metafields M003 — seed MercFlow standard definition library for skincare + fashion verticals.
 * Changes: Idempotent INSERT into metafield_definitions with store_id NULL, is_standard true, mercflow_library namespace.
 * Reversible: Yes — down() deletes seeded rows by fixed library IDs.
 * Fields derived from: ADR-008, PRD-metafields J003, .factory/planning/tasks.md T040
 */
export class Migration20260610120400SeedStandardLibraryDefinitions extends Migration {
  override async up(): Promise<void> {
    for (const seed of STANDARD_LIBRARY_SEEDS) {
      const validationsJson = JSON.stringify(seedValidations(seed.vertical))
      const description = seed.description === null ? "NULL" : `'${escapeSql(seed.description)}'`

      this.addSql(
        `INSERT INTO "metafield_definitions" (` +
          `"id", "store_id", "owner_type", "namespace", "key", "name", "description", "type", ` +
          `"validations", "pinned_position", "is_required", "is_primary", "category_constraint_id", "is_standard", ` +
          `"created_at", "updated_at"` +
          `) VALUES (` +
          `'${seed.id}', NULL, '${seed.owner_type}', '${METAFIELD_LIBRARY_NAMESPACE}', '${seed.key}', ` +
          `'${escapeSql(seed.name)}', ${description}, '${seed.type}', '${validationsJson}'::jsonb, ` +
          `${seed.pinned_position === null ? "NULL" : seed.pinned_position}, false, ${seed.is_primary}, NULL, true, ` +
          `now(), now()` +
          `) ON CONFLICT ("id") DO UPDATE SET ` +
          `"name" = EXCLUDED."name", ` +
          `"description" = EXCLUDED."description", ` +
          `"type" = EXCLUDED."type", ` +
          `"validations" = EXCLUDED."validations", ` +
          `"pinned_position" = EXCLUDED."pinned_position", ` +
          `"is_primary" = EXCLUDED."is_primary", ` +
          `"is_standard" = EXCLUDED."is_standard", ` +
          `"updated_at" = now();`
      )
    }
  }

  override async down(): Promise<void> {
    const ids = STANDARD_LIBRARY_SEEDS.map((seed) => `'${seed.id}'`).join(", ")
    this.addSql(`DELETE FROM "metafield_definitions" WHERE "id" IN (${ids});`)
  }
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}
