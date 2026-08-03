# Shipment Management Report — GAP Analysis

**Generated:** 2026-08-03

---

## Executive Summary

Kepler'de sevkiyat **üç parçalı demo** olarak dağılmış: `ShippingPage` (mock), `ContainerPlanningPage` (workflows seed), `ShipmentCompleted` event. **Unified Shipment aggregate**, booking lifecycle, partial/multi shipment ve close yok.

PRD Module 6 (locked) post-EXF logistics SSOT tanımlar — Kepler frontend PRD entity modeline bağlı değil.

---

## Mevcut Durum

| Bileşen | Konum | Kapsam |
|---------|-------|--------|
| `ContainerPlan` | `workflows.ts` | booking, ETD, ETA, forwarder, seal, status |
| `ShippingPage` | `data/mock/misc.ts` | shipmentRecords — mock table |
| `ShipmentCompleted` | `event-bus.ts` | Domain event only |
| Forwarder MD | `master-data` | Lookup seed |
| Route | `/shipping`, `/shipping/containers` | Read-only |

**ContainerPlan fields present:** containerNo, bookingNo, containerType, etd, eta, forwarder, sealNo, orderIds, totalCartons, totalQty, status.

**Missing from entity:** vessel, POL, POD, loading plan detail, revision, close.

---

## Süreç GAP Matrisi

| Süreç | Tier-1 | Kepler | P |
|-------|--------|--------|---|
| Booking | Forwarder booking ref | ⚠️ `bookingNo` string | P0 |
| Forwarder | MD + assignment | ⚠️ MD + display | P1 |
| Vessel | Voyage tracking | ❌ | P0 |
| Container | Full lifecycle | ⚠️ Plan card | P0 |
| Seal Number | Compliance | ⚠️ Field only | P1 |
| ETD / ETA | Schedule + revision | ⚠️ Static dates | P0 |
| Port of Loading | UN/LOCODE | ❌ | P0 |
| Port of Discharge | UN/LOCODE | ❌ | P0 |
| Loading Plan | Carton → container slot | ❌ | P0 |
| Partial Shipment | Qty < SO | ❌ | P0 |
| Multi Shipment | N shipments / order | ❌ | P0 |
| Shipment Revision | Amend B/L data | ❌ | P1 |
| Shipment Close | Terminal state | ❌ | P0 |

---

## PRD Module 6 vs Kepler Frontend

| PRD (locked) | Kepler |
|--------------|--------|
| `shipment_record` SSOT | ❌ Entity yok |
| EXF event consumption | ⚠️ Event type var |
| Reconciliation queue | ❌ |
| Document links | ❌ |
| V1: EXF on TNA only | Demo bypass |

---

## Shipment ↔ Packing ↔ Documents

```
PackingList → ShipmentLine → ShipmentRecord → B/L → Commercial Invoice
```

Kepler: container aggregates `totalCartons` without carton FK — **broken chain for Tier-1**.

---

## Öncelik

| ID | Gap | P |
|----|-----|---|
| SH-P0-01 | `ShipmentRecord` aggregate (PRD M6) | P0 |
| SH-P0-02 | Loading plan (carton allocation) | P0 |
| SH-P0-03 | Partial + multi shipment | P0 |
| SH-P0-04 | POL/POD/vessel | P0 |
| SH-P0-05 | Shipment close + archive | P0 |
| SH-P1-01 | Shipment revision | P1 |
| SH-P2-01 | Carrier API / tracking integration | P2 |

---

## Sonuç

Container plan kartı **planning preview**; gerçek shipment management modülü **~85% eksik**.
