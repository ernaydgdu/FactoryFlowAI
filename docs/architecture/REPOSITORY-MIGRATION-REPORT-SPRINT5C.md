# Repository Migration Report — Sprint 5c

**Generated:** 2026-08-02

---

## Migrated Domain Services

| Service | Port(s) Used | Module Store Removed |
|---------|--------------|---------------------|
| `audit-service.ts` | `auditLog` | ✅ (Sprint 5c start) |
| `timeline-service.ts` | `orderTimeline` | ✅ |
| `approval-service.ts` | `approvalWorkflows` | ✅ |
| `versioning-service.ts` | `entityRevisions` | ✅ |
| `event-bus.ts` | `outbox` (legacy event methods) | ✅ eventStore |
| `lifecycle-service.ts` | `productionOrders`, `productionDailyEntries` | ✅ lifecycleStore, dailyEntryStore |
| `execution-platform-service.ts` | `executionContexts`, `operationDailyEntries` | ✅ contextStore, dailyEntryStore |
| `bundle-tracking-service.ts` | `bundles` | ✅ bundleStore, ticketStore |
| `operation-execution-service.ts` | `executionContexts.operationExecutions` | ✅ operationStore |
| `operation-work-session-service.ts` | `workSessions` | ✅ sessionStore |
| `quality-gate-service.ts` | `qualityGateEvaluations` | ✅ gateStore |
| `execution-timeline-service.ts` | `executionEvents` | ✅ timelineStore |
| `wip-query-service.ts` | `wipTransfers`, `wipPositions` | ✅ wipPositionStore, wipTransferStore |
| `split-execution-service.ts` | `splitExecutions` | ✅ splitStore |

---

## Access Pattern

All migrated services use:

```typescript
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '../ports/persistence/persistence-registry'

function repo() {
  return requireUnitOfWork().<portName>
}
```

Bootstrap: `ensurePersistenceBootstrapped()` in `providers.tsx` registers `InMemoryUnitOfWorkFactory`.

---

## Port Sync Migration

All 35 `Promise<>` return types removed from port interfaces. Base `repository.base.ts` sync contract is now consistent across all 31 ports.

---

## Remaining Non-Port Store

| Location | Store | Reason |
|----------|-------|--------|
| `execution-platform-service.ts` | `calendarStore` | No P-port for ProductionCalendarSlot (out of Sprint 5c scope) |
| `event-bus.ts` | `handlers` Map | Non-persistent in-process handler registry (by design) |
