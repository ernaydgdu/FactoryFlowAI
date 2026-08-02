# Kepler ERP — Textile ERP Domain Deepening

## Volume 1 — Foundation Extension

### Chapter 2 — Professional Textile Domain Model

> **Status:** Active — v1  
> **Authority:** Extends `docs/architecture/FOUNDATION.md`; does not override constitutional rules.  
> **Path:** `docs/architecture/TEXTILE-ERP-DOMAIN.md`  
> **Related:** `VALIDATION-REPORT-CHAPTER-1.md`, `KEPLER-BRAIN-FOUNDATION.md`

---

## Amaç

Kepler ERP'nin hedefi yalnızca validation senaryolarını PASS etmek değildir. Bu chapter, mevcut domain modüllerini **gerçek tekstil operasyonlarına** yaklaştırır.

**P1 validation gap'leri bilinçli olarak bekletildi.** Öncelik: mevcut modülleri derinleştirmek, yeni ekran eklemek değil.

---

## Constitutional Kurallar (Değişmez)

| Kural | Uygulama |
|-------|----------|
| Business logic yalnızca Domain | `frontend/src/domain/services/textile/` |
| UI yalnızca Domain servislerini çağırır | Bu phase'de UI değişmedi |
| Hardcoded string yok | Tüm lookup'lar `master-data/textile-lookups.ts` |
| Master Data = SSOT | `master-data/mock-data.ts`, `repository.ts` |
| Yeni engine/framework yok | Mevcut Cost Engine, Brain Knowledge Engine beslendi |
| Architecture Foundation uyumu | %100 |

---

## Domain Katmanı Haritası

```
domain/
├── types/textile-erp.ts          ← Profesyonel tekstil tipleri
├── master-data/
│   ├── textile-lookups.ts        ← Gender, Fit, Wash, GTIP, vb.
│   ├── mock-data.ts              ← Color Cards, Warehouse hierarchy
│   └── types.ts                  ← ColorCard, Warehouse genişletmeleri
├── services/textile/
│   ├── product-card-service.ts   ← 1. Product Card
│   ├── color-management-service.ts ← 2. Color Management
│   ├── size-matrix-service.ts    ← 3. Size Management
│   ├── bom-service.ts            ← 4. BOM
│   ├── fabric-management-service.ts ← 5. Fabric
│   ├── accessory-management-service.ts ← 6. Accessory
│   ├── warehouse-hierarchy-service.ts ← 7. Warehouse
│   ├── purchase-chain-service.ts ← 8. Purchase Flow
│   ├── production-tracking-service.ts ← 9. Production
│   ├── textile-costing-service.ts ← 10. Costing
│   └── textile-entity-registry.ts ← 11. Brain feed
├── data/products.ts              ← TextileProductCard → legacy adapter
└── brain/engines/knowledge-engine.ts ← Entity snapshot entegrasyonu
```

---

## 1. Product Card (Ürün Kartı)

**Merkez entity.** Her sipariş bir Product Card'a bağlı kalır.

### Alanlar (master data referanslı)

| Alan | Kaynak |
|------|--------|
| Ürün Kodu, İç/Müşteri Model Kodu | `TextileProductCard.code`, `internalModelCode`, `customerModelCode` |
| Marka, Buyer, Sezon, Koleksiyon | `brandRepository`, `buyerRepository`, `seasonRepository`, `collectionRepository` |
| Ürün Grubu / Alt Grup | `productGroupRepository`, `subProductGroupRepository` |
| Fit, Kalıp, Gender, Age Group | `textile-lookups.ts` → ref objeler |
| Country Of Origin, GTIP | `countryRepository`, `GTIP_CODES` |
| Yıkama, Baskı, Nakış | `WASH_TYPES`, `PRINT_TYPES`, `EMBROIDERY_TYPES` |
| Kumaş Yapısı, Ana/Yardımcı Kumaş | `fabricStructureId`, `mainFabricStockCardId`, `auxFabricStockCardIds` |
| Teknik Föy, Ölçü Tablosu, Revizyon, Durum | `technicalSheetRef`, `measurementChartId`, `revisionNo`, `status` |

