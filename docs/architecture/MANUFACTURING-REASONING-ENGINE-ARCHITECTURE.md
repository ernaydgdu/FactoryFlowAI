# Manufacturing Reasoning Engine — Architecture Report

**Subsystem:** Kepler Brain / Manufacturing Reasoning  
**Date:** 2026-08-04  
**Milestone:** Reasoning layer — **no LLM**, no chat, no prompt engineering  
**Freeze:** No new aggregate ports; ERP modules read-only; Packaging / Finance / Planning writes untouched

---

## Mission

Kepler Brain reasons like an industrial inference engine using structured Manufacturing Knowledge + live ERP facts.

---

## Pipeline

```
Facts → Knowledge Graph → Business Rules → Formula Engine → Constraint Engine → Decision Engine → Recommendation Engine
```

| Component | Role |
|-----------|------|
| Fact Engine | ERP query services → `BrainFact` + `FactContext` |
| Knowledge Graph | Traverse concept neighbors for evidence |
| Rule Engine | Evaluate `BUSINESS_RULES` → PASS / WARNING / CRITICAL / BLOCKED |
| Formula Engine | Bind facts into `evaluateFormula` (deterministic) |
| Constraint Engine | Capacity / Material / Machine / Quality / Shipment / Financial |
| Decision Engine | Walk LOW_STOCK / LATE_ORDER trees; rank candidates |
| Recommendation Engine | Explain why / risk / confidence / alternative — **never mutates ERP** |

---

## Architecture

```
UI modules/brain-reasoning
  → application/brain-reasoning
    → domain/brain/manufacturing-reasoning
         fact-engine.ts
         rule-engine.ts
         constraint-engine.ts
         decision-engine.ts
         recommendation-engine.ts
         reasoning.service.ts  (orchestrator)
    → domain/brain/manufacturing-knowledge  (catalog + evaluateFormula)
    → domain/*/…-query.service  (ERP reads only)
```

**Side effects:** `NONE`  
**External AI:** Forbidden  
**Automation:** Deferred (Planning / Automation layers)

---

## Recommendation contract

Every recommendation includes:

- Reason  
- Evidence  
- Business Rules Used  
- Formulae Used  
- Confidence  
- Affected Modules  
- Risk  
- Alternative  

---

## Routes (browse only)

`/brain-reasoning/{coverage,facts,rules,constraints,decisions,recommendations}`  
Permission: `ai.read`

---

## Non-goals

- No chatbot / copilot / prompts  
- No OpenAI / Claude / Gemini  
- No rewrite of ERP modules  
- No shipping / finance / planning command calls from Brain  
