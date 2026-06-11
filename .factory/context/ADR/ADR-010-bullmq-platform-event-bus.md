# ADR-010 — BullMQ as Platform-Wide Event Bus (replaces Medusa's event bus)

**Date:** 2026-06-11
**Status:** accepted
**Deciders:** Nicklas Eskou, MercFlow tech lead
**Context:** /align session June 2026

---

## Context

Medusa's default event bus (`@medusajs/event-bus-redis`) is a Redis pubsub system — fire-and-forget. No retry, no dead-letter queue, no job observability. For a multi-tenant SaaS where order confirmations, subscription renewals, and feed invalidations must be reliably processed, this is insufficient.

Two options were evaluated:

**Option A — Parallel:** Keep Medusa's event bus. Add BullMQ alongside it. MercFlow subscribers listen on Medusa events and re-publish to BullMQ queues. Medusa core untouched.

**Option B — Replace:** Implement a custom Medusa event bus module (`packages/mercflow-event-bus/`) that satisfies Medusa's `IEventBusService` interface but uses BullMQ internally. All Medusa events become BullMQ jobs.

---

## Decision

**Option B — Replace Medusa's event bus with BullMQ.**

Rationale:
- Single event system: one place to observe, monitor, and alert on all async operations
- No double-hop (Medusa event → subscriber → re-enqueue): events are jobs from the start
- Retry and DLQ apply to all Medusa events uniformly — no special-casing per subscriber
- Observable in Platform Console (BullBoard or custom) across all queues
- BullMQ already in stack via Redis (no new infrastructure)

---

## Implementation

```
packages/mercflow-event-bus/
├── src/
│   ├── service.ts          implements IEventBusService
│   ├── queue-registry.ts   named queues per domain
│   └── index.ts
```

Medusa `medusa-config.ts`:
```ts
modules: [
  {
    resolve: "@mercflow/event-bus",  // replaces @medusajs/event-bus-redis
  }
]
```

Queue naming convention (all prefixed `mercflow:`):
- `mercflow:notifications` — transactional emails
- `mercflow:subscriptions` — renewal checks, Stripe charges
- `mercflow:feed-invalidation` — Google Shopping XML regeneration
- `mercflow:sitemap` — sitemap cache invalidation
- `mercflow:webhooks` — Stripe + Shipmondo processing

Worker: separate process `apps/worker/` — own entrypoint, same monorepo, independent scaling.

---

## Scope and enforcement

**All async operations go through BullMQ.** No module may call external services (SES, Stripe, Shipmondo) synchronously in an HTTP request handler or fire-and-forget event subscriber.

**Enforcement:** Code review checklist — reviewer must verify that any new event subscriber only enqueues a BullMQ job; all heavy logic lives in `apps/worker/`.

`rg "sendEmail\|stripe\.charges\|shipmondo" apps/backend/src/subscribers/` must return 0 direct calls.

---

## Consequences

**Gains:**
- All async operations have retry + DLQ + observability
- Platform Console can show real-time queue health across all MercFlow operations
- Worker scales independently from HTTP server

**Accepted tradeoffs:**
- Custom event bus module must be maintained in the fork alongside Medusa upgrades
- If `IEventBusService` interface changes in a future Medusa version, the custom module needs updating
- Worker process adds one more service to Docker Compose / Kubernetes

---

## How to fix if violated

- **Synchronous SES/Stripe/Shipmondo call in HTTP handler:** Extract to a worker processor. HTTP handler should only enqueue the job and return 202.
- **Fire-and-forget Medusa subscriber doing heavy work:** Move logic to `apps/worker/` processor; subscriber becomes a one-liner that calls `queue.add(...)`.