### Servis

- `buildTextileProductCard()` — master data'dan zengin kart üretir
- `toLegacyProductCard()` — mevcut UI/validation uyumluluğu
- `data/products.ts` — `TEXTILE_PRODUCT_CARDS` + `PRODUCT_CARDS` (legacy)

---

## 2. Color Management

Renk artık yalnızca text değil; **Color Card entity**.

| Alan | Tip |
|------|-----|
| Color Code | string |
| Pantone | string |
| Müşteri / İç Renk Kodu | string |
| Açıklama | string |
| RGB | `{ r, g, b }` |
| HEX | string |
| Durum | `MasterEntityStatus` |

**Servis:** `color-management-service.ts`  
- `toColorCardEntity()`, `getAllColorCards()`, `buildProductColorAssignments()`  
Siparişler Color Card ID üzerinden renk ataması yapar.

---

## 3. Size Management

**Size Set** profesyonelleştirildi.

| Kategori | Örnek |
|----------|-------|
| LETTER | XS, S, M, L, XL, XXL, 3XL |
| NUMERIC | 29, 30, 31, 32, 33, 34, 36, 38 |
| BABY | 0-3M, 3-6M, 6-9M, 9-12M |

**Servis:** `size-matrix-service.ts`  
- `buildColorSizeMatrix()` — Renk × Beden matrisi  
- `computeMatrixTotals()` — satır/sütun/toplam adet  
Gerçek ERP mantığında matrix hesaplama.

---

## 4. BOM (Bill of Materials)

Gerçek üretim reçetesi modeli.

| Satır Alanı | Hesaplama |
|-------------|-----------|
| Malzeme, Kategori, Birim | Stock Card + master data |
| Sarfiyat, Fire % | Input |
| Net Sarfiyat | `consumption × (1 + wastePercent/100)` |
| Gerçek Sarfiyat | `calcActualConsumption()` entegrasyonu |
| Alternatif Malzeme, Depo, Tedarikçi | Ref alanlar |
| Lead Time, Lot Takibi | boolean + gün |
| Zorunlu / Opsiyonel | `BomLineRequirement` |

**Servis:** `bom-service.ts` — `buildBillOfMaterials()`, `validateBom()`, `calculateBomRequirement()`

---

## 5. Fabric Management

Kumaş kartları stock card üzerine zenginleştirildi.

| Alan | Açıklama |
|------|----------|
| Kumaş Tipi, Kompozisyon | master data ref |
| Gramaj, En, Çekme, Likra % | teknik spec |
| Lot, Top No, Parti | izlenebilirlik |
| Kalite | A / B / C / Reject |
| Tedarikçi, Depo | ref |

**Servis:** `fabric-management-service.ts` — `toFabricCard()`, `getAllFabricCards()`

---

## 6. Accessory Management

Kategori bazlı dinamik alanlar.

| Kategori | Özel Alanlar |
|----------|--------------|
| FERMUAR (ZIPPER) | Uzunluk, Tip, Yön, Renk, Marka |
| DÜĞME (BUTTON) | Çap, Delik, Malzeme, Kaplama |
| İPLİK (THREAD) | Tex, Ne, Cone, Renk |
| ETİKET (LABEL) | Dokuma, Baskı, Katlama |

**Servis:** `accessory-management-service.ts` — `getAccessoriesByCategory()`, kategori-spesifik attribute parser

---

## 7. Warehouse Hierarchy

Depolar hiyerarşik yapıda.

```
Ana Hammadde
├── Ana Kumaş
└── Ana Aksesuar
Kesimhane
Atölye A / B / C
Yıkama
Kalite
Mamül
İade / Fire / Hurda
```

**Servis:** `warehouse-hierarchy-service.ts`  
- `buildWarehouseHierarchy()` — parentId tree  
- `getWarehousePath()` — breadcrumb  
Tüm hareketler **Stock Ledger** üzerinden devam eder (BR-01..BR-14).

---

## 8. Purchase Flow

