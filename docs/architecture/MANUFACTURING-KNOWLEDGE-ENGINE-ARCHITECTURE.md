# Manufacturing Knowledge Engine — Architecture Report

**Subsystem:** Kepler Brain / Manufacturing Knowledge  
**Date:** 2026-08-04  
**Milestone:** Knowledge layer only — **no LLM**, no chat, no prompt engineering  
**Freeze:** No new aggregate ports; Packaging / Finance / Planning modules untouched

---

## Mission

Kepler evolves from ERP → **textile manufacturing intelligence platform**.  
Brain is built **inside** the system. First milestone is the **Manufacturing Knowledge Engine**.

---

## Pipeline

```
Knowledge → Reasoning → Planning → Decision → Recommendation → Automation
```

| Layer | This milestone |
|-------|----------------|
| Knowledge | **Implemented** — schemas, catalog, graph, formula eval, query surface, UI browse |
| Reasoning | Schema + sample plans only (`ReasoningSchema`, `llmEnabled: false`) |
| Planning | Deferred |
| Decision | Decision **library** (expert trees) as knowledge; runtime planner deferred |
| Recommendation | Deferred (consume KPI recommendationLogic later) |
| Automation | Deferred |

---

## Architecture

```
UI modules/brain-knowledge
  → application/brain-knowledge (hooks / application-service)
    → domain/brain/manufacturing-knowledge
         types.ts      — knowledge / formula / rule / dictionary / flow / decision / machine / KPI / reasoning schemas
         catalog.ts    — seeded structured entities (not documents)
         query.service.ts — read + deterministic formula evaluation
```

**Persistence:** In-memory domain catalog (Freeze-safe). No new `IUnitOfWork` ports.  
**Side effects:** `NONE`. Formula evaluation is pure.  
**External AI:** Forbidden (OpenAI / Claude / Gemini / etc.).

---

## Schemas delivered

| Schema | Location |
|--------|----------|
| Textile Knowledge categories | `KnowledgeCategory` |
| Knowledge Graph | `KnowledgeConceptNode` / `Edge` / `ManufacturingKnowledgeGraph` |
| Formula Library | `FormulaDefinition` + `evaluateFormula` |
| Business Rule Library | `BusinessRuleDefinition` |
| Textile Dictionary | `DictionaryEntry` |
| Production Flow Library | `ProductionFlowDefinition` |
| Decision Library | `DecisionDefinition` |
| Machine / Operation Library | `MachineDefinition` / `OperationDefinition` |
| KPI Knowledge | `KpiDefinition` |
| Reasoning Schema | `ReasoningSchema` (primitives + sample plans) |

---

## Routes (browse only)

`/brain-knowledge/{coverage,dictionary,graph,formulae,rules,flows,decisions,machines,kpis}`  
Permission: `ai.read`

---

## Non-goals (enforced)

- No chatbot / AI assistant rewrite
- No OpenAI/Claude/Gemini integration
- No rewrite of Packaging, Finance, Planning, or other Freeze modules
- No mutate-from-knowledge automation yet

---

## Next Brain milestones

1. Reasoning engine consuming rules + formulae + graph traversal  
2. Planning suggestions bound to Kepler permissions  
3. Decision runtime with audit  
4. Recommendation surfaces (deterministic)  
5. Optional governed LLM **only after** durable knowledge + authz + audit (see `AI-ROADMAP.md` Phase AI-5)
