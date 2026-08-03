# Claim Management Report — GAP Analysis

**Generated:** 2026-08-03

---

## Executive Summary

Kepler'de **Claim Management modülü sıfır**. İhracat sonrası customer claim, debit/credit note, return, CAPA süreçleri yok. Style close checklist'teki **Open Quality Issue / Claims Closed** gate'leri implemente edilemez.

---

## Mevcut Durum

| Arama | Sonuç |
|-------|-------|
| Customer Claim entity | ❌ |
| Debit/Credit Note | ❌ |
| Return/RMA | ❌ |
| CAPA | ❌ (Brain has capacity insights only) |
| Quality inspection | ✅ Demo (`QualityPages`) — pre-ship only |

Database spec mentions claim-like status enums in reconciliation — **not in frontend domain**.

---

## Süreç GAP Matrisi

| Süreç | Tier-1 | Kepler | P |
|-------|--------|--------|---|
| Customer Claim | Post-delivery defect/short | ❌ | P0 |
| Quality Claim | AQL fail at buyer | ❌ | P0 |
| Debit Note | Charge supplier/customer | ❌ | P1 |
| Credit Note | Credit buyer | ❌ | P1 |
| Return | RMA + FG receipt | ❌ | P0 |
| Replacement | Re-production order | ❌ | P1 |
| Corrective Action | CAPA | ❌ | P1 |
| Preventive Action | PA | ❌ | P2 |

---

## Lifecycle Position

```
Shipment Delivered → Buyer Inspection → Claim Opened
  → Investigation → DN/CN → Return/Replace → CAPA → Claim Closed
  → Style can close (if no open claims)
```

---

## Öncelik

| ID | Gap | P |
|----|-----|---|
| CL-P0-01 | Claim aggregate + types | P0 |
| CL-P0-02 | Link to SO/Shipment/QC | P0 |
| CL-P1-01 | Debit/Credit note | P1 |
| CL-P1-02 | Return + replacement flow | P1 |
| CL-P1-03 | CAPA workflow | P1 |
| CL-P2-01 | Preventive action + Brain feed | P2 |

---

## Sonuç

Claim Management **tamamen eksik** — Tier-1 export apparel ERP'de P0 modül.
