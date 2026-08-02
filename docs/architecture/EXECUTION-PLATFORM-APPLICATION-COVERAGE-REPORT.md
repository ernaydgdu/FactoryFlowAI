# Execution Platform — Application Layer Coverage Report

**Tarih:** 2026-08-02  
**Kapsam:** `frontend/src/application/execution-platform/`  
**Durum:** COMPLETE

---

## Modül Kapsamı (11/11)

| Modül | DTO | Mapper | Query | Command | ViewModel | App Service | Hooks |
|-------|-----|--------|-------|---------|-----------|-------------|-------|
| Execution Dashboard | ✅ | ✅ | 3 | 2 | ✅ | ✅ | 4 |
| Bundle Management | ✅ | ✅ | 4 | 13 | ✅ | ✅ | 14 |
| Operation Execution | ✅ | ✅ | 2 | 4 | ✅ | ✅ | 5 |
| Work Session | ✅ | ✅ | 2 | 4 | ✅ | ✅ | 5 |
| Daily Production Entry | ✅ | ✅ | 1 | 1 | ✅ | ✅ | 2 |
| WIP Monitoring | ✅ | ✅ | 4 | 0 | ✅ | ✅ | 4 |
| Quality Gate | ✅ | ✅ | 5 | 2 | ✅ | ✅ | 5 |
| Execution Timeline | ✅ | ✅ | 3 | 0 | ✅ | ✅ | 3 |
| Split Production | ✅ | ✅ | 2 | 1 | ✅ | ✅ | 3 |
| Execution Calendar | ✅ | ✅ | 1 | 0 | ✅ | ✅ | 1 |
| Execution Brain | ✅ | ✅ | 5 | 0 | ✅ | ✅ | 4 |

**Toplam:** 32 query | 27 command | 50 React Query hook

---

## Domain API Kapsamı

| Domain Servis | Application Modül | Kapsam |
|---------------|-------------------|--------|
| execution-platform-service | Dashboard, Daily Entry, Calendar, WIP | %100 orchestration |
| bundle-tracking-service | Bundle Management | %100 hook'lar |
| operation-execution-service | Operation Execution | %100 |
| operation-work-session-service | Work Session | %100 + rollup delegate |
| wip-query-service | WIP Monitoring | READ %100 |
| quality-gate-service | Quality Gate | %100 |
| execution-timeline-service | Timeline | READ %100 |
| split-execution-service | Split Production | %100 |
| execution-brain-query | Brain | READ ONLY %100 |
| execution-permission-policy | Shared guard | Command girişleri |

---

## Katman Sorumluluğu

| Sorumluluk | Application | Domain |
|------------|-------------|--------|
| DTO / ViewModel | ✅ | — |
| Status badge (presentation) | ✅ | — |
| Permission guard çağrısı | ✅ | Policy tanımı |
| Business Rule | — | ✅ |
| Audit event | — | ✅ |
| Aggregate rollup | — | ✅ |
| Brain hesaplama | — | ✅ |

---

## UI Bağımsızlık

Application servisleri doğrudan çağrılabilir:

```typescript
import { executionPlatformApplicationService } from '@/application/execution-platform'

executionPlatformApplicationService.dashboard.command.initializePlatform({ ... })
executionPlatformApplicationService.bundleManagement.command.issue({ ... })
```

**UI olmadan çalışır:** EVET

---

## Eksikler (UI Sprint)

- Execution Platform UI modülü henüz yok (kasıtlı)
- `queryFullState` root facade'de domain'e doğrudan delegasyon (orchestration read)
