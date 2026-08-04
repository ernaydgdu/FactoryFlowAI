# BARCODE-REPORT.md — Phase 5 Module 3

**Scope:** Barcode / QR / GS1-128 skeleton + Bundle & Pallet labels + scan resolve.

## Delivered

| Capability | Implementation |
|------------|----------------|
| Bundle barcode | Reuses `KPL-BUNDLE-V1` via `parseBundleBarcode` / `lookupBundleByScan` |
| Operation barcode | `KPL-OP-V1\|UE\|OP` encode/decode |
| Material barcode | `KPL-MAT-V1\|code` + stock card code fallback |
| Finished Goods | `KPL-FG-V1\|UE` + `fg-{UE}` compatibility |
| Pallet barcode | `KPL-PAL-V1\|WH\|SEQ\|UE` |
| QR | JSON payload (`encodeQrPayload`) |
| GS1-128 | AI string skeleton `(01)(10)(37)` — no binary Code128 encoder |
| Bundle Label | `buildBundleLabel` |
| Pallet Label | `buildPalletLabel` |
| FG Label | `buildFinishedGoodsLabel` |

## Scan resolve

- `executeScanOperation` / `executeScanBundle` / `executeScanMaterial` / `executeScanFinishedGoods` / `executeScanProduction`
- Read-only against existing production order, stock card, execution context, bundle lookup ports

## Constraints

- No new persistence aggregate
- Shop Floor / Quality aggregates untouched
