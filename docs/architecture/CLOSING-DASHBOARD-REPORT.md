# Closing Dashboard Report — GAP Analysis

**Generated:** 2026-08-03

---

## Executive Summary

Kepler'de **Closing Dashboard yok**. Operasyonel dashboard (`DashboardPage`) cutting/sewing/shipping KPI gösterir; **close readiness** ve **single-action close** pattern'i tanımlı değil.

**Tavsiye:** Evet — ayrı Closing Dashboard **gerekli** (Tier-1 standard, P0).

---

## Neden Ayrı Dashboard?

| Neden | Açıklama |
|-------|----------|
| Farklı persona | Export manager, finance, merchandising — production planner değil |
| Farklı metrik | Gate completion % vs daily output |
| Risk yoğunlaşması | 9 checklist dimension tek ekranda |
| Action güvenliği | CLOSE STYLE destructive — isolated UX |
| Audit | Close attempt log + waiver trail |

---

## Hedef Dashboard Bileşenleri

### Checklist panel (9 dimension)

| Gate | Veri kaynağı | Kepler ready? |
|------|--------------|---------------|
| ✓ Production Closed | PO lifecycle | ⚠️ |
| ✓ Quality Closed | Final QC + open NCR | ⚠️ |
| ✓ Warehouse Closed | FG + dispatch | ❌ |
| ✓ Shipment Closed | ShipmentRecord | ❌ |
| ✓ Financial Closed | CI + open AR/AP | ❌ |
| ✓ Cost Closed | Cost lock | ❌ |
| ✓ Claims Closed | Claim module | ❌ |
| ✓ Documents Completed | Commercial docs | ❌ |
| ✓ Archive Ready | Pre-archive validation | ❌ |

### Visual design (hedef)

- Traffic light per dimension (Pass / Fail / Waived)
- Drill-down to blocking records
- Waiver request workflow
- Timeline of close attempts

### Actions

| Action | Scope | Preconditions |
|--------|-------|---------------|
| **CLOSE STYLE** | ProductCard + related SO | All hard gates Pass or Waived |
| **CLOSE SALES ORDER** | SO + POs + shipments | SO-level checklist |
| Preview impact | Read-only dry run | Always allowed |
| Cancel close | Rollback if not archived | Admin |

Kepler: **0/3 action implemente**.

---

## Route / Nav Önerisi

```
/closing                    → Portfolio (styles ready to close)
/closing/style/:productId   → Style close dashboard
/closing/order/:orderId     → SO close dashboard
```

Navigation group: **Export & Closing** (Merchandising / Shipping yanına).

---

## Bağımlılıklar

Closing Dashboard **aggregate modül değil** — orchestration UI:

```
ClosingDashboard
  → StyleCloseChecklistService (aggregate)
  → PackingListService, ShipmentService, CostService, ClaimService, DocumentService
  → platform approval for waivers
  → archive command
```

**Sıra:** Dashboard, P0 modüllerin **son** deliverable'ı (facade).

---

## Öncelik

| ID | Gap | P |
|----|-----|---|
| CD-P0-01 | Closing Dashboard UI | P0 |
| CD-P0-02 | Checklist aggregation service | P0 |
| CD-P0-03 | CLOSE STYLE / CLOSE SO commands | P0 |
| CD-P1-01 | Waiver workflow UI | P1 |
| CD-P2-01 | Portfolio analytics (close velocity) | P2 |

---

## Sonuç

Closing Dashboard **olmadan style close operasyonel değil** — Tier-1'de P0 UX modülü.
