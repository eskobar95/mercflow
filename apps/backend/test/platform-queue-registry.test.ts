import { describe, expect, it } from "vitest"

import {
  listPlatformQueueNames,
  resolvePlatformQueueDefinition,
} from "../src/lib/platform-queues/queue-registry"

describe("platform queue registry", (): void => {
  it("lists all five platform queues including provision-tenant", (): void => {
    expect(listPlatformQueueNames()).toEqual([
      "notifications",
      "subscriptions",
      "feed-invalidation",
      "sitemap",
      "provision-tenant",
    ])
  })

  it("resolves queue definitions by short name", (): void => {
    expect(resolvePlatformQueueDefinition("notifications")).toEqual({
      name: "notifications",
      queueName: "mercflow:notifications",
      dlqName: "mercflow:notifications:dead",
    })
  })

  it("returns null for unknown queue names", (): void => {
    expect(resolvePlatformQueueDefinition("unknown")).toBeNull()
  })
})
