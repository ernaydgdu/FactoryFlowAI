# Manufacturing Planning Engine — Architecture Report

**Subsystem:** Kepler Brain / Manufacturing Planning (Phase 9.3)  
**Date:** 2026-08-04  
**Milestone:** Planning layer — **no LLM**, no chat, no Copilot  
**Freeze:** Recommend-only; never mutates ERP; no module rewrites

---

## Mission

Consume Knowledge + Facts + Reasoning + Constraints + Decisions and generate **executable production plan recommendations** (A / B / C).

---

## Pipeline position

```
Knowledge → Reasoning → Planning → Decision → Recommendation → Automation
```

This milestone implements **Planning** (read-only recommendations).

---

## Inputs consumed

| Source | Usage |
|--------|--------|
| Manufacturing Knowledge | Machines, operations, production flows |
| Fact Engine (via Reasoning run) | Inventory, orders, MRP, quality, capacity signals |
| Rule / Constraint / Decision results | Shape sequencing strategy & bottleneck relief |
| Reasoning recommendations | Confidence / OTIF vs material bias |

---

## Plan outputs

- Production sequencing  
- Capacity / machine / operator / material allocation  
- Purchasing suggestions  
- Shipment impact  
- Delivery risk  
- Critical path  
- Bottleneck analysis  
- Alternative plans **A / B / C**  
- Confidence score  

### Strategies

| Variant | Strategy |
|---------|----------|
| A | OTIF first — termin-risk priority, overtime, partial ship |
| B | Efficiency first — balance utilization, alternate WC |
| C | Material constrained — purchase/readiness before load |

---

## Explanation contract

Every plan includes:

- Why this plan  
- Assumptions  
- Constraints evaluated  
- KPIs improved  
- Risks remaining  

---

## Architecture

```
UI modules/brain-planning
  → application/brain-planning
    → domain/brain/manufacturing-planning
         planning.service.ts   (orchestrator)
         plan-builder.ts
         sequencing-allocation.ts
         impact-analysis.ts
    → domain/brain/manufacturing-reasoning (runManufacturingReasoning)
    → domain/brain/manufacturing-knowledge
```

**sideEffects:** `NONE`  
**Routes:** `/brain-planning/{coverage,plans,sequencing,allocation,risk,explanation}`  
**Permission:** `ai.read`

---

## Non-goals

- No chat / Copilot / prompts  
- No OpenAI / Claude / Gemini  
- No ERP write / schedule mutate / PO release from Brain  
- Automation layer deferred  
