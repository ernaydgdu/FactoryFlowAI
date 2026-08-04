# BARCODE-REPORT.md — Phase 5 Module 3 (production)

## Capabilities

| Capability | Implementation |
|------------|----------------|
| GS1-128 | AI decode `(01)(10)(21)(37)` + encode skeleton |
| QR | JSON payload encode/decode |
| Receiving scan | `executeReceivingScan` → `persistPostGoodsReceipt` |
| Material issue | `executeMaterialIssueScan` → `persistGoodsIssue` |
| Production scan | `executeProductionScanWorkflow` → `persistProductionDeclaration` |
| FG receipt | `executeFgReceiptScan` → `persistFinishedGoodsReceipt` |
| Shipment | `executeShipmentScan` → `persistShipment` (new thin ledger write) |
| Offline + sync | localStorage queue + TX flush |
| Camera | `BarcodeDetector` + `getUserMedia` + manual wedge |

## Mutation guarantees

- Commands wrapped in `runCommandInTransaction`
- Idempotent keys prevent double-post
- Audit / enterprise or execution timeline / outbox via existing persist paths
