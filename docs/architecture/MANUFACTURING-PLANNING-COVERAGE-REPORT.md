# Manufacturing Planning Coverage Report

**Date:** 2026-08-04  
**Source:** `domain/brain/manufacturing-planning`  
**llmEnabled:** false · **sideEffects:** NONE

---

## Delivered outputs

| Output | Status |
|--------|--------|
| Production sequencing | Yes |
| Capacity allocation | Yes |
| Machine allocation | Yes |
| Operator allocation | Yes |
| Material allocation | Yes |
| Purchasing suggestions | Yes |
| Shipment impact | Yes |
| Delivery risk | Yes |
| Critical path | Yes |
| Bottleneck analysis | Yes |
| Alternative plans A/B/C | Yes |
| Confidence score | Yes |
| Plan explanation (why/assumptions/constraints/KPIs/risks) | Yes |

---

## Consumption

Planning calls `runManufacturingReasoning()` then builds three strategy variants. Preferred variant = highest confidence.

---

## Routes

`/brain-planning/coverage`  
`/brain-planning/plans`  
`/brain-planning/sequencing`  
`/brain-planning/allocation`  
`/brain-planning/risk`  
`/brain-planning/explanation`

---

## Freeze

No new ports · no ERP mutation · Packaging/Finance/Planning modules not rewritten · validate:manufacturing-planning gate
