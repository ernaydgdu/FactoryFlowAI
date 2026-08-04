# Tier-1 GAP Analysis

**Date:** 2026-08-04  
**Subject:** FactoryFlowAI / Kepler ERP (current implementation)  
**Comparators:** SAP S/4HANA · Infor CloudSuite Industrial / Fashion · Microsoft Dynamics 365 Finance & Supply Chain · Oracle Fusion Cloud ERP  
**Method:** Objective capability gaps only — based on what Kepler code/docs prove today vs publicly established Tier-1 product capabilities. No marketing claims. No speculative feature lists for Kepler.

---

## 1. Kepler baseline (facts)

| Fact | Evidence |
|------|----------|
| System of record | Frontend in-memory `IUnitOfWork` |
| Durable DB cutover | Blocked (`readyCount: 0`) |
| Backend ERP services | NestJS auth/platform stub; no domain modules |
| Multi-tenant | Hardcoded `kepler-default` |
| Vertical focus | Textile / apparel manufacturing (BOM, style close, packing, export) |
| AI | Deterministic Brain/Twin surfaces; LLM disabled |
| Deployment model | SPA + local persistence mode |

---

## 2. Capability matrix

Legend: **Y** present at enterprise depth · **P** partial / prototype · **N** absent or not production-grade

| Capability area | Kepler | S/4HANA | Infor CSI/Fashion | D365 F&SCM | Oracle Fusion | Objective gap |
|-----------------|--------|---------|-------------------|------------|---------------|---------------|
| Durable transactional DB | N | Y | Y | Y | Y | No production RDBMS cutover |
| Server-side domain API | N | Y | Y | Y | Y | Domain not on Nest/API |
| Multi-company / multi-tenant | N | Y | Y | Y | Y | Single hardcoded tenant |
| Role-based authz on every write | P | Y | Y | Y | Y | Many writes route-only / unguarded |
| Optimistic concurrency | P | Y | Y | Y | Y | Stock ledger & PO persist gaps |
| Idempotent document posting | P | Y | Y | Y | Y | Strong only on newer logistics/finance |
| Financial GL / subledger | P | Y | Y | Y | Y | Event→journal integration only; not full FI |
| Statutory / multi-GAAP / multi-currency close | N | Y | Y | Y | Y | Cost/style close ≠ corporate close |
| MRP / planning at scale | P | Y | Y | Y | Y | In-memory MRP; scale unproven |
| Shop floor / MES depth | P | Y* | Y | Y | Y* | Present but authz/OL weak (*via MES/add-ons) |
| WMS / warehouse | P | Y | Y | Y | Y | Basic movements; not Tier-1 WMS |
| Quality management | P | Y | Y | Y | Y | Module exists; no `quality.write` perm |
| Export / trade docs | P | Y | Y | Y | Y | Strong relative to Kepler maturity; not GTS-class |
| Master data governance | P | Y | Y | Y | Y | CRUD + approval; limited MDM |
| Workflow / BPM | P | Y | Y | Y | Y | Approval steps present; not enterprise BPM |
| Integration bus / iPaaS | N | Y | Y | Y | Y | Outbox local only; no EDI/ERP hub |
| Audit / compliance archive | P | Y | Y | Y | Y | Audit capped/page-limited; PG stub |
| HA / DR / backup | N | Y | Y | Y | Y | Browser memory process |
| Observability (APM/metrics) | P | Y | Y | Y | Y | Client performance monitor only |
| AI / ML ops | P | Y | Y | Y | Y | Deterministic foundation; no LLM ops |
| Industry fashion PLM depth | P | P/Y** | Y | P | P | Style/BOM strong for size; not full PLM (**SAP via Fashion) |

\* MES often companion product.  
\*\* Fashion industry pack varies by vendor SKU.

---

## 3. Gap themes (objective)

### G1 — Persistence & runtime topology

Tier-1 ERPs run domain services against durable databases with TX managers, backup, and horizontal scale.  
**Kepler:** in-memory UoW in the browser process; Postgres factory throws.  
**Gap type:** Foundational — blocks any Tier-1 production comparison.

