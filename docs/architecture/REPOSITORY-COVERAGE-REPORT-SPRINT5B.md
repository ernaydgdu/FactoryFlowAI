# Repository Coverage Report — Sprint 5b

**Generated:** 2026-08-02  
**Authority:** [PERSISTENCE-CONSTITUTION.md](./PERSISTENCE-CONSTITUTION.md)

---

## Summary

| Metrik | Değer |
|--------|-------|
| Constitution catalog ports (P01–P24) | 24/24 ✅ |
| Additional AR ports (MD + Purchase) | +7 |
| **Total port interfaces** | **31** |
| Base port types | 4 (`IAggregateRepository`, `IStreamRepository`, `IReadModelRepository`, `IOutboxRepository`) |
| Unit of Work port | 1 (`IUnitOfWork` + `IUnitOfWorkFactory`) |
| TypeScript compile | PASS |

---

## Constitution Catalog Coverage (P01–P24)

| Port | Interface | File | Status |
|------|-----------|------|--------|
| P01 | `ISalesOrderRepository` | `aggregates/sales-order.repository.ts` | ✅ |
| P02 | `IProductCardRepository` | `aggregates/product-card.repository.ts` | ✅ |
| P03 | `IProductionOrderRepository` | `aggregates/production-order.repository.ts` | ✅ |
| P04 | `IProductionDailyEntryStreamRepository` | `streams/production-daily-entry-stream.repository.ts` | ✅ |
| P05 | `IProductionOrderSnapshotStreamRepository` | `streams/production-order-snapshot-stream.repository.ts` | ✅ |
| P06 | `IExecutionContextRepository` | `aggregates/execution-context.repository.ts` | ✅ |
| P07 | `IOperationDailyEntryStreamRepository` | `streams/operation-daily-entry-stream.repository.ts` | ✅ |
| P08 | `IBundleRepository` | `aggregates/bundle.repository.ts` | ✅ |
| P09 | `IOperationWorkSessionStreamRepository` | `streams/operation-work-session-stream.repository.ts` | ✅ |
| P10 | `IQualityGateEvaluationStreamRepository` | `streams/quality-gate-evaluation-stream.repository.ts` | ✅ |
| P11 | `IWipTransferStreamRepository` | `streams/wip-transfer-stream.repository.ts` | ✅ |
| P12 | `IExecutionEventStreamRepository` | `streams/execution-event-stream.repository.ts` | ✅ |
| P13 | `ISplitExecutionRepository` | `aggregates/split-execution.repository.ts` | ✅ |
| P14 | `IStockLedgerRepository` | `aggregates/stock-ledger.repository.ts` | ✅ |
| P15 | `IStockMovementStreamRepository` | `streams/stock-movement-stream.repository.ts` | ✅ |
| P16 | `IStockCardRepository` | `aggregates/stock-card.repository.ts` | ✅ |
| P17 | MD entity ports (pattern) | `aggregates/workshop.repository.ts` + 6 others | ✅ |
| P18 | `IApprovalWorkflowRepository` | `aggregates/approval-workflow.repository.ts` | ✅ |
| P19 | `IEntityRevisionRepository` | `aggregates/entity-revision.repository.ts` | ✅ |
| P20 | `IAuditLogStreamRepository` | `streams/audit-log-stream.repository.ts` | ✅ |
| P21 | `IOrderTimelineStreamRepository` | `streams/order-timeline-stream.repository.ts` | ✅ |
| P22 | `IDomainEventOutboxRepository` | `outbox/domain-event-outbox.repository.ts` | ✅ |
| P23 | `IWipPositionReadModel` | `read-models/wip-position.read-model.ts` | ✅ |
| P24 | `IBrainDecisionMemoryStreamRepository` | `streams/brain-decision-memory-stream.repository.ts` | ✅ |

---

## Additional AR Ports (Constitution §2.5 — 18 AR)

| AR | Port | File |
|----|------|------|
| PurchaseOrder | `IPurchaseOrderRepository` | `aggregates/purchase-order.repository.ts` |
| FabricCard | `IFabricCardRepository` | `aggregates/fabric-card.repository.ts` |
| AccessoryCard | `IAccessoryCardRepository` | `aggregates/accessory-card.repository.ts` |
| Warehouse | `IWarehouseRepository` | `aggregates/warehouse.repository.ts` |
| Workshop | `IWorkshopRepository` | `aggregates/workshop.repository.ts` |
| ProductionLine | `IProductionLineRepository` | `aggregates/production-line.repository.ts` |
| Customer | `ICustomerRepository` | `aggregates/customer.repository.ts` |

---

## Convention Compliance

| Rule | Status |
|------|--------|
| `findById` on all aggregates | ✅ |
| `findByCode` on coded aggregates (`ICodedAggregateRepository`) | ✅ |
| `cursor` pagination — no `findAll()` | ✅ |
| `save` + `expectedVersion` via `SaveOptions` | ✅ |
| Stream: `append`, `stream`, `cursor`, `latest`, `exists` | ✅ |
| No business logic in interfaces | ✅ |
| No SQL/ORM in interfaces | ✅ |
| No repository cross-calls | ✅ |

---

## Not Yet Covered (Sprint 5c+)

| Item | Sprint |
|------|--------|
| InMemory adapter implementations | 5c |
| Domain service Map → Port wiring | 5d |
| PostgreSQL adapter | 6 |
| Collaboration ports (Comment, Tag, Attachment, Watcher) | 6 |

**Coverage Score: 100%** (Constitution-defined scope)
