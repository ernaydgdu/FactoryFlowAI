# PostgreSQL Cutover Plan

**Date:** 2026-08-04  
**Status:** Cutover **BLOCKED**  
**Constraint:** Architecture Freeze — implement existing `IUnitOfWork` ports; do not invent new aggregate ports.  
**Default runtime:** `memory` (`getPersistenceBackend()`). Postgres must remain opt-in and throw-safe until ready.

---

## 1. Current state (objective)

| Signal | Value | Evidence |
|--------|-------|----------|
| Default backend | `memory` | `persistence-backend.ts` |
| Factory | Throws `PostgresAdapterNotReadyError` | `postgres-unit-of-work-factory.ts` |
| Ready adapters | **0** | `getPostgresCutoverReport().readyCount` |
| Catalog entries | 18 | `postgres-cutover-readiness.ts` |
| IUnitOfWork ports | ~58 | `unit-of-work.port.ts` |
| Catalog coverage | **Incomplete** (~31% of UoW keys) | Compare catalog vs UoW |
| Memory mode | Safe / full InMemoryUnitOfWork | In-memory UoW implements interface |
| Driver dependency | None (`pg` not in frontend deps) | postgres-skeleton validation |

### Catalogued statuses

| Status | Ports |
|--------|-------|
| ready | — |
| skeleton (throw-on-use) | `packingLists`, `outbox` |
| stub | `masterDataLookups`, `auditLog`, `collections` |
| missing (in catalog) | salesOrders, productCards, productionOrders, stockLedgers, purchaseOrders, goodsReceipts, shipments, exportDocumentSets, exportShipments, accountingIntegrations, costClosings, styleClosings, mrpRuns |

### Not in readiness catalog (examples)

executionContexts, bundles, splitExecutions, stockCards, approvalWorkflows, entityRevisions, purchaseRequests, rfqs, supplierQuotations, fabricCards, accessoryCards, warehouses, workshops, productionLines, customers, userAccounts, brainConfigs, all stream ports except auditLog, read models, individual collection ports, masterDataApprovals / change streams, productionCalendar, wipPositions, …

---

## 2. Cutover blockers (ordered)

1. **No runnable PG UnitOfWork** — factory hard-throws after pool configure.
2. **Zero ready repositories** — skeleton/stub still throw on every method.
3. **Incomplete readiness inventory** — planning blind spots for ~40 ports.
4. **Sync port contract vs async PG** — `async-unit-of-work-wrapper` only sketched; domain services are sync today.
5. **TX + outbox semantics** — must preserve snapshot rollback / flush-after-commit contract from `transaction-runtime.ts`.
6. **Seed strategy** — bootstrap correctly skips memory seeds when backend=postgres; PG needs migration + seed story.
7. **Tenant key** — `DEFAULT_TENANT_ID` hardwire must be resolved before multi-tenant PG (or ship single-tenant schema explicitly).

---

## 3. Target architecture (no new ports)

```
resolveUnitOfWorkFactory()
  ├─ memory → InMemoryUnitOfWork (current production path)
  └─ postgres → PostgresUnitOfWork
        implements IUnitOfWork
        uses PostgresTransactionContext
        outbox → PostgresOutboxRepository (real)
        aggregates/streams/collections → real adapters
```

**Non-goals for cutover:**
- New aggregate roots / ports
- Dual-write to memory + PG in production
- LLM or Brain schema changes

---

## 4. Phased cutover plan

### Phase A — Inventory & contract (1–2 weeks)

| Step | Deliverable | Exit criteria |
|------|-------------|---------------|
| A1 | Expand `POSTGRES_PORT_READINESS` to **every** `keyof IUnitOfWork` | Catalog completeness = 100% |
| A2 | Classify each port: ready / skeleton / stub / missing / N/A-empty | Report matches InMemory surface |
| A3 | Decide sync vs async strategy (adapter façade vs migrate domain to async) | Written ADR |
| A4 | Single-tenant schema decision documented | ADR: single-tenant v1 OR tenant_id column mandatory |

**Effort:** M–L

### Phase B — Platform spine (2–4 weeks)

Implement real PG adapters for:

1. `outbox` (must work for TX flush)
2. `auditLog` + `orderTimeline`
3. `userAccounts` + master-data lookups
4. Transaction context + migration runner wired to real driver

Exit: factory can construct UoW that passes persistence runtime validation subset (rollback/outbox) against a local Postgres.

**Effort:** XL

### Phase C — Core merchandising & inventory (4–8 weeks)

Priority order (business criticality + dependency):

1. `productCards`, `stockCards`, `salesOrders`
2. `stockLedgers` + `stockMovements`
3. `purchaseRequests` → `rfqs` → `supplierQuotations` → `purchaseOrders` → `goodsReceipts`
4. `mrpRuns`
5. Master data enterprise entities currently on lookup/collection ports

Exit: sales → MRP → PO → GR → stock path green on PG with OL + audit + outbox.

**Effort:** XL+

### Phase D — Execution & quality (4–6 weeks)

`productionOrders`, `executionContexts`, `bundles`, `splitExecutions`, work session / quality / WIP streams, calendar/WIP read models.

Exit: shop-floor + quality command smoke on PG.

**Effort:** XL

### Phase E — Logistics & closing (3–5 weeks)

`packingLists`, `shipments`, `exportDocumentSets`, `exportShipments`, `accountingIntegrations`, `costClosings`, `styleClosings`.

Note: packing-list / outbox “skeleton” files become **ready** only when methods persist for real.

**Effort:** L–XL

### Phase F — Cutover rehearsal (2–3 weeks)

| Gate | Criterion |
|------|-----------|
| F1 | `readyCount` == catalogued ports; `cutoverBlocked == false` |
| F2 | `validate:persistence` + postgres-specific integration suite PASS |
| F3 | Bootstrap integrity on postgres backend PASS |
| F4 | Module smokes on `PERSISTENCE_BACKEND=postgres` PASS |
| F5 | Memory mode still default; feature flag cutover only |
| F6 | Rollback plan: flip backend to memory / restore snapshot |

**Effort:** L

---

## 5. Acceptance criteria (cutover go/no-go)

- [ ] Every `IUnitOfWork` port has a PG adapter status `ready` (or explicitly waived with ADR)
- [ ] Factory does not throw in postgres mode
- [ ] Optimistic locking conflict path tested per aggregate
- [ ] Idempotency keys honored where domain defines them
- [ ] Outbox dispatch after commit; no dispatch inside TX
- [ ] Audit append participates in TX rollback
- [ ] Memory mode regression suite still green
- [ ] No demo/fake adapters returning empty success on write

---

## 6. Risks

| Risk | Mitigation |
|------|------------|
| Sync domain vs async PG | Thin sync façade over blocking client **or** staged async migration — decide in Phase A |
| Partial cutover (some ports PG, some memory) | Forbidden — single UoW backend per process |
| Catalog understates work | Phase A mandatory before date commitments |
| Multi-tenant later | Prefer `tenant_id` columns now even if single tenant value |

---

## 7. Immediate next actions (planning only)

1. Complete port inventory (A1–A2).
2. ADR: sync façade vs async domain.
3. Do **not** enable `PERSISTENCE_BACKEND=postgres` in any production-like environment until Phase F gates pass.
