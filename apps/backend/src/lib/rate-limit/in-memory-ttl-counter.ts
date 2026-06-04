type WindowEntry = {
  count: number
  windowStartMs: number
}

export type RateLimitConsumeResult = {
  allowed: boolean
}

export class InMemoryTtlRateLimitStore {
  private readonly entries = new Map<string, WindowEntry>()

  constructor(private readonly windowMs: number) {}

  consume(key: string, limit: number): RateLimitConsumeResult {
    const now = Date.now()
    let entry = this.entries.get(key)

    if (!entry || now - entry.windowStartMs >= this.windowMs) {
      entry = { count: 0, windowStartMs: now }
      this.entries.set(key, entry)
    }

    if (entry.count >= limit) {
      return { allowed: false }
    }

    entry.count += 1
    return { allowed: true }
  }

  clear(): void {
    this.entries.clear()
  }
}
