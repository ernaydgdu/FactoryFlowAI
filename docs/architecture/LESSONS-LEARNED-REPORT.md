# Lessons Learned Report — GAP Analysis

**Generated:** 2026-08-03

---

## Executive Summary

Kepler Brain **operasyonel insight** üretir (capacity, termin risk, WIP); **style close post-mortem paketi** yok. Kapanışta otomatik lessons learned raporu Tier-1'de standard; Brain altyapısı partial reuse sağlar.

---

## Mevcut Brain Capabilities

| Bileşen | Konum | Close relevance |
|---------|-------|-----------------|
| Knowledge Engine | `brain/engines/` | Entity graph |
| Recommendation Layer | `recommendation-layer.ts` | Live ops |
| Textile Entity Registry | `textile-entity-registry.ts` | Cost/order snapshot |
| AI Memory | `ai-memory-service.ts` | Event severity |
| Twin / Simulation | `brain/twin/` | What-if, not post-close |
| Decision Memory | `brainDecisionMemory` port | Historical decisions |

**Missing:** Close-triggered batch analysis job, lessons learned document aggregate.

---

## Kapanış Analizleri — GAP Matrisi

| Analiz | Veri kaynağı (hedef) | Kepler | P |
|--------|---------------------|--------|---|
| Termin başarısı | EXF plan vs actual | ⚠️ Termin engine | P0 |
| Fire analizi | Production waste qty | ⚠️ Order field | P0 |
| Rework analizi | QC repair + rework | ⚠️ QC demo | P0 |
| Quality Score | AQL aggregate | ⚠️ Per inspection | P0 |
| Production Efficiency | Plan vs actual output | ⚠️ Execution platform | P1 |
| Line Efficiency | OEE by line | ⚠️ Sewing demo | P1 |
| Operator Efficiency | Work session | ⚠️ Execution platform | P1 |
| Machine Efficiency | Machine downtime | ❌ | P2 |
| Cost Accuracy | Plan vs actual cost | ❌ | P0 |
| Buyer Performance | On-time payment/claim | ❌ | P1 |
| Supplier Performance | OTIF, quality | ⚠️ Purchase chain trace | P1 |
| Delay Root Cause | TNA revision + risks | ⚠️ Risk engine | P0 |
| Risk Summary | RiskSignal rollup | ⚠️ Partial | P1 |
| AI Recommendations | Brain synthesis | ⚠️ Live only | P1 |

---

## Önerilen Close Trigger

```
StyleCloseCommitted event
  → Outbox handler: lessons-learned-generator
  → Persist LessonsLearnedReport (append-only)
  → Brain ingest for future orders (same buyer/style family)
  → Dashboard + PDF export
```

Kepler outbox pattern **hazır**; lessons learned handler **yok**.

---

## Öncelik

| ID | Gap | P |
|----|-----|---|
| LL-P0-01 | LessonsLearnedReport aggregate | P0 |
| LL-P0-02 | Close-triggered batch job | P0 |
| LL-P0-03 | Termin/fire/rework/cost accuracy | P0 |
| LL-P1-01 | Line/operator efficiency rollup | P1 |
| LL-P1-02 | Buyer/supplier scorecards | P1 |
| LL-P2-01 | Machine efficiency | P2 |

---

## Sonuç

Brain **canlı operasyon** için güçlü; **kapanış analitiği modülü %90 eksik**.
