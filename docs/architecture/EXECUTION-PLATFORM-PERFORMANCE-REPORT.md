# Execution Platform — Performance Report (Application Layer)

**Tarih:** 2026-08-02

---

## React Query Tuning

| Hook Grubu | staleTime | Gerekçe |
|------------|-----------|---------|
| Dashboard | 30s | KPI güncelliği |
| WIP Monitoring | 15s | Shop floor yoğunluğu |
| Brain insight | 60s | READ ONLY analiz |
| Event catalog | Infinity | Statik catalog |
| Brain metrics list | Infinity | Statik liste |

---

## Invalidation Stratejisi

| Mutation | Invalidate |
|----------|------------|
| Bundle commands | `bundle.*` + `execution-platform` root |
| Work session | `work-session` + `operation` |
| Daily entry | `daily-entry` + root |
| Split | `split` + root |

**Risk:** Geniş invalidation shop floor yoğunluğunda refetch spike — UI sprint'te granular invalidation önerilir.

---

## Mapper Maliyeti

| Mapper | Karmaşıklık |
|--------|-------------|
| Bundle list | O(n) — düşük |
| WIP monitoring | O(n) positions — orta |
| Quality gate canProceed | O(route) — düşük |
| Brain view | Domain'de hesaplanır — Application O(1) map |

**Application Layer hesaplama yapmaz** — performans domain'de kalır.

---

## Build

| Metrik | Sonuç |
|--------|-------|
| TypeScript | PASS |
| Yeni bundle size impact | Minimal (no UI) |
| Lazy load | Application tree-shakeable |

**Performance Grade:** A-
