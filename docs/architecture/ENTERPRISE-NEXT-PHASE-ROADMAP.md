# Enterprise Next-Phase Roadmap

**Date:** 2026-08-04  
**Context:** P0 remediation program **closed**. Sprint-sized integrity/security defects resolved. Remaining enterprise gaps are **transformation programs**.  
**Constraint:** Architecture Freeze preserved — no new aggregate ports without ADR; no partial multi-tenant or partial Postgres cutover.  
**References:** `TECHNICAL-DEBT-BACKLOG.md`, `POSTGRES-CUTOVER-PLAN.md`, `AI-ROADMAP.md`, `TIER1-GAP-ANALYSIS.md`, `ENTERPRISE-ARCHITECTURE-REVIEW.md`

---

## Recommended execution order

```
Phase 9  Multi-Tenant Transformation
    ↓
Phase 10 PostgreSQL Cutover
    ↓
Phase 11 Brain AI Enterprise          (can overlap late Phase 10 for read models)
    ↓
Phase 12 Reporting & Analytics        (depends on durable data + tenant isolation)
    ↓
Phase 13 External Integrations        (depends on durable outbox + API surface)
```

**Rationale:** Tenant isolation before durable multi-tenant storage; durable storage before analytics/integrations at scale; AI enterprise features after data truth is tenant-safe and persisted.

**Parallelizable (limited):** P1 backlog items (query truncation, RQ `.all`, UI→application bypass) may run alongside Phase 9 planning — they must not invent tenancy or PG adapters.

---

## Phase 9 — Multi-Tenant Transformation

| | |
|--|--|
| **Absorbs** | TD-P0-05 |
| **Status** | Deferred program — not sprint-sized |
| **Estimated effort** | **XL+** · 8–16 weeks (2–3 engineers) |
| **Goal** | Every persist/read path uses runtime `tenantId`; no hardcoded `kepler-default` as partition key |

### Scope

1. ADR: single-tenant v1 schema with mandatory `tenant_id` vs true multi-tenant SaaS (recommend: column + RLS later).
2. Auth/session: issue and enforce `tenantId` from login (stop forcing `DEFAULT_TENANT_ID` in auth-context).
3. Domain CRUD: replace hardwired `DEFAULT_TENANT_ID` writes/reads with `getRuntimeTenantContext().tenantId`.
4. Audit / outbox / streams: tenant-scoped append and cursor.
5. Seed & bootstrap: per-tenant seed or explicit default-tenant bootstrap.
6. Isolation tests: cross-tenant read/write must fail.
7. Docs: update Freeze / Foundation tenant contract.

### Major risks

| Risk | Impact |
|------|--------|
| Missed hardwire in a domain service | Cross-tenant data leak |
| Partial migration | False sense of multi-tenancy (forbidden) |
| Seed/demo data assumptions | Broken bootstrap for non-default tenants |
| Brain/twin fan-in ignoring tenant | Contaminated AI surfaces |

### Dependencies

- Stable IAM session / tenant context runtime (exists; unused as data key)
- No dependency on Postgres — can complete on memory UoW first
- Blocks honest multi-tenant Postgres cutover (Phase 10)

### Exit criteria

- [ ] Zero production write paths using literal `kepler-default` except documented bootstrap default
- [ ] Cross-tenant isolation test suite PASS
- [ ] Architecture review Security multi-tenant finding cleared

---

## Phase 10 — PostgreSQL Cutover

| | |
|--|--|
| **Absorbs** | TD-P0-07 (+ TD-P1-12 catalog completeness, TD-P2-13/14) |
| **Status** | Deferred program — not sprint-sized |
| **Estimated effort** | **XL+** · 12–24 weeks (aligned with `POSTGRES-CUTOVER-PLAN.md` Phases A–F) |
| **Goal** | Runnable `PostgresUnitOfWork` implementing full `IUnitOfWork`; memory remains default until go/no-go |

### Scope

Follow `POSTGRES-CUTOVER-PLAN.md`:

1. **A** — Complete port inventory (all ~58 UoW keys)
2. **B** — Platform spine (outbox, audit, users, TX, migrations, driver)
3. **C** — Core merchandising & inventory
4. **D** — Execution & quality streams
5. **E** — Logistics & closing aggregates
6. **F** — Cutover rehearsal gates

### Major risks

| Risk | Impact |
|------|--------|
| Sync domain vs async PG | Deadlocks / facade debt |
| Partial port cutover | Split-brain persistence (forbidden) |
| OL / idempotency drift vs memory | Silent data loss |
| Skipping Phase 9 | Tenant column retrofit later |

### Dependencies

- **Phase 9 strongly recommended first** (tenant_id columns from day one)
- Architecture Freeze: implement existing ports only
- Persistence validation + module smokes on `PERSISTENCE_BACKEND=postgres`

### Exit criteria

