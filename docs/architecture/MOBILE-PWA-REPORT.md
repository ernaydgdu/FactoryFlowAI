# MOBILE-PWA-REPORT.md — Phase 5 Module 3

| Capability | Status |
|------------|--------|
| Operator login | Session operator id for actorUserId |
| Workflow screens | Receiving, Material Issue, Production, FG Receipt, Shipment |
| Offline queue | Durable `localStorage` (max 200), idempotent keys |
| Sync | `syncOfflineQueue` → TX + workflow persist |
| PWA manifest | Present (`/barcode-mobile/operator`) |
| Camera | Live `getUserMedia` + `BarcodeDetector` |
