import { describe, expect, it } from "vitest"

import { createInitialProvisioningJobState } from "../src/lib/platform-provisioning/constants"

describe("platform provisioning job state", () => {
  it("creates nine visible provisioning steps", () => {
    const state = createInitialProvisioningJobState("job-1")

    expect(state.steps).toHaveLength(9)
    expect(state.status).toBe("queued")
    expect(state.artifacts.sales_channel_id).toBeNull()
  })
})
