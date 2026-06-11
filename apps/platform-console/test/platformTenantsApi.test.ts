import { describe, expect, it } from "vitest"

describe("platformTenantsApi SSE parser contract", () => {
  it("parses SSE chunks into events", () => {
    const chunk = [
      'event: progress',
      'data: {"step":"store","message":"Store created","status":"done"}',
      "",
      'event: complete',
      'data: {"store_id":"store_123","publishable_api_key":"pk_test"}',
      "",
    ].join("\n")

    const events: Array<{ event: string; data: unknown }> = []
    for (const block of chunk.split("\n\n")) {
      const lines = block.split("\n")
      let eventName = "message"
      let dataLine = ""
      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim()
        } else if (line.startsWith("data:")) {
          dataLine = line.slice(5).trim()
        }
      }
      if (dataLine !== "") {
        events.push({ event: eventName, data: JSON.parse(dataLine) as unknown })
      }
    }

    expect(events).toHaveLength(2)
    expect(events[0]?.event).toBe("progress")
    expect(events[1]?.event).toBe("complete")
  })
})
