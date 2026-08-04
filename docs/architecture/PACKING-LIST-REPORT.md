# Packing List Management Report — Implemented Architecture

**Updated:** 2026-08-04 — Phase 5 Module 4 + Hardening Sprint

---

## Executive Summary

Packaging is a **production packing-list domain**, not a demo UI. `PackingList` is the aggregate root; `Package` (Carton / Pallet) is an **embedded handling unit** (no separate carton aggregate port — Architecture Freeze).

| Layer | Status |
|-------|--------|
| Domain aggregate + CRUD | ✅ |
| Application commands / RQ hooks | ✅ |
| Persistence port + in-memory + Postgres adapter | ✅ |
| IAM write asserts (`warehouse.write`) | ✅ |
| Master Data GS1 company prefix | ✅ |
| UI `/packaging/*` | ✅ |

---

## Aggregate Model

```
Sales Order → PackingList (rev N) → Package[] (Carton|Pallet HU)
                                      ├─ parentPackageId (Carton → Pallet)
                                      ├─ SSCC + GS1-128 AI (00)
                                      └─ containerCode
                 ↓ approval → confirm
                 ↓ persistBindShipment → persistShipment (single inventory write path)
```

| Aggregate / Entity | Port | Notes |
|--------------------|------|-------|
| `PackingList` | `IPackingListRepository` | Header, revision, approval, totals, shipment bind |
| `Package` | Embedded | Carton/Pallet; SSCC seq via `nextSsccSerial()` |
| Sequences | `nextPackingListCounter` / `nextSsccSerial` | O(1) — no full-store scan |

---

## Process Matrix (vs Tier-1)

| Süreç | Tier-1 | Kepler now |
|-------|--------|------------|
| Packing List Create | PL header + lines | ✅ |
| Carton / Pallet HU | CRUD + nest | ✅ Carton→Pallet nest + container assign |
| Carton Sequence / SSCC | Auto SSCC | ✅ MD `GS1_COMPANY_PREFIX` |
| GS1-128 label | Print payload | ✅ AI skeleton `(00)` + package label builder |
| Net / Gross / CBM | Per HU | ✅ |
| SO matrix validation | Partial pack OK | ✅ qty ≤ matrix |
| Approval workflow | QA / sign-off | ✅ Submit → Approve → Confirm |
| Revision lifecycle | Version + activate | ✅ revise supersedes prior |
| Shipment bind | Load / ship | ✅ via `persistShipment` + orchestration outbox |
| PDF Packing List | Document | ✅ printable document payload (no binary PDF lib) |
| ASN / EDI 856 | Buyer ASN | ❌ still open |
| Commercial Invoice SSOT | Qty/weight | ❌ still open |
| ZPL / physical printer | Hardware | ❌ payload only |

---

## Security & Quality

- Route: `warehouse.read`; **every write command**: `assertPackagingWritePermission` → `warehouse.write`
- Actor: IAM `useAuth().user.id` (no hardcoded `pilot-user`)
- Mutations: transactional, idempotent keys, audit + enterprise timeline + SO outbox
- React Query: scoped invalidation (dashboard/lists/detail/brain/pdf; inventory only on bind)

---

## AI / Brain

- Read model: `queryPackagingBrainReadModel`
- Twin: `PACKING_LIST` nodes on factory graph (`ORDER → PACKING_LIST → SHIPMENT`)
- Brain must not mutate packing (READ/ANALYZE only) — writes stay on packaging commands

---

## Remaining Tier-1 gaps (explicit)

ASN/EDI, commercial invoice qty SSOT, binary PDF/ZPL printer drivers, catch-weight scales, multi-style carton rules, Postgres cutover (`PackingListPostgresRepository` wired, throws until PG backend).
