# AI Roadmap

**Date:** 2026-08-04  
**Principle:** Deterministic domain decisions first. LLM only behind Brain command boundaries with audit. No mutate-from-model.  
**Current Phase 8 surface:** `queryEnterpriseAiFoundation` — `llmEnabled: false`, `sideEffects: 'NONE'`.

---

## 1. Current state (objective)

### Present

| Capability | Location | Notes |
|------------|----------|-------|
| Enterprise AI foundation query | `domain/brain/enterprise-ai-foundation.ts` | Unified read surface for Obs UI |
| Brain RMs (wired) | Finance, Cost Closing, Style Closing, Export Logistics | Used for recs/preds |
| Twin graph + health | `factory-graph-engine`, `digital-twin-health-engine` | Empty knowledge snapshot today |
| Twin engines | bottleneck, early-warning, prediction, playbook, orchestrator | Exist under `domain/brain/twin/engines/` |
| Brain kernel / recommendation layer | `brain-kernel`, `recommendation-layer` | Insight → recommendation with confidence |
| Explainability flags | `deterministicOnly`, `llmEnabled: false`, audit hint | Explicit |
| Obs UI | `/enterprise/ai` | Read-only |

### Gaps (evidence)

| Gap | Sev | Evidence |
|-----|-----|----------|
| ~~Event catalog names ≠ DomainEventType~~ | **Closed (TD-P0-08)** | Foundation catalog now ⊆ `DomainEventType` |
| Parallel outbox vocabularies | **P1** | `outbox-scheduler.ts` topic strings vs `DomainEventType` union vs handler map |
| Brain RMs not wired into foundation | **P2** | Packaging, Commercial Docs, lifecycle, execution, planning adapters exist but omitted |
| Twin completeness intentionally capped | **P2** | Orders ≤10; related slices 3–5; CONTAINER type unused |
| Twin predictions on legacy data arrays | **P2** | `prediction-engine.ts` uses STOCK_CARDS / SALES_ORDERS modules |
| No LLM integration | By design | Correct for current phase |

---

## 2. Roadmap phases

### Phase AI-0 — Catalog fidelity (prerequisite) · Effort S–M

**Goal:** Single source of truth for AI-consumable events.

1. Generate event catalog from `DomainEventType` + outbox handler map + scheduler topics.
2. Replace curated/wrong names in `enterprise-ai-foundation`.
3. Attach explainability metadata: aggregate, producer path, audit linkage.
4. Validation gate: catalog entries ⊆ known event emitters.

**Exit:** No invented event names; `validate:enterprise` asserts catalog ⊆ union.

### Phase AI-1 — Unified Brain read model registry · Effort M

**Goal:** Complete deterministic Brain query surface.

1. Register every existing `*BrainReadModel` / adapter under one registry.
2. Wire packaging, commercial-documents, production-order lifecycle, execution, planning into foundation.
3. Standard DTO: `{ domain, surface, available, kpiSummary, anomalies[], asOf }`.
4. Keep `sideEffects: 'NONE'`.

**Exit:** Foundation `brainReadModels` length matches registry; UI lists all.

### Phase AI-2 — Twin completeness · Effort L

**Goal:** Twin graph reflects UoW truth without legacy arrays.

1. Feed knowledge snapshot from real UoW queries (not empty fragments).
2. Remove / migrate legacy `STOCK_CARDS` / `SALES_ORDERS` from twin prediction engine.
3. Emit CONTAINER nodes where warehouse topology requires; document QUALITY_INSPECTION / PURCHASE_ORDER coverage.
4. Replace hard caps with cursor/page policy + health flags when truncated.
5. N+1 fix in `factory-graph-engine` (hoist export/accounting/closing queries outside order loop).

**Exit:** Twin health score + flags reflect real data; no legacy array dependency.

### Phase AI-3 — Recommendation / prediction contracts · Effort M

**Goal:** Stable interfaces for consumers (UI, future agents).

```
AiRecommendation { id, domain, title, rationale, confidence, evidenceRefs[], sideEffects: 'NONE' }
AiPrediction { id, domain, metric, value, unit, horizon?, explainability, evidenceRefs[] }
```

1. Normalize foundation + twin + recommendation-layer outputs to these contracts.
2. Evidence refs must point to entity ids / audit / event ids.
3. Confidence always derived from deterministic scores (variance, gate fails, delay heuristics).

**Exit:** Obs dashboards + Brain console consume same contracts.

### Phase AI-4 — Explainability & audit · Effort M

**Goal:** Every AI surface is operator-auditable.

1. Persist decision memory only via existing Brain decision stream / `aiMemory` collection ports.
2. Record: actor, input summary hash, surface id, outcome, evidence refs.
3. Forbid domain write from recommendation accept without human command + permission assert.
4. Enterprise Audit dashboard links to AI decision entries.

**Exit:** Accept-recommendation path is a normal permitted command or does not exist.

### Phase AI-5 — LLM features (optional, later) · Effort XL

**Goal:** Assistive language only — never system of record.

**Preconditions (all required):**
- AI-0…AI-4 complete
- Command-path permissions green on write modules (see TECHNICAL-DEBT-BACKLOG P0)
- Postgres or equivalent durable audit (or accepted single-tenant memory risk documented)
- Architecture Freeze: LLM SDK only in infrastructure/Brain gateway — **not** in domain services

**Allowed:**
- Summarize Brain read models / twin health for operator
- Draft natural-language explainability from structured evidence
- Suggest which recommendation to review (still human + domain decides)

**Forbidden:**
- Direct stock / PO / closing / journal mutation from model output
- Trusting barcode / spoofable payload because model “confirmed”
- Vendor SDK imports under `domain/`

**Exit:** `llmEnabled` feature flag; default false; full audit of prompts/outcomes (no raw PII/secrets).

---

## 3. Non-goals

- Demo chatbots with hardcoded factory narratives
- Replacing MRP / cost / style gates with model judgment
- New persistence ports for “AI store” outside existing `aiMemory` / decision streams
- Training pipelines or online learning in-app

---

## 4. Dependency on non-AI debt

| AI phase | Blocks on |
|----------|-----------|
| AI-2 twin | Perf N+1 (TD-P1-10); queryAll truncation (TD-P1-08) |
| AI-4 accept path | Command permission P0s (TD-P0-03) |
| AI-5 LLM | Postgres/audit durability preference; security P0s |

---

## 5. Success metrics (measurable)

| Metric | Target |
|--------|--------|
| Event catalog precision | 100% names ⊆ emitted types |
| Brain RM registry coverage | 100% of existing query surfaces registered |
| Twin legacy-data dependency | 0 imports from `@/domain/data` order/stock arrays |
| LLM default | `llmEnabled === false` until AI-5 gate |
| Side effects | All recommendation DTOs `NONE` unless human command |
