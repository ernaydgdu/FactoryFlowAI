# Kepler Brain Architecture Bible

## Volume 1 — Chapter 3

### Digital Factory Twin & Decision Intelligence

> **Status:** Locked — v3.0.0-domain  
> **Prerequisite:** [Chapter 1](KEPLER-BRAIN-FOUNDATION.md), [Chapter 2](KEPLER-BRAIN-CHAPTER-2.md)  
> **Path:** `docs/architecture/KEPLER-BRAIN-CHAPTER-3.md`  
> **Code:** `frontend/src/domain/brain/twin/`

---

## Felsefe

| Sistem | Rol |
|---|---|
| **ERP** | Olanı kaydeder |
| **Kepler Brain** | Olanı yorumlar |
| **Digital Twin** | Olanı simüle eder |

Kepler ERP yalnızca ERP değildir — fabrikanın dijital ikizidir.

---

## Digital Factory Twin Engine'leri

| Engine | Dosya | Görev |
|---|---|---|
| **Factory Graph** | `factory-graph-engine.ts` | 20 node tipi, relationship ağı |
| **Resource Graph** | `resource-graph-engine.ts` | Order → Customer kaynak zinciri |
| **Flow Engine** | `flow-engine.ts` | Sipariş aşama takibi |
| **Bottleneck Engine** | `bottleneck-engine.ts` | Darboğaz tespiti |
| **Root Cause Engine** | `root-cause-engine.ts` | Sebep zinciri ağacı |
| **Dependency Engine** | `dependency-engine.ts` | Sipariş bağımlılık ağı |
| **Impact Engine** | `impact-engine.ts` | Olay etki analizi |
| **Scenario Engine** | `scenario-engine.ts` | What-If (9 senaryo tipi) |
| **Prediction Engine** | `prediction-engine.ts` | Gelecek projeksiyon |
| **Early Warning Engine** | `early-warning-engine.ts` | Proaktif uyarı |
| **Decision Memory** | `decision-memory-engine.ts` | Şirket geçmişi (tenant-scoped) |
| **Playbook Engine** | `playbook-engine.ts` | Prosedür bazlı sıralama |
| **Human Feedback** | `human-feedback-engine.ts` | Kabul/red öğrenme |
| **Digital Twin Health** | `digital-twin-health-engine.ts` | Twin kalite skoru |
| **Twin Orchestrator** | `twin-orchestrator.ts` | Pipeline orchestrator |

---

## Factory Graph Node Tipleri

Factory, Workshop, Production Line, Machine, Operator, Warehouse, Stock Card, Order, Product, Operation, Container, Supplier, Customer, Material, BOM, Purchase Order, Production Order, Shipment, Quality Inspection, Timeline Event

## Relationship Tipleri

USES, CONSUMES, LOCATED_IN, SUPPLIES, RUNS, CONTAINS, OPERATES, ASSIGNED_TO, PRODUCES, SHIPS_TO, ORDERED_BY, DEPENDS_ON, TRIGGERS, FOLLOWS

---

## Anayasal Kurallar

- `sideEffects: 'NONE'` — ERP verisi değişmez
- `finalDecisionOwner: 'USER'` — otomatik karar yok
- Decision Memory / Feedback — yalnızca aynı şirket
- Cross-tenant learning yasak
- LLM yok, API yok, UI yok

---

## Pipeline Entegrasyonu

Brain Kernel: `REASONING → DIGITAL_TWIN`

`BrainPipelineResult.twinIntelligence` alanında tam twin çıktısı.

---

## Demo

```typescript
import { BRAIN_CHAPTER3_DEMO, runDigitalTwinIntelligence } from '@/domain/brain'
```
