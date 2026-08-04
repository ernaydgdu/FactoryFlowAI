# Manufacturing Simulation Engine — Architecture Report

**Subsystem:** Kepler Brain / Manufacturing Simulation (Phase 9.4)  
**Date:** 2026-08-04  
**Milestone:** Simulation layer — **no LLM**, deterministic what-if  
**Freeze:** Read-only; never mutates ERP; no module rewrites

---

## Mission

Execute hypothetical manufacturing scenarios over Knowledge + Reasoning + Planning baselines and compare **Current / A / B / C**.

---

## Pipeline position

```
Knowledge → Reasoning → Planning → Simulation → Decision → Recommendation → Automation
```

---

## Scenario catalog (examples)

| Slot | Question |
|------|----------|
| CURRENT | Baseline preferred plan, no shocks |
| A | Machine AUTO_CUTTER stops 6 hours |
| B | Supplier fabric delays 3 days |
| C | Urgent order + overtime + operator −10% + cutting yield −2% |

Shock types: `MACHINE_DOWNTIME`, `SUPPLIER_DELAY`, `ORDER_URGENT`, `OVERTIME_ENABLED`, `OPERATOR_AVAILABILITY`, `CUTTING_YIELD_DROP`

---

## Outputs

OTIF impact · completion date Δ · utilization · queue growth · bottleneck movement · WIP · inventory · purchasing · shipment delay · cost Δ · confidence · timeline points

Comparison table: Current vs A vs B vs C for each metric.

---

## Architecture

```
UI modules/brain-simulation
  → application/brain-simulation
    → domain/brain/manufacturing-simulation
         scenario-catalog.ts
         simulator.ts
         simulation.service.ts
    → manufacturing-planning + manufacturing-reasoning (read)
```

**sideEffects:** `NONE`  
**Routes:** `/brain-simulation/{coverage,scenarios,compare,timeline,impacts}`  
**Permission:** `ai.read`

---

## Non-goals

- No chat / Copilot / prompts  
- No external LLM  
- No ERP schedule / PO / inventory writes  
