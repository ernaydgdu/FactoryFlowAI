# Architecture Integrity Report — Sprint 2

**Generated:** 2026-08-02  
**Scope:** Production Order Lifecycle + mevcut mimari

---

## Özet Skor

| Alan | Skor | Hedef |
|------|------|-------|
| Domain Engine Bütünlüğü | **100%** | Korunmalı |
| Sprint 2 Application Layer (yeni modül) | **100%** | 100% |
| Genel Application Layer (tüm ERP) | **~74%** | ≥95% (release) |
| Brain Adapter READ ONLY | **17/17** | 100% |
| Route Export Integrity | **57/57** | 100% |
| **Sprint 2 Modül Integrity** | **98%** | ≥95% |

---

## Domain Katmanı — Değişmeyen Engine'ler

| Engine / Servis | Durum | Sprint 2 Etkisi |
|-----------------|-------|-----------------|
| Business Rule Engine | ✅ Intact | Orchestrated (BR-03, BR-05, BR-08) |
| Planning Engine | ✅ Intact | Snapshot read |
| Stock Ledger | ✅ Intact | BR üzerinden hareket |
| Master Data | ✅ Intact | Repository read |
| Brain Kernel | ✅ Intact | +1 READ adapter |
| Digital Twin | ✅ Intact | Scenario sim — NONE side effect |
| Enterprise Domain | ✅ Intact | Dokunulmadı |
| Timeline / Audit / Watcher | ✅ Intact | Event emit |

**Yeni engine / framework:** 0

---

## Katman Sözleşmesi — Sprint 2 Modülü

```
UI (production-order-lifecycle/*)
  ↓ hooks (useProductionOrderLifecycle*)
Application (production-order-lifecycle.*)
  ↓ mapper → domain service
Domain (production-order/lifecycle-service.ts)
  ↓ mevcut engine'ler
BR / Planning / Stock / Platform / Twin
```

| Kontrol | Sonuç |
|---------|-------|
| UI → `@/domain/` import | **0 dosya** ✅ |
| UI → Application | **100%** ✅ |
| Business logic UI'da | **Yok** ✅ |
| Repository UI'dan çağrı | **Yok** ✅ |

---

## Brain Adapter Envanteri (17/17 READ ONLY)

| # | Source ID | Mode |
|---|-----------|------|
| 1 | BUSINESS_RULE_ENGINE | READ_ONLY |
| 2 | PLANNING_ENGINE | READ_ONLY |
| 3 | PRODUCTION_PLANNING | READ_ONLY |
| 4 | **PRODUCTION_ORDER_LIFECYCLE** | READ_ONLY |
| 5 | MASTER_DATA | READ_ONLY |
| 6 | ENTERPRISE_RELATIONS | READ_ONLY |
| 7 | STOCK_LEDGER | READ_ONLY |
| 8 | TIMELINE | READ_ONLY |
| 9 | APPROVAL | READ_ONLY |
| 10 | AUDIT | READ_ONLY |
| 11 | VERSIONING | READ_ONLY |
| 12 | KPI_ENGINE | READ_ONLY |
| 13 | WORKFLOW | READ_ONLY |
| 14 | LOCALIZATION | READ_ONLY |
| 15 | EVENT_BUS | READ_ONLY |
| 16 | AI_MEMORY | READ_ONLY |
| 17 | CONFIGURATION | READ_ONLY |

---

## Legacy Borç (Sprint Dışı)

Aşağıdaki sayfalar hâlâ doğrudan `@/domain/` import eder — Sprint 2 kapsamı dışında, merge öncesi migration gerekir:

- `OrderDetailPage`, legacy production pages, fabric/accessory pages (~20 sayfa)
- Bu borç genel Application Layer skorunu **~74%**'te tutar

---

## Sonuç

Sprint 2 modülü mimari kurallara **tam uyumlu**. Genel ERP Application Layer migration'ı ayrı sprint gerektirir; bu sprint kapsamında başka modüle dokunulmadı.

**Sprint 2 Integrity: PASS (≥95%)**
