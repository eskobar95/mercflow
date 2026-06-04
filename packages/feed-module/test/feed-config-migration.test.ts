import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import {
  MERCFLOW_FEED_CONFIG_TABLE,
} from "../src/modules/feed/migrations/Migration20260604230000CreateMercflowFeedConfig"

const migrationDir = dirname(fileURLToPath(import.meta.url))

describe("T017 mercflow_feed_config migration", (): void => {
  it("creates tenant-scoped feed config table with RLS", (): void => {
    const source = readFileSync(
      join(
        migrationDir,
        "../src/modules/feed/migrations/Migration20260604230000CreateMercflowFeedConfig.ts"
      ),
      "utf8"
    )
    expect(MERCFLOW_FEED_CONFIG_TABLE).toBe("mercflow_feed_config")
    expect(source).toContain('"store_id" text not null')
    expect(source).toContain("excluded_product_ids")
    expect(source).toContain("excluded_category_ids")
    expect(source).toContain("default_condition")
    expect(source).toContain("FORCE ROW LEVEL SECURITY")
    expect(source).toContain("tenant_isolation")
    expect(source).toContain("current_setting('app.store_id', true)")
    expect(source).toContain("MIGRATION DECISION LOG")
  })
})
