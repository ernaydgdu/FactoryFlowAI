# Kepler Brain Architecture Bible

## Volume 1 — Chapter 2

### Knowledge Engine & Reasoning Engine

> **Status:** Locked — v2.0.0-domain  
> **Prerequisite:** [Chapter 1 — Enterprise Decision Platform](KEPLER-BRAIN-FOUNDATION.md)  
> **Path:** `docs/architecture/KEPLER-BRAIN-CHAPTER-2.md`  
> **Code:** `frontend/src/domain/brain/engines/`

---

## Amaç

Kepler Brain bir chatbot değildir. **Enterprise Decision System**'dir.

Chapter 2, bilgi edinme (Knowledge), düşünme (Reasoning), açıklama (Explainable AI) ve alternatif üretme mantığını tanımlar.

**LLM yok. API yok. UI yok.**

---

## Engine Haritası

| Engine | Dosya | Görev |
|---|---|---|
| **Knowledge Engine** | `engines/knowledge-engine.ts` | ERP → Knowledge Graph (read-only) |
| **Fact Engine** | `engines/fact-engine.ts` | Fact vs Assumption ayrımı |
| **Confidence Engine** | `engines/confidence-engine.ts` | 0-100 güven skoru |
| **Explanation Engine** | `engines/explanation-engine.ts` | Explainable AI bileşen puanları |
| **Alternative Engine** | `engines/alternative-engine.ts` | Min 3 alternatif + trade-off |
| **Reasoning Engine** | `engines/reasoning-engine.ts` | Reasoning Tree orchestrator |
| **Goal Engine** | `engines/goal-engine.ts` | Hedef takibi ve sapma |
| **Brain Health** | `engines/brain-health-engine.ts` | Analiz kalitesi izleme |
| **Brain Personas** | `engines/persona-registry.ts` | 8 uzman advisor |
| **Brain Version** | `engines/brain-version.ts` | Algoritma versiyonlama |
| **Plugin Registry** | `plugins/plugin-registry.ts` | Genişletilebilir plugin mimarisi |

---

## Knowledge Graph

```
ORDER → PRODUCT → BOM → MRP → PURCHASE → WAREHOUSE
  → PRODUCTION → QUALITY → SHIPMENT → COST → PROFITABILITY
```

- Graph benzeri node/edge yapısı
- Her node `dataQuality`: COMPLETE | PARTIAL | MISSING
- **INSERT / UPDATE / DELETE yasak**

---

## Reasoning Tree

```
Question
  ↓ Facts (yalnızca FACT, assumption reddedilir)
  ↓ Evidence
  ↓ Reasoning Steps
  ↓ Alternatives (min 3)
  ↓ Trade-Off (maliyet/termin/kalite/kapasite/risk)
  ↓ Explanation (bileşen puanları)
  ↓ Confidence (0-100)
```

---

## Confidence Faktörleri (0-100)

| Faktör | Ağırlık |
|---|---|
| DATA_QUALITY | 0.20 |
| MISSING_DATA | 0.20 |
| RULE_COVERAGE | 0.10 |
| HISTORICAL_SIMILARITY | 0.10 |
| PLANNING_CONSISTENCY | 0.15 |
| BOM_CONSISTENCY | 0.10 |
| TIMELINE_CONSISTENCY | 0.15 |

Eksik veri varsa Brain tahmin uydurmaz — incomplete analysis döner.

---

## Brain Personas (8)

Planning, Purchasing, Warehouse, Production, Quality, Cost, Executive, Merchandising Advisor.

Her persona yalnızca kendi `allowedSources` listesini kullanır.

---

## Plugin Architecture

Forecast, Carbon, ESG, Vision, OCR, IoT — kayıtlı stub plugin'ler.

Çekirdek Brain plugin olmadan çalışır (`optional: true`).

---

## Brain Version

Her analiz `VersionedAnalysisMetadata` taşır:
- `brainVersion`: `2.0.0-domain`
- `algorithmVersion`: `2.0.0-chapter2`
- `personaId`
- `pluginIds`

---

## İlgili Dokümanlar

- [Chapter 1](KEPLER-BRAIN-FOUNDATION.md)
- [ERP Foundation](FOUNDATION.md)
