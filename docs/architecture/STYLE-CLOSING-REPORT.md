# Style Closing Report — GAP Analysis

**Generated:** 2026-08-03  
**Scope:** Product/Style lifecycle termination vs Tier-1 textile ERP  
**Baseline:** Kepler frontend + domain + locked PRD Modules 1–7

---

## Executive Summary

Kepler'de style/product kapanışı **tasarım seviyesinde parçalı**, **operasyonel closing modülü yok**. `ProductCard.status = 'Kapalı'` ve sipariş `productionStatus = 'Sevk Edildi'` demo alanları var; bunlar **Production Completed ile biten bir yaşam döngüsü değil**. Tier-1 ERP'lerde style close, çok aşamalı **pre-close checklist + hard block + archive + read-only** pattern'i kullanır.

| Alan | Kepler | Tier-1 beklentisi |
|------|--------|-------------------|
| Style Close aggregate | ❌ Yok | ✅ StyleClose / OrderClose entity |
| Pre-close kontroller | ❌ Yok | ✅ 10+ blocking rule |
| Archive + Read Only | ⚠️ Constitution'da status | ❌ Runtime yok |
| Closing Dashboard | ❌ Yok | ✅ Standart |

---

## Mevcut Durum

| Bileşen | Konum | Gerçeklik |
|---------|-------|-----------|
| Product Card `Kapalı` status | `domain/types/textile-erp.ts` | Demo seed only |
| Order production stages | `orders.ts` packingStatus, shippingStatus | UI stage badge |
| `ShipmentCompleted` event | `event-bus.ts` | Event tanımlı; close workflow yok |
| EXF / TNA gates | PRD Module 2 | Locked design; Kepler UI kısmen mock |
| Product Card relation → Invoice | `sales-order-relations.ts` | Stub when `Sevk Edildi` |

**Kritik gap:** Üretim tamamlandı ≠ Style Closed. Kepler'de bu ayrım yok.

---

## Hedef Lifecycle (Tier-1 Model)

```
Production Complete
  → Final QC Complete
  → Packing Complete
  → Shipment Complete
  → Commercial Invoice Complete
  → Cost Calculation Complete
  → Margin Finalized
  → [Pre-close checks PASS]
  → Style Close
  → Archive
  → Read Only Mode
```

---

## Style Kapanmadan Önce Zorunlu Kontroller

### A. Operasyonel kapanışlar (soft gate → hard gate)

| # | Kontrol | Veri kaynağı (hedef) | Kepler today | Block seviyesi |
|---|---------|---------------------|--------------|----------------|
| 1 | **Production Complete** | Tüm PO'lar `Completed/Cancelled`; açık UE yok | ⚠️ `productionStatus` mock | P0 Hard |
| 2 | **Final Quality Complete** | Final inspection AQL Pass veya waived | ⚠️ Demo QC list | P0 Hard |
| 3 | **Packing Complete** | Planlanan adet = paketlenen adet; açık koli yok | ❌ Demo kartlar | P0 Hard |
| 4 | **Shipment Complete** | EXF + sevkiyat kaydı `Delivered/Closed` | ⚠️ Mock shipping | P0 Hard |
| 5 | **Commercial Invoice Complete** | CI issued + matched PO qty | ❌ Stub only | P0 Hard |
| 6 | **Cost Calculation Complete** | Actual cost posted | ⚠️ Formula demo | P1 Hard |
| 7 | **Margin Calculation** | Final margin locked vs plan | ⚠️ Static margin % | P1 Soft→Hard |

### B. Açık kayıt kontrolleri (hard block)

| # | Kontrol | Kural | Kepler today |
|---|---------|-------|--------------|
| 8 | **Open Purchase Order** | PO line `Open/Partial` = 0 veya exception approved | ❌ |
| 9 | **Open Production Order** | PO status ∉ {Draft, In Production, On Hold} | ⚠️ Lifecycle var; close check yok |
| 10 | **Open Quality Issue** | Claim/CAPA/NCR açık = 0 | ❌ |
| 11 | **Open Warehouse Transaction** | Reserved/pending dispatch/inbound draft = 0 | ❌ |
| 12 | **Open Financial Transaction** | Unposted invoice, payment, DN/CN draft = 0 | ❌ |

### C. Kapanış aksiyonları

| # | Adım | Davranış | Kepler today |
|---|------|----------|--------------|
| 13 | **Style Close** | `ProductCard.status → Kapalı`; SO read-only | ❌ |
| 14 | **Archive** | Cold storage flag; search index retained | ❌ |
| 15 | **Read Only Mode** | Mutation API 403; UI edit disabled | ❌ |

---

## Önerilen StyleClose Aggregate (tasarım — implementasyon yok)

```typescript
// Konsept
StyleCloseChecklist {
  productCardId | salesOrderId
  checks: CloseCheck[]  // name, status: Pass|Fail|Waived, blocker: boolean
  closedAt?, closedBy?, waiverApprovals[]
}
```

**SSOT:** Style close **Sales Order veya Style** seviyesinde tetiklenir; Product Card teknik SSOT olarak `Kapalı` alır.

---

## PRD Uyumu

- PRD Module 2: EXF gate SSOT — close checklist EXF'yi **duplicate etmemeli**, consume etmeli
- PRD Module 6: Post-EXF shipment SSOT — Shipment Complete kontrolü Module 6 entity'den
- Database spec: `status = Archived/Closed` pattern mevcut — Kepler runtime'a taşınmamış

---

## Öncelik

| ID | Gap | Priority |
|----|-----|----------|
| SC-P0-01 | StyleClose aggregate + checklist engine | P0 |
| SC-P0-02 | Hard block: open PO/UE/QC/WH | P0 |
| SC-P0-03 | Close → Archive → Read Only pipeline | P0 |
| SC-P1-01 | Cost/Margin close integration | P1 |
| SC-P1-02 | Waiver approval workflow | P1 |
| SC-P2-01 | Multi-style order partial close | P2 |

---

## Sonuç

Style Closing Kepler'in **en büyük Tier-1 gap'lerinden biri**. Mevcut sistem production complete ile lifecycle'ı sonlandırıyor gibi görünse de **formal close, checklist, archive ve read-only yok**.
