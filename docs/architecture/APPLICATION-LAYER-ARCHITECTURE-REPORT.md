# Kepler ERP — Application Layer Architecture Report (Phase 1)

**Generated:** 2026-08-02  
**Phase:** Application Layer — Domain → UI bağlantısı  
**Status:** Phase 1 Complete

---

## Executive Summary

Kepler ERP Application Layer oluşturuldu. UI artık Domain'e **doğrudan erişmiyor** — tüm veri akışı **Application Service → React Query Hook → View** katmanından geçiyor.

| Metrik | Değer |
|--------|-------|
| Application Modül Sayısı | 9 |
| Application Service | 9 |
| DTO / Mapper Çifti | 9 |
| React Query Hook Seti | 9 |
| Referans Ekran | Product Card |
| Build | **PASS** |
| Domain Validation | **6 PASS / 4 PARTIAL / 0 GAP** |

---

## Mimari Akış

```
UI (View Only)
  ↓ useXxx() React Query Hook
Application Service
  ↓ Mapper (Domain → DTO)
Domain Service / Enterprise
  ↓
Business Logic (değişmedi)
```

### Kurallar (Uygulandı)

| Kural | Durum |
|-------|-------|
| Business Logic UI'da yok | ✅ |
| UI Domain servislerini doğrudan çağırmıyor | ✅ (8 modül) |
| UI Repository çağırmıyor | ✅ |
| UI Master Data okumuyor | ✅ |
| UI Planning Engine çağırmıyor | ✅ |
| UI Brain çağırmıyor | ✅ |
| Application Layer tek giriş noktası | ✅ |

---

## Application Layer Yapısı

```
frontend/src/application/
├── core/
│   ├── query-client.ts      # TanStack QueryClient
│   ├── query-keys.ts        # Merkezi cache key'leri
│   └── types.ts             # KpiDto, StatusBadgeDto, ...
├── product-card/            # ★ REFERANS MODÜL
│   ├── product-card.dto.ts
│   ├── product-card.mapper.ts
│   ├── product-card.application-service.ts
│   └── use-product-card.ts
├── sales-order/
├── fabric-card/
├── accessory-card/
├── warehouse/
├── production-order/
├── bom-designer/
├── mrp/
├── planning/                # Beden setleri
└── index.ts
```

---

## Modül Bağlantı Durumu

| # | Modül | Application Service | React Query | UI Sayfası | Domain Import (UI) |
|---|-------|--------------------|-------------|------------|-------------------|
| 1 | **Product Card** | ✅ | ✅ | ✅ Referans ekran (8 tab) | ❌ Yok |
| 2 | Sales Order | ✅ | ✅ | ⚠️ Mevcut orders modülü korundu | ⚠️ Kısmi |
| 3 | Fabric Card | ✅ | ✅ | ✅ cards/stock/movements | ❌ Yok |
| 4 | Accessory Card | ✅ | ✅ | ✅ cards/stock | ❌ Yok |
| 5 | Warehouse | ✅ | ✅ | ✅ inbound/outbound/count | ❌ Yok |
| 6 | Production Order | ✅ | ✅ | ✅ orders/lines/operations | ❌ Yok |
| 7 | BOM Designer | ✅ | ✅ | ✅ `/products/:id/bom` | ❌ Yok |
| 8 | MRP | ✅ | ✅ | ✅ `/planning/mrp` | ❌ Yok |

---

## Referans Ekran: Product Card

**Konum:** `frontend/src/modules/product-card/`

Product Card, Kepler ERP'nin **referans ekranı** olarak tasarlandı. Yeni ekranlar bu yapıyı takip edecek:

| Tab | İçerik |
|-----|--------|
| Genel | Müşteri, marka, sınıflandırma |
| BOM | Malzeme reçetesi + BOM Designer linki |
| Renkler | Color card atamaları |
| Beden Seti | Size matrix |
| Teknik | Kumaş, kompozisyon, operasyon rotası |
| İlişkiler | Enterprise relation graph |
| Dokümanlar | Tech pack, ölçü tablosu |
| Timeline | Yaşam döngüsü olayları |

**Veri kaynağı:** `productCardApplicationService` → Domain textile services + enterprise relations

---

## React Query Entegrasyonu

- **Paket:** `@tanstack/react-query` v5
- **Provider:** `frontend/src/app/providers.tsx`
- **Bootstrap:** `main.tsx` → `<AppProviders>`

```typescript
// Örnek kullanım (View)
const { data, isLoading } = useProductCardList()
```

---

## DTO / Mapper Prensibi

| Katman | Sorumluluk |
|--------|-----------|
| **Domain** | Business entity, hesaplama, kural |
| **Mapper** | Domain → UI-safe DTO dönüşümü |
| **DTO** | ViewModel — sadece render için |
| **Application Service** | Orchestration — domain çağrısı + map |
| **Hook** | React Query cache + loading state |
| **Component** | Pure View — hesaplama yok |

---

## Kaldırılan Anti-Pattern'ler

| Önceki | Sonraki |
|--------|---------|
| `@/domain/data/products` (UI) | `useProductCardList()` |
| `@/data/mock/fabric` | `useFabricCardList()` |
| `@/data/mock/accessories` | `useAccessoryCardList()` |
| `@/data/mock/warehouse` | `useWarehouseInbound()` |
| `@/data/mock/production` | `useProductionOrderList()` |
| `@/domain/data/orders` (MRP UI) | `useMrpList()` |
| Inline KPI hesaplama (UI) | Application Service KPI DTO |

---

## Build & Validation

```
npm run build     → PASS (0 TS errors)
Domain Validation → 6 PASS / 4 PARTIAL / 0 GAP (değişmedi)
```

Domain katmanına **entity/relation/engine eklenmedi** — yalnızca Application Layer eklendi.

---

## Sonraki Adımlar (Phase 2 Öneri)

1. Sales Order modülünü tam Application Layer'a migrate et (`modules/orders/` → `useSalesOrderList`)
2. Kalan sayfalar (Dashboard, Quality, Purchasing) Application Layer'a bağla
3. `src/data/mock/` klasörünü kaldır
4. Mutation hooks (create/update) — API geldiğinde
5. Optimistic updates + cache invalidation stratejisi

---

## Referans Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `modules/product-card/pages/ProductListPage.tsx` | Liste ekranı referansı |
| `modules/product-card/components/ProductDetailView.tsx` | Detay + tab referansı |
| `application/product-card/product-card.application-service.ts` | Service referansı |
| `docs/architecture/FOUNDATION.md` | Mimari anayasa |