### G2 — Security & tenancy

Tier-1 enforces server-side authorization, segregation of duties, and tenant isolation.  
**Kepler:** client-held ExecutionRole; many command mappers without write asserts; single tenant id.  
**Gap type:** Security — must close before “enterprise ready” language.

### G3 — Financial completeness

Tier-1 provides GL, AP/AR, asset accounting, tax, multi-currency, period close, and statutory reporting.  
**Kepler:** AccountingIntegration posting batches + cost/style closing aggregates — operational finance adjacent, not full finance suite.  
**Gap type:** Product scope — not a bug; explicit missing product areas.

### G4 — Scale & query correctness

Tier-1 repositories page, index, and avoid silent truncation.  
**Kepler:** many `queryAll*` paths return first cursor page (often 100) without walking.  
**Gap type:** Correctness under volume.

### G5 — Integration ecosystem

Tier-1 ships IDocs/OData/REST, EDI, partner networks, event meshes.  
**Kepler:** local outbox + handlers inside the SPA runtime.  
**Gap type:** Integration — no external consumer contract.

### G6 — AI maturity

Tier-1 vendors offer governed copilots with enterprise data grounding and admin controls.  
**Kepler:** Brain/Twin deterministic surfaces; event catalog drift; LLM explicitly off.  
**Gap type:** Early foundation — appropriate stage, not Tier-1 parity.

---

## 4. Relative strengths (honest)

These do **not** equal Tier-1 parity; they are Kepler advantages relative to a greenfield textile ERP:

| Strength | Evidence |
|----------|----------|
| Apparel-oriented domain model | Product Card, BOM, size sets, style closing 14-gate model |
| Explicit Architecture Freeze / UoW ports | Persistence constitution + port surface |
| Newer modules TX + audit + outbox + command guards | Packaging → Style Closing pattern |
| Bootstrap resiliency + Obs dashboards | Phase 8 enterprise hardening |
| Digital Twin / Brain scaffolding | Twin engines + foundation query |

---

## 5. What “closing the gap” would require (program level)

Not a sprint list — capability programs:

1. **Durable platform:** Postgres (or equivalent) cutover + server-hosted domain API.  
2. **Security program:** Command-path authz, SoD, end session role binding, real tenancy.  
3. **Finance program:** GL/subledger depth if competing with S/4 / Fusion / D365 Finance.  
4. **Scale program:** Cursor-complete queries, indexed repos, load tests.  
5. **Integration program:** Versioned external APIs + outbox consumers outside the SPA.  
6. **AI program:** Catalog fidelity → unified RMs → governed LLM (see `AI-ROADMAP.md`).

---

## 6. Comparator-specific notes (objective only)

| Vendor | Notable gap vs that vendor’s core strength |
|--------|--------------------------------------------|
| SAP S/4HANA | No HANA/ACDOCA-class finance; no SAP-compatible integration; no ABAP/service layer |
| Infor CloudSuite | No multi-site industrial/fashion cloud tenancy; no Infor OS / Coleman-class platform services |
| Dynamics 365 | No Dataverse/F&O service tier; no dual-write / Power Platform ecosystem |
| Oracle Fusion | No Fusion SaaS tenancy, ESS jobs, or Fusion Accounting Hub depth |

Kepler should **not** claim equivalence to any of the four. Fair claim: *vertical textile operational ERP prototype with strengthening architecture toward enterprise maturity.*

---

## 7. Verdict

| Question | Answer |
|----------|--------|
| Is Kepler Tier-1 equivalent today? | **NO** |
| Closest Tier-1 dimension? | Domain modeling for apparel ops (still partial) |
| Hard blockers to any Tier-1 comparison | Durable DB, server domain, authz, multi-tenant |
| Docs / reviews that apply | ENTERPRISE-ARCHITECTURE-REVIEW, TECHNICAL-DEBT-BACKLOG, POSTGRES-CUTOVER-PLAN, AI-ROADMAP |
