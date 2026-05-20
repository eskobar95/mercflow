import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: Notion task — connector-module foundation: store encrypted connector credentials and structured logs.
 * Changes:
 *   - New table: connector_config (DML: ConnectorConfig)
 *   - New table: connector_log (DML: ConnectorLog, FK connector_id → connector_config.id)
 * Reversible: Yes — down() drops tables in dependency order.
 * Generated via: SQL aligned with Medusa DML (medusa db:generate requires a live Postgres; authored to match model.define snapshot for Medusa 2.14.1).
 */
export class Migration20260517180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "connector_config" ("id" text not null, "type" text not null, "credentials_encrypted" text not null, "active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "connector_config_pkey" primary key ("id"));`
    )
    this.addSql(
      `alter table "connector_config" add constraint "connector_config_type_check" check ("type" in ('shipmondo', 'stripe', 'plunk', 'gtm'));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_connector_config_type_unique" ON "connector_config" ("type") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_connector_config_deleted_at" ON "connector_config" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "connector_log" ("id" text not null, "connector_id" text not null, "event" text not null, "payload_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "connector_log_pkey" primary key ("id"));`
    )
    this.addSql(
      `alter table "connector_log" add constraint "connector_log_connector_id_fk" foreign key ("connector_id") references "connector_config" ("id") on update cascade on delete cascade;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_connector_log_connector_id" ON "connector_log" ("connector_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_connector_log_deleted_at" ON "connector_log" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "connector_log" cascade;`)
    this.addSql(`drop table if exists "connector_config" cascade;`)
  }
}
