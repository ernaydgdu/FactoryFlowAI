# Manufacturing Memory Engine — Architecture Report

**Subsystem:** Kepler Brain / Manufacturing Memory (Phase 9.5)  
**Date:** 2026-08-04  
**Milestone:** Persistent intelligence layer — **no LLM**, no learning, no optimization  
**Freeze:** No new ports; append-only via existing `brainDecisionMemory` stream; ERP read-only

---

## Mission

Act as the enterprise experience database: retain what was observed, what was known, what Brain recommended, what was actually executed, and what happened next so future Optimization / Learning can consume reconstructable history.

---

## Pipeline

```
Knowledge → Reasoning → Planning → Simulation → Memory
```

---

## Persistence (Freeze-safe)

| Concern | Approach |
|---------|----------|
| Port | Existing `IUnitOfWork.brainDecisionMemory` |
| Write | Append-only `saveEntry` when id absent |
| Delete / overwrite | Not exposed by the Memory Engine |
| Correction | New record with `correctionOf` + immutable `CORRECTS` link |
| ERP | Never mutated |
| Payload | Full `MemoryRecord` JSON in `DecisionMemoryEntry.context` |
| Company scope | `KEPLER-MFG-MEMORY` |

---

## Experience record

Every record supports:

- **Observation** — what happened
- **Context snapshot** — factory state known at that moment
- **Decision** — Brain recommendation
- **Action** — actual user/system execution, actor, execution status
- **Outcome** — actual final state
- **Accuracy** — expected vs actual; no prediction
- **Lessons** — deterministic text derived from stored facts
- **Links** — stable `traceId`, typed record links, optional correction reference

Timestamp · Module · Aggregate · Event · Constraints · Rules Fired · Inputs · Outputs · KPIs · Confidence · Duration · References · Index keys are retained with the experience fields.

---

## Indexes

Decision · Supplier · Material · Machine · Operator · Customer · Style · Production · Inventory · Shipment · Quality · Planning · Simulation · Risk · Constraint · KPI

---

## Trace chain and replay

Records carry a stable trace and typed links (`PRECEDES`, `FOLLOWS`, `DERIVED_FROM`, `CORRECTS`, `RELATES_TO`). The production-order replay query reconstructs:

```
Production Order → Planning Decision → Simulation → Execution
  → Quality → Packaging → Shipment → Finance → Style Closing
```

Replay returns known facts, constraints, rules fired, recommendations, executed actions, and subsequent outcomes. Missing execution evidence remains explicitly `UNKNOWN` / `NOT_YET_MEASURABLE`.

---

## Query presets

- Decisions by style  
- Supplier delays  
- Planning / machine history counts  
- Recurring bottlenecks  
- Historical OTIF-related memory  
- Recurring quality failures  
- Recurring purchasing shortages  
- Recurring inventory shortages  

Deterministic fact retrieval only — **no predictions**.

---

## Routes

`/brain-memory/{coverage,records,indexes,queries,decisions,timeline}` · `ai.read`

---

## Non-goals

- Learning Engine  
- Optimization Engine  
- Chat / Copilot / LLM  
- Statistics beyond stored counts  
- New persistence ports  
