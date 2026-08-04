# FINANCE-INTEGRATION-REPORT.md — Phase 7 Module 1

**Updated:** 2026-08-04

## Status

**Implemented (In-Memory Runtime)** — `AccountingIntegration` transforms operational ERP events into double-entry journal postings. Not a full accounting ERP.

---

## Architecture Decision Record (ADR)

**Decision:** Introduce `AccountingIntegration` as an **integration aggregate** (posting batch) with `IAccountingIntegrationRepository`. Source events are collected via **read-only queries** against Production, Inventory, Export Logistics, Commercial Documents, Purchasing, and Product/Cost Sheet — no duplicated repositories and no rewrite of completed modules.

**Why:** SAP FI/CO / Oracle Financials / D365 Finance maturity requires event→journal glue with debit=credit, period control, idempotency, audit, and reverse — without owning AP/AR/GL master ERP.

**PostgreSQL-ready:** coded aggregate port + counters + catalog collections on the same port; cutover `TD-PG-01`.

---

## Delivered

| Capability | Implementation |
|------------|----------------|
| Aggregate | AccountingIntegration (PostingBatch + JournalEntry/Lines) |
| Catalog | GLAccountMapping, CostCenter, ProfitCenter, FinancialPeriod |
| Sources | ProductionComplete, FG Receipt, ShipmentDeparted, CI Issued, Purchase Receipt, Purchase Invoice (PO Completed proxy), Inventory Adjustment, Cost Closing |
| Rules | Debit=Credit; closed period reject; idempotent enqueue/post; auditable; reversible |
| IAM | `finance.read` / `finance.write` (posting role) |
| Brain | Profitability hints + cost anomaly scores |
| Twin | `ACCOUNTING_INTEGRATION` nodes |
| UI | Timeline, Queue, Result, Failed, Detail, GL Mapping |
| Validate | `validate:finance-integration` in build |

## Technical Debt

| ID | Item |
|----|------|
| TD-PG-01 | Postgres cutover |
| TD-AP-01 | True Supplier Invoice aggregate (PO Completed is AP proxy) |
| TD-EXT-01 | External GL adapter (SAP/Oracle/D365 posting API) |
| TD-FX-01 | Multi-currency / tax codes |

## Performance Review

- Enqueue scans bounded operational lists (no unbounded growth contract beyond existing stores)
- Dashboard/queue via cursor limit 500
- Twin: max 5 accounting nodes per order
- RQ scoped to `financeIntegration.*`

## Security Review

- Command-path `finance.write` assertion
- IAM actor via `useAuth`
- Tenant metadata on persistence
- No secrets / PII in audit payload (amounts + status only)

## AI Readiness

- Brain financial read model
- Profitability insight surface
- Cost anomaly events (score ≥ 40)
- Twin `ACCOUNTING_INTEGRATION` attributes
- Outbox on every persist

## Tier-1 GAP (SAP FI/CO / Oracle / Infor / D365)

| Capability | Status |
|------------|--------|
| Event→journal integration | ✅ |
| Double-entry + period control | ✅ |
| Reverse posting | ✅ |
| Full GL / subledger ERP | ❌ (by design) |
| Live external FI adapter | ❌ |
| Native AP invoice document | ❌ (proxy) |

## Freeze

Completed modules **not rewritten**; reuse via queries only.

## Gates

`validate:finance-integration` in build pipeline.
