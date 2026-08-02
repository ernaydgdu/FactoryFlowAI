# Kepler ERP — Production Planning Architecture Report (Sprint 1)

**Generated:** 2026-08-02  
**Sprint:** Sprint 1 — Production Planning Only  
**Status:** Complete

---

## Executive Summary

Kepler ERP **Production Planning** modülü tekstil fabrikası seviyesinde 10 alt modül olarak tamamlandı. Yeni engine veya framework eklenmedi; mevcut **Planning Engine**, **Termin Engine**, **Capacity Engine**, **Production Tracking Service**, **Master Data** ve **Brain** mimarisi korundu.

| Metrik | Değer |
|--------|-------|
| Alt Modül | 10 |
| Application Service Metodu | 14 |
| UI Sayfası | 10 + Layout |
| Route Prefix | `/production-planning/*` |
| Brain Knowledge Source | `PRODUCTION_PLANNING` (READ ONLY) |
| Yeni Engine | **0** |
| Build | **PASS** |
| Domain Validation | **6 PASS / 4 PARTIAL / 0 GAP** |

---

## Sprint Kapsamı

### Yapılan

- Production Planning Application Layer (DTO, Mapper, Service, React Query hooks)
- 10 alt modül UI ekranı + sub-navigation layout
- Router ve navigasyon (`Üretim Planlama` grubu) yeni rotalara yönlendirildi
- Domain read query (`production-planning-query.ts`) — Brain için SSOT
- Brain adapter — termin riski, hat gecikmesi, atölye verimliliği soruları

### Dokunulmayan (Sprint Kuralı)

| Bileşen | Durum |
|---------|-------|
| Business Rule Engine | Değişmedi |
| Planning Engine | Değişmedi |
| Brain Kernel | Yalnızca yeni READ adapter |
| Digital Twin | Değişmedi |
| Master Data | Değişmedi |
| Stock Ledger | Değişmedi |
| Diğer ERP modülleri | Değişmedi |

---

## Mimari Akış

```
UI (Production Planning Pages — View Only)
  ↓ useProductionPlanning*() React Query Hooks
Application Service (production-planning.application-service.ts)
  ↓ Mapper (Domain → DTO)
Domain Services (mevcut)
  ├── runPlanningEngine()
  ├── calculateTerminPlans()
  ├── buildProductionTracking()
  ├── capacity-engine / workshopRepository / lineRepository
  └── getOrderTimeline()

Brain (READ ONLY)
  ↓ productionPlanningAdapter
Domain Query (production-planning-query.ts)
  └── Aynı domain servisleri — Application'a bağımlılık YOK
```

---

## Alt Modüller

| # | Modül | Route | Domain Kaynağı |
|---|-------|-------|----------------|
| 1 | Production Calendar | `/production-planning/calendar` | Termin milestones + planning output |
| 2 | Production Orders | `/production-planning/orders` | SALES_ORDERS + production tracking |
| 3 | Production Schedule | `/production-planning/schedule` | Termin engine (geriye planlama) |
| 4 | Capacity Planning | `/production-planning/capacity` | Workshop / Line / Machine / Operator |
| 5 | Workshop Planning | `/production-planning/workshops` | Workshop master + load |
| 6 | Line Planning | `/production-planning/lines` | SEWING_LINE_RECORDS + lines |
| 7 | Daily Production Entry | `/production-planning/daily-entry` | Operasyonel günlük kayıtlar |
| 8 | Operation Tracking | `/production-planning/operations` | buildProductionTracking |
| 9 | Production Dashboard | `/production-planning/dashboard` | OPERATIONAL_DASHBOARD + KPI |
| 10 | Production Timeline | `/production-planning/timeline` | Kesim → Dikim → Yıkama → Kalite → Paket → Sevkiyat |

---

## Production Order Ekranı — Alan Desteği

| Alan | DTO Alanı | Kaynak |
|------|-----------|--------|
| Production Order No | `productionOrderNo` | `order.production.workOrderNo` |
| Sales Order | `salesOrderNo` | `order.orderNo` |
| Product | `productCode`, `productName` | Product Card |
| Customer | `customer` | Product / Order |
| Buyer | `buyer` | Product Card |
| Workshop | `workshop` | Master Data + tracking |
| Line | `line` | Production Line |
| Planned Qty | `plannedQty` | `order.production.plannedQty` |
| Produced Qty | `producedQty` | `order.production.producedQty` |
| Remaining Qty | `remainingQty` | Hesaplanan |
| Rework Qty | `reworkQty` | `order.production.reworkQty` |
| Reject Qty | `rejectQty` | Fire türevi |
| Second Quality Qty | `secondQualityQty` | `order.production.secondQualityQty` |
| Fire Qty | `fireQty` | `order.production.wasteQty` |
| Start Date | `startDate` | Termin SEWING milestone |
| Finish Date | `finishDate` | Termin SHIPPING milestone |
| Status | `status` | Production status badge |

