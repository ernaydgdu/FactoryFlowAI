# COST-CLOSING-REPORT.md — Phase 7 Module 2

**Updated:** 2026-08-04

## Status

**Implemented (In-Memory Runtime)** — `CostClosing` manufacturing financial completion layer over Product Card / BOM / Production / Inventory / Shipment / Commercial Documents / Finance Integration.

---

## Architecture Decision Record (ADR)

**Decision:** Introduce `CostClosing` as a dedicated aggregate with `ICostClosingRepository`. Closing gates and variances are computed via **read-only queries** to existing aggregates. Approval reuses platform `ApprovalWorkflow` with additive type `CostClosing`.

**Why:** SAP CO / Oracle Cost Management / D365 Cost Accounting maturity needs period-aware close, variance, revaluation, and immutable Closed state — without rewriting Finance Integration or operational modules.

**PostgreSQL-ready:** coded aggregate port + counter; cutover `TD-PG-01`.

---

## Delivered

| Capability | Implementation |
|------------|----------------|
| Aggregate | CostClosing batch + variances + revaluation + reconciliation + closing result |
| Lifecycle | Open → Calculating → Reconciling → Approved → Closed (immutable) |
| Gates | Production, FG, Shipment (where applicable), Commercial docs, Accounting postings, Inventory recon, no open PO/GR |
| Reverse | Allowed until Approved |
| Idempotent | Create/transitions by idempotencyKey + salesOrder uniqueness |
| IAM | `finance.write` on commands; route `finance.read` |
| Approval | Platform workflow `CostClosing` |
| Brain / Twin | Variance + anomaly read model; `COST_CLOSING` nodes |
| UI | Dashboard, Variance, Reconciliation, Detail (approval timeline), History |
| Validate | `validate:cost-closing` in build |

## Technical Debt

| ID | Item |
|----|------|
| TD-PG-01 | Postgres cutover |
| TD-CO-01 | Actual labor capture from shop-floor time tickets |
| TD-CO-02 | Multi-level BOM rollup / WIP layers |
| TD-FX-01 | Multi-currency close |

## Performance Review

- Gate eval: filtered lists by salesOrderId
- Dashboard cursor limit 500
- Twin: max 5 closings per order
- RQ scoped to `costClosing.*`

## Security Review

- Command-path `finance.write`
- Approval workflow actor from IAM
- Audit + outbox on every persist
- Closed immutable

## AI Readiness

- Cost variance read model
- Profitability insight
- Closing anomaly events (score ≥ 40)
- Twin `COST_CLOSING`
- Brain dashboard surface

## Tier-1 GAP (SAP CO / Oracle / D365 / Infor)

| Capability | Status |
|------------|--------|
| Cost close batch + variance | ✅ |
| Gate-based close | ✅ |
| Immutable closed | ✅ |
| Actual activity-based costing | ❌ |
| Parallel/ledger valuation areas | ❌ |
| External CO adapter | ❌ |

## Freeze

Completed modules **not rewritten**; Finance Integration / Inventory / Shipment / etc. reused via queries.

## Gates

`validate:cost-closing` in build pipeline.
