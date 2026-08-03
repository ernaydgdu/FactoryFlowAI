# Cost Closing Report — GAP Analysis

**Generated:** 2026-08-03

---

## Executive Summary

Kepler'de maliyet **hesaplama demo** var (`cost-calculator`, `textile-costing-service`); **cost closing** (variance, lock, approval) yok. Style close'un Cost/Margin Complete gate'leri çalışamaz.

---

## Mevcut Durum

| Bileşen | Konum | Tip |
|---------|-------|-----|
| `calculateOrderCost()` | `cost-calculator.ts` | Synthetic formula |
| `calculateTextileCostBreakdown()` | `textile-costing-service.ts` | Rich breakdown |
| `CostAnalysisPage` | `MiscPages.tsx` | Read ORDER_COSTS seed |
| Cost relations | `cost-relations.ts` | Enterprise graph |
| Brain feed | `textile-entity-registry.ts` | Snapshot only |

**No:** planned vs actual, variance buckets, cost lock, approval workflow.

---

## Cost Closing Süreçleri

| Süreç | Tier-1 | Kepler | P |
|-------|--------|--------|---|
| Planned Cost | Standard cost at SO confirm | ⚠️ MRP-based estimate | P0 |
| Actual Cost | Posted from prod/purchasing | ❌ | P0 |
| Cost Variance | Plan vs actual | ❌ | P0 |
| Material Variance | BOM actual vs plan | ❌ | P0 |
| Labor Variance | SMV × rate vs actual | ⚠️ Fixed qty×rate | P0 |
| Overhead Variance | OH allocation | ⚠️ Static overhead | P1 |
| Final Margin | Revenue − actual cost | ⚠️ Demo margin % | P0 |
| Cost Approval | Finance sign-off | ❌ | P1 |
| Cost Lock | No further postings | ❌ | P0 |

---

## Style Close Entegrasyonu

```
Cost Calculation Complete = all cost elements posted
Margin Calculation Complete = selling price − locked actual cost
Cost Lock = block new material/labor postings to style
```

Kepler `OrderCostBreakdown` fields: fabric, accessory, labor, embroidery, print, washing, waste, logistics, overhead, cm, fob — **planned only, no actuals ledger**.

---

## Öncelik

| ID | Gap | P |
|----|-----|---|
| CC-P0-01 | Planned vs Actual cost model | P0 |
| CC-P0-02 | Variance engine (material/labor) | P0 |
| CC-P0-03 | Cost lock on style close | P0 |
| CC-P1-01 | Overhead variance | P1 |
| CC-P1-02 | Cost approval workflow | P1 |
| CC-P2-01 | Standard cost roll-up from BOM | P2 |

---

## Sonuç

Maliyet **analitik demo**; cost closing **9/9 süreç eksik** (kısmi planned estimate hariç).
