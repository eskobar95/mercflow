import { describe, expect, it } from "vitest"

import { FEED_MODULE } from "../src/modules/feed/index"

describe("feed-module scaffold", (): void => {
  it("exports mercflow_feed module key", (): void => {
    expect(FEED_MODULE).toBe("mercflow_feed")
  })
})
