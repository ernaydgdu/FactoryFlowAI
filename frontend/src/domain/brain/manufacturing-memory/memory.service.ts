/**
 * Manufacturing Memory Engine — orchestrator.
 * Collect → append-only persist → index → query.
 * No LLM. No ERP mutation. No learning/optimization.
 */
import { collectManufacturingMemoryRecords } from './collector'
import {
  buildMemoryCoverage,
  buildMemoryIndexes,
  MEMORY_QUERY_PRESETS,
  queryMemoryByIndex,
  queryMemoryByStyle,
  replayProductionOrderTimeline,
  runMemoryQueryPreset,
} from './query.service'
import { appendMemoryRecords, listAllMemoryRecords } from './store'
import type {
  MemoryCoverage,
  MemoryIndexKey,
  MemoryQueryPreset,
  MemoryRecord,
} from './types'
import { MANUFACTURING_MEMORY_SCHEMA_VERSION } from './types'

export type ManufacturingMemorySnapshot = {
  schemaVersion: typeof MANUFACTURING_MEMORY_SCHEMA_VERSION
  collectedAt: string
  llmEnabled: false
  erpMutations: false
  appendStats: { appended: number; skipped: number; total: number }
  records: MemoryRecord[]
  indexes: ReturnType<typeof buildMemoryIndexes>
  coverage: MemoryCoverage
}

/** Ensure ERP/planning/simulation observations are journaled (idempotent). */
export function ensureManufacturingMemoryCollected(): ManufacturingMemorySnapshot {
  const collected = collectManufacturingMemoryRecords()
  const appendStats = appendMemoryRecords(collected)
  const records = listAllMemoryRecords()
  const indexes = buildMemoryIndexes(records)
  return {
    schemaVersion: MANUFACTURING_MEMORY_SCHEMA_VERSION,
    collectedAt: new Date().toISOString(),
    llmEnabled: false,
    erpMutations: false,
    appendStats,
    records,
    indexes,
    coverage: buildMemoryCoverage(records, indexes),
  }
}

export function runManufacturingMemory(): ManufacturingMemorySnapshot {
  return ensureManufacturingMemoryCollected()
}

export function queryManufacturingMemoryCoverage(): MemoryCoverage {
  return runManufacturingMemory().coverage
}

export function queryManufacturingMemoryRecords(): MemoryRecord[] {
  return runManufacturingMemory().records
}

export function queryManufacturingMemoryIndexes() {
  return runManufacturingMemory().indexes
}

export function queryManufacturingMemoryByIndex(index: MemoryIndexKey, key?: string) {
  const records = runManufacturingMemory().records
  return queryMemoryByIndex(records, index, key)
}

export function queryManufacturingMemoryByStyle(styleCode: string) {
  return queryMemoryByStyle(runManufacturingMemory().records, styleCode)
}

export function replayManufacturingProductionOrder(productionOrderNo: string) {
  return replayProductionOrderTimeline(
    runManufacturingMemory().records,
    productionOrderNo,
  )
}

export function queryManufacturingMemoryPreset(preset: MemoryQueryPreset, styleCode?: string) {
  return runMemoryQueryPreset(runManufacturingMemory().records, preset, styleCode)
}

export function listManufacturingMemoryPresets() {
  return MEMORY_QUERY_PRESETS
}
