# Async Flow Report

**Sprint:** 6C — Persistence Constitution Runtime  
**Status:** ✅ COMPLETE  
**Generated:** 2026-08-02

---

## 1. Async Side-Effect Matrisi

| Side Effect | Önceki | Şimdi | Trigger |
|-------------|--------|-------|---------|
| WIP refresh | Sync `rebuildWipIndex()` in command | Outbox `wip-refresh` handler | `scheduleWipRefresh()` |
| Brain MD feed | Sync `brainChangesRepo().publish()` | Outbox `brain` handler | `scheduleMasterDataBrainChange()` |
| Notification | Sync `notifyWatchers()` | Outbox `notification` handler | `scheduleWatcherNotification()` |
| AI Memory | Sync subscribe handler | Outbox `ai-memory` handler | Domain event enqueue |
| Dashboard | Sync query in command context | Query-time only | Outbox marker (no-op) |
| Digital Twin | Sync engine in validation | Query-time / explicit API | Outbox marker (no-op) |

---

## 2. WIP Async Detay

### Command path (async)
- `initializeExecutionPlatform()` → `scheduleWipRefresh()`
- `runCuttingAndBundlePhase()` → `scheduleWipRefresh()`
- `postOperationDailyEntry()` → `scheduleWipRefresh()`
- `execution-provisioning.ts` → `scheduleWipRefresh()`

### Worker path
- `outbox-handlers.handleWipRefresh()` → `rebuildWipIndex(productionOrderNo)`

### Query path (sync fallback)
- `getWipSummaryForOrder()` — yalnızca `PERSISTENCE_WIP_SYNC_FALLBACK=true` ise sync rebuild
- Flag: `VITE_PERSISTENCE_WIP_SYNC_FALLBACK=true` (default: false)

---

## 3. Execution Event Side Effects

`emitExecutionEvent()` artık:
1. Stream append (TX içi — P12)
2. Order timeline append (TX içi — P21)
3. Domain event enqueue via `platformPublish` (TX içi — P22)
4. `scheduleExecutionSideEffects()` (TX içi enqueue — commit sonrası dispatch)

---

## 4. Timing Garantisi

| Garanti | Uygulama |
|---------|----------|
| Consumer TX dışı | Worker post-commit only |
| Rollback → no side effects | Outbox messages in snapshot; worker not flushed |
| Immediate seed dispatch | `setOutboxImmediateDispatch()` when no TX |

---

## 5. Feature Flags

| Flag | Default | Amaç |
|------|---------|------|
| `VITE_PERSISTENCE_WIP_SYNC_FALLBACK` | `false` | Query path sync WIP rebuild |

---

## 6. Sonuç

**Async flow: OPERATIONAL** — WIP, Brain feed, Notification constitution gereği commit sonrası.
