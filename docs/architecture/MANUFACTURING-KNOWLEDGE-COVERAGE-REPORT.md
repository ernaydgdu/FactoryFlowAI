# Manufacturing Knowledge Coverage Report

**Date:** 2026-08-04  
**Source:** `domain/brain/manufacturing-knowledge/catalog.ts` + `queryManufacturingKnowledgeCoverage()`  
**llmEnabled:** false

---

## Totals (seed catalog)

| Asset | Count |
|-------|------:|
| Concepts (graph nodes) | 30 |
| Graph edges | 25 |
| Formulae | 8 |
| Business rules | 5 |
| Dictionary terms | 28 |
| Production flows | 2 |
| Decision trees | 2 |
| Machines | 10 |
| Operations | 10 |
| KPIs | 12 |

---

## Category coverage (Step 1)

| Category | Present in catalog |
|----------|-------------------|
| Textile Terminology | Yes (concepts + dictionary) |
| Manufacturing Concepts | Yes |
| Business Rules | Yes (rule objects) |
| Calculation Formulae | Yes (executable evaluators) |
| Production Flows | Yes (navigable steps) |
| Machine Library | Yes |
| Operation Library | Yes |
| Quality Rules | Yes (AQL, inspection-fail rule) |
| Planning Rules | Yes (MRP formula + category) |
| Inventory Rules | Yes (FIFO) |
| Purchasing Rules | Yes (flow + concepts) |
| Warehouse Rules | Yes |
| Shipment Rules | Yes (block shipment rule) |
| Cost Rules | Yes (cutting cost, waste) |
| Finance Rules | Yes (finance concept + flow end) |
| KPI Library | Yes |
| Decision Rules | Yes (LOW_STOCK, LATE_ORDER) |
| Expert Heuristics | Yes (decision trees / KPI recommendationLogic) |
| AI Reasoning Rules | Yes (ReasoningSchema sample plans; no LLM) |

---

## Graph example (Step 2)

Cotton Fabric → Shrinkage → Recipe → Cutting → Sewing → Quality → Packing → Shipment  
Plus Order → Product → BOM → MRP → Purchasing → Receiving → Warehouse → Cutting → … → Finance

---

## Formula examples (Step 3)

| Code | Expression |
|------|------------|
| EFFICIENCY | production / worker |
| CUTTING_COST_UNIT | totalCuttingCost / quantity |
| MARKER_EFFICIENCY | templateArea / markerArea |
| TOP_END | rollLength - markerLength × layers |
| MRP_NET_REQUIREMENT | gross - stock - openPO - openProduction |
| OEE | availability × performance × quality |

Evaluators are deterministic switches (`div`, `top_end`, `mrp_net`, `product3`) — not arbitrary `eval`.

---

## Gaps (honest)

| Gap | Note |
|-----|------|
| Catalog depth | Seed is foundational, not exhaustive textile encyclopaedia |
| Rule runtime | Rules are machine-readable objects; full condition evaluator deferred to Reasoning layer |
| ERP binding | Knowledge references modules by id; does not mutate Packaging/Finance/Planning |
| Reasoning/Planning/Automation | Schema/stubs only |

---

## Validation

```bash
npm run validate:manufacturing-knowledge
```

Browse: `/brain-knowledge/coverage`
