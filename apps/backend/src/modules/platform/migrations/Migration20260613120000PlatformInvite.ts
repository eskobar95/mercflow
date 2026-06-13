import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * MIGRATION DECISION LOG
 * Reason: T086 — Platform Console merchant invite foundation (PRD-tenant-onboarding.md J001, ADR-014)
 * Changes:
 *   - New enum: platform_invite_status (pending, redeemed, expired, revoked)
 *   - New table: platform_invite (email, hashed token, status, invited_by, expires_at, redeemed_at, tenant_id)
 * Reversible: Yes — down() drops platform_invite and platform_invite_status enum
 * Generated via: Hand-authored per tasks.md T086 field definitions (not a Medusa DML module)
 * Fields derived from: PRD-tenant-onboarding.md platform_invite section
 */
export class Migration20260613120000PlatformInvite extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      DO $$ BEGIN
        CREATE TYPE platform_invite_status AS ENUM (
          'pending',
          'redeemed',
          'expired',
          'revoked'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)

    this.addSql(`
      create table if not exists "platform_invite" (
        "id" text not null,
        "email" text not null,
        "token" text not null,
        "status" platform_invite_status not null default 'pending',
        "invited_by" text not null,
        "created_at" timestamptz not null default now(),
        "expires_at" timestamptz not null,
        "redeemed_at" timestamptz null,
        "tenant_id" text null,
        constraint "platform_invite_pkey" primary key ("id")
      );
    `)

    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_platform_invite_token" ON "platform_invite" ("token");`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_platform_invite_email" ON "platform_invite" ("email");`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_platform_invite_status" ON "platform_invite" ("status");`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_platform_invite_expires_at" ON "platform_invite" ("expires_at");`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "platform_invite" cascade;`)
    this.addSql(`drop type if exists platform_invite_status;`)
  }
}
