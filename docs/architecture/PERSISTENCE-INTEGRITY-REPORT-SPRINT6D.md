# Persistence Integrity Report — Sprint 6D

**Sprint:** 6D  
**Generated:** 2026-08-02

---

## 1. Command Path vs Persistence Port

| Command domain | Persistence access | domain/data |
|----------------|-------------------|-------------|
| Lifecycle create/transition | `productionOrderRepo`, UoW streams | Via `catalog-command.bridge` (application) |
| Bundle create | `bundleRepo`, UoW | Via `CreateBundlesCommandContext` |
| MD approval/audit/attribute | MD ports via `master-data-port-access` | ❌ none |
| BOM workflow | `approvalWorkflows`, `entityRevisions` | ❌ none |
| Execution writes | UoW aggregates/streams | Provisioning via `provisioning-catalog.bridge` only |
| Split production | `splitExecutions` + bridge | Isolated bridge (no direct import in service) |
| Quality gate rework | `qualityGateEvaluations` stream | Rework context via bridge |

---

## 2. domain/data Isolation

**Allowed gateways (documented):**

| File | Role |
|------|------|
| `application/catalog/catalog-command.bridge.ts` | Application-layer catalog reads |
| `domain/catalog/provisioning-catalog.bridge.ts` | Domain provisioning reads (single import site) |
| `domain/production-order/lifecycle-seed.bootstrap.ts` | Bootstrap seed only |

**Removed from direct command services:**

- `lifecycle-service.ts` — no `domain/data` imports
- `bundle-tracking-service.ts` — requires `catalogContext`
- `split-execution-service.ts` — uses provisioning bridge
- `quality-gate-service.ts` — rework via bridge

---

## 3. Remaining domain/data Touch Points (non-command)

| Module | Usage | Classification |
|--------|-------|----------------|
| `business-rule-engine.ts` | Demo order/product for BR eval | ⚠️ Command-adjacent — PG sprint |
| `quality-rework-service.ts` | Rework helpers | ⚠️ Called from quality gate |
| `domain/data/*` seed arrays | Static demo catalog | P01/P02 — port migration deferred |
| Query/read models | Brain config, dashboard | Query path — OK |

---

## 4. Persistence Port Integrity

- **No direct store mutation** outside UoW/repos in command paths reviewed.
- **Outbox enqueue** only via `outbox-scheduler` / port — never post-commit from domain during TX.
- **WIP read model** refresh via outbox `wip-refresh` handler post-commit.

---

## 5. Verdict

**Command-path persistence integrity: SUBSTANTIALLY IMPROVED** — P01/P02 catalog port migration explicitly deferred; isolated bridges enforce single gateway pattern.
