# Packing List Management Report — GAP Analysis

**Generated:** 2026-08-03

---

## Executive Summary

Kepler'de **Paketleme sayfası** (`/packaging`) demo koli kartları gösterir. **Packing List** ticari/lojistik dokümanı olarak modellenmemiş; create, onay, revizyon, barkod ve ağırlık/CBM altyapısı yok.

| Metrik | Değer |
|--------|-------|
| UI sayfası | ✅ `PackagingPage` |
| Domain entity | ⚠️ `Carton` (minimal) |
| Application layer | ❌ Yok |
| Persistence port | ❌ Yok |
| Command path | ❌ Yok |

---

## Mevcut Durum

**Entity:** `domain/types/workflows.ts`

```typescript
Carton { cartonNo, orderId, lines[{color,size,qty}], totalQty, weight, status }
// status: 'Açık' | 'Kapandı' | 'Sevk Edildi'
```

**UI:** `pages/packaging/PackagingPages.tsx` — `CARTONS` static seed, read-only expand card.

**Order detail:** `packingStatus` stage badge (`orders.ts`) — packing list entity değil.

---

## Süreç GAP Matrisi

| Süreç | Tier-1 | Kepler | Gap |
|-------|--------|--------|-----|
| Packing List Create | PL header + lines | ❌ | P0 |
| Carton Management | CRUD + status | ⚠️ Demo list | P0 |
| Carton Sequence | Auto SSCC/seq | ❌ | P0 |
| Carton Barcode | GS1-128 / Code128 | ❌ | P0 |
| Carton Label | Print template | ❌ | P1 |
| Net Weight | Per carton | ❌ (single `weight`) | P0 |
| Gross Weight | Carton + dunnage | ❌ | P0 |
| CBM | Dim → volume | ❌ | P0 |
| Carton Contents | Color/size matrix | ⚠️ Basic lines | P1 |
| Color/Size Distribution | Rollup + validation vs SO matrix | ⚠️ Display only | P0 |
| Mixed Carton | Multi-style/color rules | ❌ | P1 |
| Partial Packing | Pack < order qty | ❌ | P0 |
| Packing Revision | Version + activate | ❌ | P1 |
| Packing Approval | QA/sign-off | ❌ | P1 |

---

## Packing List ↔ Shipment İlişkisi

### Tier-1 model

```
Sales Order → Packing List(s) → Carton[] → Shipment Load Plan → Container
                     ↓
              Commercial Invoice (qty/weight SSOT)
```

### Kepler today

```
Sales Order --(mock stage)--> CARTONS[] -----> CONTAINER_PLANS[] (aggregate counts only)
         no PL document ID          no link              no carton-level load
```

| İlişki | Beklenen | Kepler |
|--------|----------|--------|
| PL → Carton | 1:N, FK | ❌ Flat seed |
| Carton → Container | N:M load assignment | ❌ `totalCartons` count only |
| PL → Commercial Invoice | Qty/weight SSOT | ❌ |
| Partial pack → partial ship | Allowed | ❌ |
| PL revision → re-load | Version lock | ❌ |

---

## Önerilen Domain Sınırları (constitution uyumlu)

| Aggregate | Port | Not |
|-----------|------|-----|
| `PackingList` | `IPackingListRepository` (yeni) | Header + status |
| `Carton` | Child veya ayrı AR | Scan-heavy → partition candidate |
| `PackingListRevision` | Platform versioning | Mevcut `versioning-service` reuse |

---

## Öncelik

| ID | Gap | P |
|----|-----|---|
| PL-P0-01 | PackingList aggregate + create/edit | P0 |
| PL-P0-02 | Carton sequence + barcode | P0 |
| PL-P0-03 | Net/gross weight + CBM | P0 |
| PL-P0-04 | SO matrix validation (partial pack) | P0 |
| PL-P0-05 | Shipment load assignment | P0 |
| PL-P1-01 | Mixed carton rules | P1 |
| PL-P1-02 | PL approval + revision | P1 |
| PL-P2-01 | Label print integration | P2 |

---

## Sonuç

Paketleme **görsel demo** seviyesinde. Tier-1 packing list management için **14/14 süreçten 12'si eksik veya stub**.