Tam tedarik zinciri modeli:

```
MRP → Purchase Request → Purchase Order → Partial Receipt
  → Warehouse Receipt → Reservation → Consumption → Remaining Stock
```

**Servis:** `purchase-chain-service.ts`  
- `tracePurchaseChain(materialId)` — tek malzeme zinciri  
- `traceAllMaterialChains(productCardId)` — ürün bazlı tüm zincirler  
**Not:** Partial Receipt BR-02b P1'de bekletildi; trace modeli hazır.

---

## 9. Production Tracking

Üretim emri artık yalnızca adet değil.

| Metrik | Açıklama |
|--------|----------|
| Plan / Gerçek / Fire / Eksik / Rework | adet kırılımı |
| 2. Kalite / Tamir | kalite adımları |
| Operasyon ilerlemesi | operasyon bazlı % |
| Hat, Operatör, Makine, Atölye | kaynak ataması |
| Kapasite, OEE, Verim | performans |

**Servis:** `production-tracking-service.ts` — `buildProductionTracking()`

---

## 10. Costing

Tam kırılımlı maliyet modeli.

| Kalem | Entegrasyon |
|-------|-------------|
| Kumaş, Aksesuar, İşçilik | BOM + stock fiyat |
| Yıkama, Nakış, Baskı, Paketleme | operasyon maliyetleri |
| Lojistik, Komisyon | overhead |
| FOB, CM | export pricing |
| Karlılık, Brüt/Net Kar | margin analizi |

**Servis:** `textile-costing-service.ts`  
- `calculateTextileCostBreakdown()` — mevcut Cost Engine ile entegre  
- `simulateCostWithFabricIncrease()` — kumaş şok simülasyonu

---

## 11. Kepler Brain Entegrasyonu

Yeni Brain özelliği eklenmedi. Mevcut Brain beslendi.

| Bileşen | Değişiklik |
|---------|------------|
| `textile-entity-registry.ts` | Tüm textile entity snapshot'ları toplar |
| `knowledge-engine.ts` | PRODUCT node'larına textile entity edge'leri ekler |
| Knowledge Graph | Color, Size, BOM, Fabric, Accessory, Warehouse node'ları |

`collectTextileEntitySnapshots()` — Brain'in daha doğru analiz yapması için otomatik entity feed.

---

## Export Stratejisi

`domain/index.ts` — çakışma önleme:

| Legacy (`calculations.ts`) | Textile (alias) |
|----------------------------|-----------------|
| `computeMatrixTotals` | `computeTextileMatrixTotals` |
| `enrichBomLine` | textile `bom-service` (doğrudan export yok) |

Textile servisler explicit named export ile dışa açılır; wildcard re-export kullanılmaz.

---

## Validation Durumu (Post-Deepening)

| Metrik | Değer |
|--------|-------|
| PASS | 6 (S1, S2, S3, S7, S9, S10) |
| PARTIAL | 4 (S4, S5, S6, S8) — P1 bekletildi |
| GAP | 0 |
| Business Rules | 14 |
| Build | ✅ PASS |

P0 senaryoları textile domain deepening sonrası bozulmadı.

---

## Sonraki Adımlar (Önerilen)

1. **UI professionalization** — mevcut ekranlarda textile servislerini kullan
2. **Stock card enrichment** — fabric attribute'ları demo data'ya ekle
3. **Measurement chart** — ölçü tablosu demo verisi
4. **ui-options.ts SSOT cleanup** — FITS/WASH_TYPES tekilleştir
5. **Brain master-data adapter** — textile registry fragment payload
6. **P1 gaps** — kullanıcı onayı ile (S4 EXF, S5 redistribution, S6 machine, S8 commodity)

---

## Referans Komutlar

```bash
# Build
cd frontend && npm run build

# Validation
npx tsx -e "
import { runAllTextileValidations, TEXTILE_VALIDATION_SUMMARY } from './src/domain/validation/textile-factory-validation.ts';
runAllTextileValidations();
console.log(TEXTILE_VALIDATION_SUMMARY);
"
```
