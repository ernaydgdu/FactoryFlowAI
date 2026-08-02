# Legacy Store Elimination Report — Sprint 5c

**Generated:** 2026-08-02

---

## Eliminated Module-Level Stores

### Platform
- ~~`timelineStore[]`~~ in `timeline-service.ts`
- ~~`workflowStore[]`~~ in `approval-service.ts`
- ~~`revisionStore[]`~~ in `versioning-service.ts`
- ~~`eventStore[]`~~ in `event-bus.ts`

### Production Order
- ~~`lifecycleStore` Map~~ in `lifecycle-service.ts`
- ~~`dailyEntryStore[]`~~ in `lifecycle-service.ts`

### Execution Platform
- ~~`contextStore` Map~~ in `execution-platform-service.ts`
- ~~`dailyEntryStore[]`~~ in `execution-platform-service.ts`
- ~~`bundleStore` Map~~ in `bundle-tracking-service.ts`
- ~~`ticketStore[]`~~ in `bundle-tracking-service.ts` → `PersistedBundle.tickets`
- ~~`operationStore` Map~~ in `operation-execution-service.ts` → `PersistedExecutionContext.operationExecutions`
- ~~`sessionStore` Map~~ in `operation-work-session-service.ts`
- ~~`gateStore[]`~~ in `quality-gate-service.ts`
- ~~`timelineStore[]`~~ in `execution-timeline-service.ts`
- ~~`wipPositionStore[]`~~ / ~~`wipTransferStore[]`~~ in `wip-query-service.ts`
- ~~`splitStore[]`~~ in `split-execution-service.ts`

---

## Centralized Storage

All eliminated stores now live in `InMemoryStoreRegistry` (`store-registry.ts`), accessed exclusively through InMemory adapters.

---

## Dual Access Path Check

| Check | Result |
|-------|--------|
| Domain services import `infrastructure/` | ❌ None |
| Services read/write both store AND port | ❌ None (eliminated) |
| Stub repos throw at runtime for wired paths | ❌ Stubs removed for active domains |

---

## Intentionally Retained

| Store | File | Justification |
|-------|------|---------------|
| `handlers` Map | `event-bus.ts` | In-process pub/sub registry, not persistence |
| `calendarStore[]` | `execution-platform-service.ts` | No port defined; deferred to Sprint 6 |
