# Architecture Integrity Report — Sprint 3 (Pre-Implementation)

**Generated:** 2026-08-02  
**Phase:** Analiz — kod öncesi mimari plan

---

## Constitutional Compliance Plan

| Constitution | Sprint 3 Uyum Stratejisi |
|--------------|-------------------------|
| **Foundation Principles** | Business logic yalnızca `domain/execution-platform/` |
| **Performance Constitution** | WIP query cache TTL; bundle list virtual scroll |
| **Sprint Manifesto** | Yeni engine YOK — domain service orchestration |
| **Kepler ERP Philosophy** | Platform süreç yönetir; ekran ince kalır |
| **Brain Principles** | READ ONLY adapter; ledger mutation YOK |
| **UI → Application → Domain** | Tüm yeni UI application hooks üzerinden |

---

## Mevcut Integrity Skoru

| Alan | Skor | Not |
|------|------|-----|
| Domain engine bütünlüğü | 100% | Değişmeyecek |
| Sprint 2 lifecycle modülü | 98% | Korunacak |
| Genel Application Layer | ~74% | Sprint 3 yeni modül %100 olacak |
| Brain READ ONLY | 17/17 | +1 EXECUTION_PLATFORM |
| Route integrity | 57/57 | Yeni route'lar validate edilecek |

---

## Sprint 3 Domain Tasarımı (Yeni Engine Yok)

### Yeni domain modülü: `domain/execution-platform/`

| Dosya | Sorumluluk | Engine mi? |
|-------|------------|------------|
| `execution-types.ts` | OperationExecution, Bundle, WIPPosition, GateResult | Hayır — types |
| `operation-execution-service.ts` | Start/pause/complete operasyon | Hayır — orchestrator |
| `bundle-tracking-service.ts` | Bundle create, ticket, barcode, location | Hayır — service |
| `wip-query-service.ts` | WIP aggregation (Brain feed) | Hayır — query (WIP "Engine" adlandırması yasak) |
| `quality-gate-service.ts` | Inline/midline/final gate eval | Hayır — mevcut QC + BR-13 çağırır |
| `split-execution-service.ts` | BR-11 + lifecycle child UE | Hayır — mevcut split-service wrap |
| `execution-calendar-service.ts` | Hat/gün/saat plan modeli | Hayır — planning read + execution write |
| `execution-timeline-service.ts` | Platform timeline emit wrapper | Hayır — platform delegate |
| `execution-brain-query.ts` | Brain READ ONLY insights | Hayır — query |
| `index.ts` | Public exports | — |

### Orchestration kuralları

```
operation-execution-service
  → operationRepository (master data)
  → ruleProductionEntry (BR-05/06/07) — daily entry complete
  → quality-gate-service — next op block
  → platformPublish + addTimelineEntry

split-execution-service
  → production-split-service (mevcut)
  → ruleProductionOrderSplit (BR-11)
  → lifecycle-service (child UE create — extend, not replace)

quality-gate-service
  → quality-rework-service (mevcut)
  → ruleQualityRework (BR-13)
  → operation-execution-service (block transition)
```

---

## Katman Sözleşmesi

```
UI (minimal — mevcut lifecycle detail genişletme + execution panel)
  ↓
application/execution-platform/ (DTO, mapper, hooks)
  ↓
domain/execution-platform/ (business logic)
  ↓
Mevcut: BR engine, stock ledger, master data, platform, brain, twin
```

### Dokunulmayacak modüller

- `production-planning/*` — read-only referans
- `production-order-lifecycle/*` — extend via domain hook, UI minimal
- `business-rule-engine.ts` — değiştirme YOK (yalnızca çağrı)
- `planning-engine.ts`, `stock-ledger.ts` — değiştirme YOK
- Legacy `/production/*`, `/quality/*` pages — bozulmayacak

### Genişletme noktaları (minimal diff)

| Mevcut | Genişleme |
|--------|-----------|
| `lifecycle-service.ts` | `linkExecutionPlatform()`, split child refs |
| `lifecycle-types.ts` | `executionRef`, `childOrderNos[]` optional fields |
| `production-order-lifecycle-adapter.ts` | Delegates to execution-brain-query |
| `brain/adapters/index.ts` | +executionPlatformAdapter |
| `brain/constants.ts` | +EXECUTION_PLATFORM source |
| `scenario-engine.ts` | Mevcut 9 senaryo — yeni param binding only |

---

## Integrity Riskleri ve Mitigasyon

| Risk | Mitigasyon |
|------|------------|
| 3 paralel production track | Lifecycle + execution canonical; planning read-only |
| Duplicate daily entry | Lifecycle daily → operation daily migrate |
| lifecycle-service şişmesi | Execution logic ayrı modülde |
| "WIP Engine" isimlendirmesi | `wip-query-service` — constitution uyumlu |
| Quality pages kopuk kalır | Gate service bridge; sayfalar bozulmaz |
| Split double-implementation | Tek SSOT: production-split-service |

---

## Hedef Integrity (Post-Sprint 3)

| Metrik | Hedef |
|--------|-------|
| Sprint 3 modül Application Layer | 100% |
| UI domain import | 0 |
| Yeni engine count | 0 |
| Brain adapter READ ONLY | 18/18 |
| Mevcut modül regression | 0 break |
| Architecture Integrity | ≥95% |

**Mevcut plan integrity: PASS (tasarım aşaması)**
