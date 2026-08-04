import {
  listManufacturingMemoryPresets,
  queryManufacturingMemoryByIndex,
  queryManufacturingMemoryByStyle,
  queryManufacturingMemoryCoverage,
  queryManufacturingMemoryIndexes,
  queryManufacturingMemoryPreset,
  queryManufacturingMemoryRecords,
  replayManufacturingProductionOrder,
  runManufacturingMemory,
  type MemoryIndexKey,
  type MemoryQueryPreset,
} from '@/domain/brain/manufacturing-memory'

export const brainMemoryApplicationService = {
  query: {
    run: runManufacturingMemory,
    coverage: queryManufacturingMemoryCoverage,
    records: queryManufacturingMemoryRecords,
    indexes: queryManufacturingMemoryIndexes,
    byIndex: (index: MemoryIndexKey, key?: string) =>
      queryManufacturingMemoryByIndex(index, key),
    byStyle: (styleCode: string) => queryManufacturingMemoryByStyle(styleCode),
    replayProductionOrder: (productionOrderNo: string) =>
      replayManufacturingProductionOrder(productionOrderNo),
    preset: (preset: MemoryQueryPreset, styleCode?: string) =>
      queryManufacturingMemoryPreset(preset, styleCode),
    presets: listManufacturingMemoryPresets,
  },
}
