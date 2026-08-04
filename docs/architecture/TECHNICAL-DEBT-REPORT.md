# TECHNICAL-DEBT-REPORT.md — Phase 5 Module 3 (Barcode & Mobile)

| Item | Severity | Notes |
|------|----------|-------|
| GS1-128 binary Code128 encoder absent | Low | AI string skeleton only — print engines later |
| QR render (canvas/SVG) absent | Low | Payload JSON only; label UI shows text |
| Camera: no `getUserMedia` / BarcodeDetector | Medium | Stub scanner; device integration next |
| Offline queue not durable | Medium | Intentional skeleton — no new persistence port |
| No service worker / offline shell cache | Medium | Manifest-only PWA installability |
| Operator auth is sessionStorage | Low | IAM integration deferred |
| Warehouse pallet scan piggybacks FG command | Low | Acceptable for skeleton; dedicated pallet command later |

**Acceptable for Module 3 gate** — skeletons explicit; Architecture Freeze preserved.
