import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Factory S008 / T026 — internal order notes for improved order flow (J012).
 * Changes: New table `mercflow_order_note` with store_id, order_id, content, created_by.
 * Reversible: Yes — down() drops mercflow_order_note.
 * Generation: Hand-written (agent env); aligns with Medusa DML defaults for mercflow_order_note model.
 */
export class Migration20260604230000CreateMercflowOrderNote extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "mercflow_order_note" (
        "id" text not null,
        "store_id" text not null,
        "order_id" text not null,
        "content" text not null,
        "created_by" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "mercflow_order_note_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_order_note_deleted_at" ON "mercflow_order_note" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_order_note_store_id" ON "mercflow_order_note" ("store_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_order_note_order_id" ON "mercflow_order_note" ("order_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_mercflow_order_note_store_order" ON "mercflow_order_note" ("store_id", "order_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mercflow_order_note" cascade;`)
  }
}
