# Adapter Coverage Report — Sprint 5c

**Generated:** 2026-08-02  
**Authority:** [PERSISTENCE-CONSTITUTION.md](./PERSISTENCE-CONSTITUTION.md)

---

## Summary

| Metrik | Değer |
|--------|-------|
| Total port interfaces | 31 |
| InMemory adapters wired in UoW | 31/31 ✅ |
| Platform adapters (Sprint 5c start) | 5 (audit, timeline, approval, revision, outbox) |
| Production Order adapters (new) | 2 |
| Execution Platform adapters (new) | 9 |
| Master-data empty adapters | 15 |
| TypeScript build | PASS ✅ |

---

## Wired Adapters by Domain

### Platform (5)
| Port | Adapter | Status |
|------|---------|--------|
| `IAuditLogStreamRepository` | `audit-log.in-memory.repository.ts` | ✅ |
| `IOrderTimelineStreamRepository` | `order-timeline.in-memory.repository.ts` | ✅ |
| `IApprovalWorkflowRepository` | `approval-workflow.in-memory.repository.ts` | ✅ |
| `IEntityRevisionRepository` | `entity-revision.in-memory.repository.ts` | ✅ |
| `IDomainEventOutboxRepository` | `domain-event-outbox.in-memory.repository.ts` | ✅ |

### Production Order (2)
| Port | Adapter | Status |
|------|---------|--------|
| `IProductionOrderRepository` | `production-order.in-memory.repository.ts` | ✅ |
| `IProductionDailyEntryStreamRepository` | `production-daily-entry.in-memory.stream.repository.ts` | ✅ |

### Execution Platform (9)
| Port | Adapter | Status |
|------|---------|--------|
| `IExecutionContextRepository` | `execution-context.in-memory.repository.ts` | ✅ |
| `IBundleRepository` | `bundle.in-memory.repository.ts` | ✅ |
| `ISplitExecutionRepository` | `split-execution.in-memory.repository.ts` | ✅ |
| `IOperationDailyEntryStreamRepository` | `operation-daily-entry.in-memory.stream.repository.ts` | ✅ |
| `IOperationWorkSessionStreamRepository` | `operation-work-session.in-memory.stream.repository.ts` | ✅ |
| `IQualityGateEvaluationStreamRepository` | `quality-gate-evaluation.in-memory.stream.repository.ts` | ✅ |
| `IWipTransferStreamRepository` | `wip-transfer.in-memory.stream.repository.ts` | ✅ |
| `IExecutionEventStreamRepository` | `execution-event.in-memory.stream.repository.ts` | ✅ |
| `IWipPositionReadModel` | `wip-position.in-memory.read-model.ts` | ✅ |

### Master Data / Future (15 — empty stub)
SalesOrder, ProductCard, StockLedger, StockCard, PurchaseOrder, FabricCard, AccessoryCard, Warehouse, Workshop, ProductionLine, Customer, BrainConfig, ProductionOrderSnapshot, StockMovement, BrainDecisionMemory — wired via `EmptyAggregateInMemoryRepository` / `EmptyStreamInMemoryRepository`.

---

## Seed Method Coverage

| Port | Seed method |
|------|-------------|
| `IAuditLogStreamRepository` | `seedFromLegacyEntries` |
| `IOrderTimelineStreamRepository` | `seedFromLegacyEntries` |
| `IApprovalWorkflowRepository` | `seedFromLegacy` |
| `IEntityRevisionRepository` | `seedFromLegacy` |
| `IDomainEventOutboxRepository` | `seedFromLegacyEvents` |
| `IProductionOrderRepository` | `seedFromLegacy` |
| Stream ports (production/execution) | `seedFromLegacyEntries` |
