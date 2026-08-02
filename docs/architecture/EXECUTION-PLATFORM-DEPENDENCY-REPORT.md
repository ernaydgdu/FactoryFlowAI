# Execution Platform — Dependency Report

**Tarih:** 2026-08-02

---

## İzin Verilen Bağımlılıklar

```
application/execution-platform/
  ├── @/application/core/types          (KpiDto, StatusBadge)
  ├── @/domain/execution-platform/*     (tek domain giriş noktası)
  └── @tanstack/react-query             (hooks only)
```

---

## Modül → Domain Haritası

| Application Modül | Domain Import |
|-------------------|---------------|
| dashboard | execution-platform-service, execution-brain-query |
| bundle-management | bundle-tracking-service |
| operation-execution | operation-execution-service |
| work-session | operation-work-session-service, operation-execution-service |
| daily-production-entry | execution-platform-service |
| wip-monitoring | wip-query-service, execution-platform-service, operation-execution-service |
| quality-gate | quality-gate-service, operation-execution-service |
| execution-timeline | execution-timeline-service |
| split-production | split-execution-service |
| execution-calendar | execution-platform-service |
| execution-brain | execution-brain-query |
| shared | execution-permission-policy, execution-types |

---

## Yasak Bağımlılık Kontrolü

| Kaynak | Yasak Hedef | Bulundu mu? |
|--------|-------------|-------------|
| Application | UI / React components | ❌ Hayır |
| Application | Repository | ❌ Hayır |
| Application | Master Data | ❌ Hayır |
| Application | Brain (direct adapter) | ❌ Hayır |
| Application | Planning engine | ❌ Hayır |
| Application | Digital Twin | ❌ Hayır |
| Application | Audit service (write) | ❌ Hayır |

---

## Dışarıya Export

```
application/index.ts → export * from './execution-platform'
```

UI katmanı yalnızca `@/application/execution-platform` import etmelidir.

---

## Circular Dependency

Application ↔ Domain: **Yok**  
Domain → Application: **Yok**

**Dependency Health:** HEALTHY
