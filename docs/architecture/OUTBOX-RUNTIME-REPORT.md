# Outbox Runtime Report

**Sprint:** 6C — Persistence Constitution Runtime  
**Status:** ✅ COMPLETE  
**Generated:** 2026-08-02

---

## 1. Amaç

Domain Event → Outbox → Worker → Consumer akışını runtime'da uygulamak. Consumer'lar commit öncesi çalışmamalı.

---

## 2. Akış

```
Command TX
  ├── Domain writes (aggregate/stream)
  ├── outbox.enqueue()          ← TX içi
  └── commit()
        ↓
Post-commit flush
  └── processOutboxBatch()
        ├── brain
        ├── dashboard
        ├── notification
        ├── digital-twin
        ├── wip-refresh
        └── ai-memory
```

---

## 3. Bileşenler

| Bileşen | Konum |
|---------|-------|
| Outbox enqueue (domain) | `domain/platform/services/outbox-scheduler.ts` |
| Outbox repo | `infrastructure/.../outbox/domain-event-outbox.in-memory.repository.ts` |
| Event → handler mapping | `infrastructure/persistence/outbox/outbox-event-mapping.ts` |
| Handler dispatch | `infrastructure/persistence/outbox/outbox-handlers.ts` |
| Worker | `infrastructure/persistence/outbox/outbox-worker.ts` |
| Bootstrap wiring | `infrastructure/persistence/bootstrap.ts` |

---

## 4. Handler Registry

| Handler | Worker action | Eski command-path |
|---------|---------------|---------------------|
| `brain` | MD brain stream write; execution ingest marker | `publishMasterDataBrainEvent()` direct |
| `dashboard` | Invalidation marker (query-time rebuild) | Sync dashboard reads in commands |
| `notification` | `notifyWatchers()` | `lifecycle-service`, `platform-orchestrator` subscribe |
| `digital-twin` | Invalidation marker | Sync twin in command path |
| `wip-refresh` | `rebuildWipIndex()` | Sync WIP in command path |
| `ai-memory` | `recordFromDomainEvent()` | `platform-orchestrator` subscribe |

---

## 5. publishEvent Değişikliği

**Önce:** `publishEvent()` → outbox store + sync `subscribe()` handlers  
**Sonra:** `publishEvent()` → `outbox.enqueue()` only; worker post-commit dispatch

`platform-orchestrator` subscribe handlers kaldırıldı.

---

## 6. TX Dışı Enqueue

Bootstrap/seed path'lerinde TX yok → `setOutboxImmediateDispatch()` immediate worker flush.

---

## 7. Doğrulama

| Kontrol | Durum |
|---------|-------|
| `outbox.enqueue()` TX içi | ✅ |
| Worker TX guard | ✅ `isTransactionActive()` throw |
| `markPublished` / `markFailed` | ✅ |
| Idempotent batch processing | ✅ claimPending → dispatch → mark |

---

## 8. Sonuç

**Outbox runtime: OPERATIONAL** — Constitution §4 outbox pattern InMemory'de uygulanıyor.