- [ ] `readyCount` complete; `cutoverBlocked == false`
- [ ] Factory does not throw in postgres mode
- [ ] Memory mode regression still green
- [ ] Rollback: flip backend to memory

---

## Phase 11 — Brain AI Enterprise

| | |
|--|--|
| **Builds on** | `AI-ROADMAP.md` AI-1…AI-5; TD-P2-10/11/12 |
| **Estimated effort** | **L–XL** · 6–12 weeks |
| **Goal** | Production-grade deterministic Brain + Twin; optional governed LLM assist |

### Scope

1. Unified Brain read-model registry (all domains)
2. Twin completeness: real UoW snapshot, remove legacy data arrays, fix N+1
3. Recommendation/prediction contracts with evidence refs
4. Explainability + decision-memory audit
5. LLM (optional): Brain gateway only; `llmEnabled` default false; no domain mutate-from-model

### Major risks

| Risk | Impact |
|------|--------|
| LLM before authz/tenant/durable audit | Unsafe recommendations |
| Catalog/scheduler vocab drift returns | False explainability |
| Twin caps hide operational reality | Bad decisions |

### Dependencies

- Phase 9 (tenant-safe AI reads)
- Phase 10 preferred for durable decision memory / audit
- P0 command-path guards (done) — accept-recommendation must stay permitted commands

### Exit criteria

- [ ] Registry coverage = 100% of existing Brain RMs
- [ ] Twin has zero `@/domain/data` order/stock array dependency
- [ ] LLM path (if any) audited; default off

---

## Phase 12 — Reporting & Analytics

| | |
|--|--|
| **Estimated effort** | **L–XL** · 6–10 weeks |
| **Goal** | Tenant-safe operational + financial reporting beyond module KPIs |

### Scope

1. Reporting read models (cursor-complete; no silent 100-cap)
2. Cross-module dashboards (OTIF, inventory turns, cost variance, style margin)
3. Export (CSV/XLSX) with permission + audit
4. Optional: warehouse for analytics (materialized views) after Phase 10
5. Replace ad-hoc UI domain queries with application reporting services

### Major risks

| Risk | Impact |
|------|--------|
| Building reports on truncated `queryAll*` | Wrong executive numbers |
| Pre-tenant reports | Cross-tenant leakage |
| Heavy scans in UI thread | Perf regressions |

### Dependencies

- Phase 9 mandatory
- Phase 10 strongly preferred for scale
- P1-08 (cursor walk) should be fixed before or as part of this phase

### Exit criteria

- [ ] Report queries page/cursor completely
- [ ] All report routes + exports permission-gated
- [ ] Smoke for new report routes PASS

---

## Phase 13 — External Integrations

| | |
|--|--|
| **Estimated effort** | **XL** · 8–16 weeks |
| **Goal** | Versioned external API + outbox consumers outside the SPA |

### Scope

1. Server-hosted domain command/query API (evolve Nest beyond auth stub)
2. Outbox → external consumers (webhooks, message bus)
3. Partner contracts: EDI/REST for PO, ASN, invoice (as needed)
4. Idempotent inbound webhooks
5. Integration audit trail

### Major risks

| Risk | Impact |
|------|--------|
| API before durable outbox | Lost events |
| Bypassing domain permissions | Authz holes
| Dual write SPA + API | Consistency failure |

### Dependencies

- Phase 10 (durable outbox + aggregates)
- Phase 9 (tenant on every external call)
- Phase 11 optional for AI-assisted mapping — not required

### Exit criteria

- [ ] External command path uses same permission + TX + outbox rules
- [ ] At least one production consumer pattern documented and tested
- [ ] SPA remains a client; not system of record for integrations

---

## Effort summary

| Phase | Effort (indicative) | Can start after |
|-------|---------------------|-----------------|
| 9 Multi-Tenant | 8–16 weeks | Now (P0 program closed) |
| 10 PostgreSQL Cutover | 12–24 weeks | Phase 9 (recommended) |
| 11 Brain AI Enterprise | 6–12 weeks | Phase 9; Phase 10 preferred |
| 12 Reporting & Analytics | 6–10 weeks | Phase 9 + 10 |
| 13 External Integrations | 8–16 weeks | Phase 9 + 10 |

---

## Non-goals for next phases

- Partial multi-tenant hardwire cleanup without isolation tests
- Enabling `PERSISTENCE_BACKEND=postgres` before Phase 10 exit criteria
- LLM features before Phase 11 preconditions
- New aggregate ports without Freeze ADR
- Tier-1 parity claims (see `TIER1-GAP-ANALYSIS.md`)

---

## Immediate recommendation

1. Close P0 remediation program in backlog/review (**this document**).  
2. Staff **Phase 9** as the next program of record.  
3. Keep **P1** items in sprint cadence without touching tenancy/PG cutover.  
4. Use `POSTGRES-CUTOVER-PLAN.md` as the Phase 10 execution bible when Phase 9 exits.