---

## Production Schedule — Tekstil Planlama Mantığı

- **Geriye doğru termin planlama** (`calculateTerminPlans`) ile milestone blokları üretilir
- Her blok: aşama (Kesim, Dikim, Yıkama, Paket, Sevkiyat), plan tarihi, durum
- **Sürükle-bırak hazırlığı:** `data-draggable`, `data-order-id`, `data-stage` attribute'ları
- Görsel: sipariş bazlı yatay blok şeridi (Gantt-benzeri)

---

## Capacity Planning — Boyutlar

| Sekme | Veri Kaynağı |
|-------|--------------|
| Atölye | `workshopRepository` + currentLoad / monthlyCapacity |
| Hat | `productionLineRepository` + SEWING_LINE_RECORDS |
| Makine | `machineRepository` |
| Operatör | `employeeRepository` (Operatör rolü) |

---

## Daily Production Entry

Girilebilir / görüntülenebilir metrikler:

- Plan, Gerçek, Fire, Rework, Eksik, İkinci Kalite
- Operasyonel workflow kayıtlarından türetilir

---

## Production Timeline

Aşama zinciri (sipariş bazlı):

```
Kesim → Dikim → Yıkama → Kalite → Paket → Sevkiyat
```

`getOrderTimeline` + termin milestones birleştirilir.

---

## Production Dashboard

Gösterilen KPI ve paneller:

| Panel | İçerik |
|-------|--------|
| Günlük Üretim | Plan vs gerçek |
| Kapasite | Departman/atölye doluluk |
| Fire Özeti | Fire, rework, 2. kalite |
| Termin Riski | Geciken / riskli siparişler |
| Yoğun Atölyeler | Yüksek doluluk |
| Boş Kapasite | Kullanılmayan kapasite |

---

## Kepler Brain Entegrasyonu

**Adapter:** `domain/brain/adapters/production-planning-adapter.ts`  
**Source ID:** `PRODUCTION_PLANNING`  
**Mode:** READ ONLY

Brain'in cevaplayabildiği örnek sorular:

| Soru | Veri |
|------|------|
| "Neden Hat 3 sürekli gecikiyor?" | `explainLineDelay()` — yük %, verim, aktif siparişler |
| "Hangi atölye daha verimli?" | `getMostEfficientWorkshop()` — doluluk, boş kapasite |
| "Hangi sipariş termin riski taşıyor?" | `getTerminRiskOrders()` — risk bayrağı + kalan adet |

Domain query SSOT: `domain/production-planning/production-planning-query.ts`

---

## Dosya Yapısı

```
frontend/src/
├── application/production-planning/
│   ├── production-planning.dto.ts
│   ├── production-planning.mapper.ts
│   ├── production-planning.application-service.ts
│   └── use-production-planning.ts
├── domain/production-planning/
│   ├── production-planning-query.ts    # Brain + domain read
│   └── index.ts
├── domain/brain/adapters/
│   └── production-planning-adapter.ts
└── modules/production-planning/
    ├── layout/ProductionPlanningLayout.tsx
    └── pages/                          # 10 sayfa
```

---

## Build & Validation

### Build

```bash
cd frontend && npm run build
```

**Sonuç:** PASS — Production Planning sayfaları ayrı lazy chunk'lar olarak üretildi.

### Validation

```bash
npx tsx -e "import { runAllTextileValidations, summarizeValidation } from './src/domain/validation/textile-factory-validation.ts'; console.log(summarizeValidation(runAllTextileValidations()))"
```

| Senaryo | PASS | PARTIAL | GAP |
|---------|------|---------|-----|
| 10 gerçek fabrika senaryosu | 6 | 4 | 0 |

Production Planning değişiklikleri mevcut validation sonuçlarını bozmadı.

---

## Sonraki Adımlar (Sprint Dışı)

1. Production Schedule — gerçek drag-drop handler + termin yeniden hesaplama
2. Daily Production Entry — persist (API / command layer)
3. Dashboard — canlı websocket / shift bazlı güncelleme
4. Eski `/production/*` rotalarının kademeli emekliliği (opsiyonel)

---

## Referanslar

- [FOUNDATION.md](./FOUNDATION.md)
- [APPLICATION-LAYER-ARCHITECTURE-REPORT.md](./APPLICATION-LAYER-ARCHITECTURE-REPORT.md)
- Planning Engine: `frontend/src/domain/services/planning-engine.ts`
- Termin Engine: `frontend/src/domain/services/planning/termin-engine.ts`
