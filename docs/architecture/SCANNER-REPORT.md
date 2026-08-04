# SCANNER-REPORT.md — Phase 5 Module 3

| Handle | Role |
|--------|------|
| `createManualTextScanner` | Wedge / keyboard inject |
| `createCameraScanner` | `BarcodeDetector` + `getUserMedia` (environment camera) |

Fail-open to manual when detector/camera unavailable — not a mock write path.

Application workflow commands: `executeReceivingScan`, `executeMaterialIssueScan`, `executeProductionScan`, `executeFgReceiptScan`, `executeShipmentScan` — all TX-wrapped and idempotent.
