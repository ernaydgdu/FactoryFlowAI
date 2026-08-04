# SCANNER-REPORT.md — Phase 5 Module 3

**Scope:** Camera Scanner abstraction + application scan commands.

## Abstraction

| Handle | Role |
|--------|------|
| `createManualTextScanner` | Default — keyboard / wedge inject |
| `createStubCameraScanner` | Camera skeleton — `getUserMedia` / `BarcodeDetector` hook point |

Both expose `start` / `stop` / `isRunning` / `injectManual`. UI selects mode on Scanner Screen.

## Application commands

| Command | Behavior |
|---------|----------|
| `executeScanOperation` | Resolve OP barcode → execution context + operation |
| `executeScanBundle` | Resolve via `lookupBundleByScan` |
| `executeScanMaterial` | Resolve stock card by code |
| `executeScanFinishedGoods` | Resolve UE / `fg-` / pallet-with-UE |
| `executeScanProduction` | UE or OP → production context |

Optional `offline: true` enqueues instead of resolving immediately.

## Vendor lock-in

None — no third-party scanner SDK dependency.
