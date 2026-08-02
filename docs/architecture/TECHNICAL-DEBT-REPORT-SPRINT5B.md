# Technical Debt Report — Sprint 5b

**Generated:** 2026-08-02  
**Sprint:** 5b — Repository Port Interfaces

---

## Resolved Debt (This Sprint)

| ID | Item | Resolution |
|----|------|------------|
| TD-P01 | No formal persistence contract | 31 port interfaces + UoW |
| TD-P02 | OperationExecution separate store | Consolidated under P06 aggregate shape |
| TD-P03 | QualityGate as mutable aggregate | Downgraded to P10 stream |
| TD-P04 | No outbox formal contract | P22 `IDomainEventOutboxRepository` |
| TD-P05 | findAll() implicit in services | Banned; cursor-only in ports |

---

## Remaining Debt (Planned)

| ID | Item | Severity | Sprint | Effort |
|----|------|----------|--------|--------|
| TD-P06 | 47+ in-memory stores still active in domain services | **Critical** | 5c–5d | L |
| TD-P07 | Counter-based string IDs (`poCounter`, `bundleCounter`) | High | 5c | M |
| TD-P08 | Domain entities lack `tenantId` at runtime | High | 5c mapper | M |
| TD-P09 | `BrainConfiguration` lacks native `id` — wrapped as `& { id }` | Low | 5c | S |
| TD-P10 | 3 duplicate timeline stores (platform/execution/enterprise) | Medium | 5d | M |
| TD-P11 | Stock ledger caller-owned pattern — no global identity | High | 5d | M |
| TD-P12 | Sync event-bus fan-out vs async outbox | Medium | 5d | M |
| TD-P13 | Collaboration ports (Comment, Tag, Attachment, Watcher) undefined | Low | 6 | S |
| TD-P14 | ProductionCalendar read model port not defined | Low | 6 | S |
| TD-P15 | MD entities beyond P17 sample (Supplier, Brand, …) — same pattern repeat | Low | 6 | S |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sprint 5d domain refactor scope | Large touch surface (execution-platform) | Incremental: one service at a time |
| Persisted type ↔ legacy record mapping bugs | Data loss on adapter | Golden tests per aggregate |
| Outbox async → UI stale dashboard | UX confusion | Optimistic UI + invalidate on worker |
| Bundle/Context TX split complexity | Rollup lag | Outbox-triggered TX-2 documented |

---

## Debt Score

| Before Sprint 5b | After Sprint 5b |
|------------------|-----------------|
| Persistence contract: undefined | **Defined & locked** |
| Port interfaces: 0 | **31** |
| Implementation debt: unchanged | **Tracked with sprint owners** |

**Net:** Architecture debt significantly reduced; implementation debt unchanged until Sprint 5c.

---

## Sprint 5c Readiness

| Prerequisite | Ready |
|--------------|-------|
| Port interfaces compile | ✅ |
| Persisted aggregate shapes defined | ✅ |
| UoW port lists all repositories | ✅ |
| Constitution alignment verified | ✅ |
| Store → port mapping documented | ✅ |

**Sprint 5c (InMemory Adapter) may proceed.**
