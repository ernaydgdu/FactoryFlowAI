# TECHNICAL-DEBT-REPORT.md — Phase 5 Module 3

| Item | Status |
|------|--------|
| In-memory offline queue | **Removed** — localStorage durable queue |
| Stub camera | **Removed** — real BarcodeDetector / getUserMedia |
| Resolve-only scans without write path | **Closed** for receiving/issue/production/FG/shipment |
| Shipment without persist | **Closed** — `persistShipment` on stock ledger |
| GS1 binary Code128 glyph renderer | Open (low) — AI string sufficient for scan path |
| Service worker offline shell | Open (low) — manifest + queue cover operator sync |

**Gate:** No intentional demo/mock write paths remain for Module 3 workflows.
