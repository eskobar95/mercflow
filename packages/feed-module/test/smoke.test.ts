import { expect, it } from "vitest"

import { FEED_MODULE } from "../src/modules/feed"

it("exposes feed module key", (): void => {
  expect(FEED_MODULE).toBe("mercflow_feed")
})
