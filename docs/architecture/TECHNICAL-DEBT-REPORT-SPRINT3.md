# Technical Debt Report — Sprint 3 (Pre-Implementation)

**Generated:** 2026-08-02

---

## Sprint 2'den Devreden Borç (Execution Blocker)

| ID | Borç | Sprint 3 Aksiyonu |
|----|------|-------------------|
| TD-S2-01 | UE-level daily entry only | → Operation daily entry |
| TD-S2-02 | BR-05/06/07 not called from daily entry | → Wire in operation-execution-service |
| TD-S2-03 | BR-11 split domain-only | → split-execution-service + lifecycle |
| TD-S2-04 | Quality gates disconnected | → quality-gate-service |
| TD-S2-05 | Bundle/WIP zero implementation | → bundle-tracking + wip-query |
| TD-S2-06 | 3 parallel production tracks | → Canonical path documented |
| TD-S2-07 | In-memory lifecycle store | → Retain Phase 1; persistence Sprint 4+ |
| TD-S2-08 | Synthetic operation progress | → Real progress from execution |

---

## Sprint 3 Sırasında Bilinçli Kabul

| Karar | Gerekçe | Borç ID |
|-------|---------|---------|
| Barcode scan UI simülasyon (lookup by code) | RF hardware Phase 2 | TD-S3-01 |
| Renk/beden matrix partial (header + lines) | Full variant PO Sprint 4 | TD-S3-02 |
| Kumaş lot on bundle optional field | Full traceability Sprint 4 | TD-S3-03 |
| Production calendar hour grid mock seed | Real APS Sprint 5 | TD-S3-04 |
| Cutting module link via domain API only | Cutting UI unchanged | TD-S3-05 |

---

## Sprint 3 Yeni Borç Riskleri (Önleme)

| Risk | Önlem |
|------|-------|
| execution-platform modülü engine'e dönüşür | Max 9 service files; no autonomous scheduler |
| UI şişmesi ("yeni ekran yapmak değil") | Lifecycle detail tab genişletme + 1 execution panel |
| Brain write leak | Adapter contract test; forbidden ops check |
| Performance regression (WIP calc) | wip-query cache 30s TTL; incremental update |
| Twin sideEffects breach | Scenario wrapper enforces NONE |

---

## Borç Kategorileri (Post-Sprint 3 Tahmin)

| Kategori | Mevcut | Sprint 3 Sonrası (tahmin) |
|----------|--------|---------------------------|
| Execution blocker | 8 item | 0–2 item |
| Shop floor maturity | 18% | 75% |
| Persistence | In-memory | In-memory (unchanged) |
| MES/RFID | None | Simulated lookup |
| Tier-1 parity gap | ~52% | ~68% |

---

## P1/P2 Sprint 4+ Backlog

- Persistence layer (PostgreSQL execution tables)
- Real barcode/RFID device integration
- Full color/size variant PO
- Kumaş lot genealogy
- Labor payroll bridge
- MES real-time feed
- Legacy `/production/*` deprecation

**Sprint 3 borç hedefi: Execution blocker'ların kapatılması, persistence bilinçli erteleme**
