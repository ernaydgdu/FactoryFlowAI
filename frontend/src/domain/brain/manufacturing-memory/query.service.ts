/**
 * Deterministic memory indexes + read-only query presets.
 * No predictions. No statistics beyond stored facts/counts.
 */
import type {
  MemoryCoverage,
  MemoryIndexBucket,
  MemoryIndexKey,
  MemoryModule,
  MemoryQueryPreset,
  MemoryQueryResult,
  MemoryRecord,
  MemoryTimelineReplay,
} from './types'
import { MANUFACTURING_MEMORY_SCHEMA_VERSION } from './types'

const ALL_INDEXES: MemoryIndexKey[] = [
  'DecisionIndex',
  'SupplierIndex',
  'MaterialIndex',
  'MachineIndex',
  'OperatorIndex',
  'CustomerIndex',
  'StyleIndex',
  'ProductionIndex',
  'InventoryIndex',
  'ShipmentIndex',
  'QualityIndex',
  'PlanningIndex',
  'SimulationIndex',
  'RiskIndex',
  'ConstraintIndex',
  'KpiIndex',
]

function refKey(record: MemoryRecord, index: MemoryIndexKey): string {
  const r = record.references
  switch (index) {
    case 'SupplierIndex':
      return r.supplier ?? 'unknown-supplier'
    case 'MachineIndex':
      return r.machineCode ?? record.inputs.machineCode?.toString() ?? 'unknown-machine'
    case 'OperatorIndex':
      return r.operatorId ?? 'unknown-operator'
    case 'StyleIndex':
      return r.styleCode ?? 'unknown-style'
    case 'CustomerIndex':
      return r.customer ?? 'unknown-customer'
    case 'ProductionIndex':
      return r.productionOrderNo ?? 'unknown-production'
    case 'InventoryIndex':
      return r.materialCode ?? record.aggregate
    case 'QualityIndex':
      return record.event
    case 'MaterialIndex':
      return r.materialCode ?? 'unknown-material'
    case 'ShipmentIndex':
      return r.shipmentNo ?? record.aggregate
    case 'PlanningIndex':
      return `${record.event}:${String(record.inputs.strategy ?? record.decision)}`
    case 'SimulationIndex':
      return record.event
    case 'DecisionIndex':
      return record.decision
    case 'RiskIndex':
      return record.constraints[0] ?? record.event
    case 'ConstraintIndex':
      return record.constraints.join('|') || 'none'
    case 'KpiIndex':
      return Object.keys(record.kpis).sort().join('|') || 'none'
    case 'CustomerIndex':
      return r.customer ?? 'unknown-customer'
    case 'StyleIndex':
      return r.styleCode ?? 'unknown-style'
    default:
      return r.orderNo ?? r.orderId ?? r.productionOrderNo ?? 'unknown-order'
  }
}

export function buildMemoryIndexes(records: MemoryRecord[]): MemoryIndexBucket[] {
  const map = new Map<string, MemoryIndexBucket>()
  for (const rec of records) {
    for (const index of rec.indexKeys) {
      const key = refKey(rec, index)
      const id = `${index}::${key}`
      const existing = map.get(id)
      if (existing) {
        existing.recordIds.push(rec.id)
        existing.count += 1
        if (rec.timestamp > existing.lastTimestamp) existing.lastTimestamp = rec.timestamp
      } else {
        map.set(id, {
          index,
          key,
          label: `${index}: ${key}`,
          recordIds: [rec.id],
          count: 1,
          lastTimestamp: rec.timestamp,
        })
      }
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function queryMemoryByIndex(
  records: MemoryRecord[],
  index: MemoryIndexKey,
  key?: string,
): MemoryRecord[] {
  return records.filter(
    (r) => r.indexKeys.includes(index) && (!key || refKey(r, index) === key),
  )
}

export function queryMemoryByStyle(records: MemoryRecord[], styleCode: string): MemoryRecord[] {
  return records.filter(
    (r) =>
      r.references.styleCode === styleCode ||
      (r.indexKeys.includes('StyleIndex') && refKey(r, 'StyleIndex') === styleCode),
  )
}

const REPLAY_STAGE: Record<MemoryModule, number> = {
  'sales-order': 10,
  mrp: 20,
  purchasing: 30,
  inventory: 40,
  warehouse: 50,
  'reasoning-engine': 55,
  'planning-engine': 60,
  'simulation-engine': 70,
  'production-order': 80,
  'shop-floor': 90,
  quality: 100,
  packaging: 110,
  shipment: 120,
  'commercial-documents': 130,
  'export-logistics': 140,
  'finance-integration': 150,
  'cost-closing': 160,
  'style-closing': 170,
}

/** Reconstruct what was known/recommended/executed/outcome for one production order. */
export function replayProductionOrderTimeline(
  records: MemoryRecord[],
  productionOrderNo: string,
): MemoryTimelineReplay {
  const direct = records.filter(
    (r) =>
      r.references.productionOrderNo === productionOrderNo ||
      r.traceId === productionOrderNo,
  )
  const orderIds = new Set(direct.flatMap((r) => [r.references.orderId, r.references.orderNo]).filter(Boolean))
  const styleCodes = new Set(direct.map((r) => r.references.styleCode).filter(Boolean))
  const traceIds = new Set(direct.map((r) => r.traceId))
  const recordIds = new Set(direct.map((r) => r.id))

  // Include chain-adjacent order/style records and explicit immutable links.
  let changed = true
  while (changed) {
    changed = false
    for (const memory of records) {
      const linked = memory.links.some((link) => recordIds.has(link.recordId))
      const sameOrder =
        (memory.references.orderId && orderIds.has(memory.references.orderId)) ||
        (memory.references.orderNo && orderIds.has(memory.references.orderNo))
      const sameStyle =
        memory.references.styleCode && styleCodes.has(memory.references.styleCode)
      if (
        recordIds.has(memory.id) ||
        traceIds.has(memory.traceId) ||
        linked ||
        sameOrder ||
        sameStyle
      ) {
        if (!recordIds.has(memory.id)) changed = true
        recordIds.add(memory.id)
        traceIds.add(memory.traceId)
        if (memory.references.orderId) orderIds.add(memory.references.orderId)
        if (memory.references.orderNo) orderIds.add(memory.references.orderNo)
        if (memory.references.styleCode) styleCodes.add(memory.references.styleCode)
      }
    }
  }

  const replay = records
    .filter((r) => recordIds.has(r.id))
    .sort(
      (a, b) =>
        a.timestamp.localeCompare(b.timestamp) ||
        REPLAY_STAGE[a.module] - REPLAY_STAGE[b.module] ||
        a.id.localeCompare(b.id),
    )

  return {
    productionOrderNo,
    traceIds: [...traceIds].sort(),
    records: replay,
    reconstructed: {
      knownFacts: unique(replay.map((r) => r.observation)),
      constraints: unique(replay.flatMap((r) => r.constraints)),
      rulesFired: unique(replay.flatMap((r) => r.rulesFired)),
      recommendations: unique(replay.map((r) => r.decision).filter(Boolean)),
      executedActions: unique(
        replay
          .filter((r) => r.action.status === 'EXECUTED' && r.action.executed)
          .map((r) => r.action.executed!),
      ),
      subsequentOutcomes: unique(replay.map((r) => r.outcome.actual)),
    },
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

export function runMemoryQueryPreset(
  records: MemoryRecord[],
  preset: MemoryQueryPreset,
  styleCode?: string,
): MemoryQueryResult {
  switch (preset) {
    case 'decisions-by-style': {
      const code = styleCode?.trim() || pickTopStyle(records)
      const matched = queryMemoryByStyle(records, code).filter((r) =>
        r.indexKeys.includes('DecisionIndex'),
      )
      return {
        preset,
        title: `Decisions involving style ${code}`,
        description: 'All stored decisions linked to the style reference.',
        records: matched,
        summary: { styleCode: code, decisions: matched.length },
      }
    }
    case 'supplier-delays': {
      const matched = records.filter(
        (r) =>
          r.module === 'purchasing' &&
          (r.event.includes('PARTIAL') ||
            r.event.includes('OPEN') ||
            r.indexKeys.includes('SupplierIndex')) &&
          (r.success === 'PARTIAL' || r.success === 'FAILURE' || r.constraints.includes('open-supply')),
      )
      return {
        preset,
        title: 'Supplier delay / open supply memory',
        description: 'Purchasing records with open/partial or risk signals.',
        records: matched.slice(0, 100),
        summary: { count: matched.length },
      }
    }
    case 'planning-accuracy-by-machine': {
      const matched = records.filter(
        (r) =>
          (r.module === 'planning-engine' || r.module === 'shop-floor') &&
          r.indexKeys.includes('MachineIndex'),
      )
      const byMachine = new Map<string, number>()
      for (const r of matched) {
        const m = r.references.machineCode ?? 'unknown'
        byMachine.set(m, (byMachine.get(m) ?? 0) + 1)
      }
      return {
        preset,
        title: 'Planning / machine history counts',
        description: 'Stored facts linking planning bottlenecks and machine observations (counts only).',
        records: matched.slice(0, 100),
        summary: Object.fromEntries([...byMachine.entries()].slice(0, 20)),
      }
    }
    case 'recurring-bottlenecks': {
      const matched = records.filter(
        (r) => r.event === 'BOTTLENECK_IDENTIFIED' || r.constraints.some((c) => c.includes('bottleneck') || c === 'Capacity' || c === 'Material'),
      )
      const freq = new Map<string, number>()
      for (const r of matched) {
        const k = r.context
        freq.set(k, (freq.get(k) ?? 0) + 1)
      }
      const recurring = matched.filter((r) => (freq.get(r.context) ?? 0) >= 1)
      return {
        preset,
        title: 'Recurring bottlenecks',
        description: 'Bottleneck memory entries grouped by context label.',
        records: recurring.slice(0, 100),
        summary: Object.fromEntries([...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)),
      }
    }
    case 'historical-otif': {
      const matched = records.filter(
        (r) =>
          r.module === 'simulation-engine' ||
          r.kpis.otifImpactPct !== undefined ||
          (r.module === 'sales-order' && r.kpis.terminRisk !== undefined),
      )
      return {
        preset,
        title: 'Historical OTIF-related memory',
        description: 'Simulation OTIF impacts and sales-order termin-risk observations.',
        records: matched.slice(0, 100),
        summary: {
          simulationRows: matched.filter((r) => r.module === 'simulation-engine').length,
          terminRiskOrders: matched.filter((r) => r.kpis.terminRisk === 1).length,
        },
      }
    }
    case 'recurring-quality-failures': {
      const matched = records.filter(
        (r) =>
          r.module === 'quality' &&
          (r.success === 'FAILURE' || r.event.includes('HOLD') || r.event.includes('FAIL')),
      )
      return {
        preset,
        title: 'Recurring quality failures',
        description: 'Quality holds and failure outcomes in memory.',
        records: matched.slice(0, 100),
        summary: { count: matched.length },
      }
    }
    case 'recurring-purchasing-shortages': {
      const matched = records.filter(
        (r) =>
          (r.module === 'mrp' && r.event === 'MATERIAL_SHORTAGE') ||
          (r.module === 'purchasing' && r.success !== 'SUCCESS'),
      )
      return {
        preset,
        title: 'Recurring purchasing / MRP shortages',
        description: 'MRP shortage and non-success purchasing memories.',
        records: matched.slice(0, 100),
        summary: { count: matched.length },
      }
    }
    case 'recurring-inventory-shortages': {
      const matched = records.filter(
        (r) =>
          r.module === 'inventory' &&
          (r.event === 'LOW_AVAILABLE' || r.success === 'FAILURE'),
      )
      return {
        preset,
        title: 'Recurring inventory shortages',
        description: 'Inventory low-available memory facts.',
        records: matched.slice(0, 100),
        summary: { count: matched.length },
      }
    }
    default:
      return {
        preset,
        title: 'Unknown preset',
        description: '',
        records: [],
        summary: {},
      }
  }
}

function pickTopStyle(records: MemoryRecord[]): string {
  const freq = new Map<string, number>()
  for (const r of records) {
    const s = r.references.styleCode
    if (!s) continue
    freq.set(s, (freq.get(s) ?? 0) + 1)
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]
  return top?.[0] ?? 'unknown-style'
}

export function buildMemoryCoverage(
  records: MemoryRecord[],
  indexes: MemoryIndexBucket[],
): MemoryCoverage {
  const byModuleMap = new Map<MemoryModule, number>()
  for (const r of records) {
    byModuleMap.set(r.module, (byModuleMap.get(r.module) ?? 0) + 1)
  }
  const byIndexMap = new Map<MemoryIndexKey, number>()
  for (const idx of indexes) {
    byIndexMap.set(idx.index, (byIndexMap.get(idx.index) ?? 0) + idx.count)
  }

  return {
    schemaVersion: MANUFACTURING_MEMORY_SCHEMA_VERSION,
    llmEnabled: false,
    sideEffects: 'APPEND_ONLY_BRAIN_MEMORY',
    erpMutations: false,
    pipeline: ['Knowledge', 'Reasoning', 'Planning', 'Simulation', 'Memory'],
    implementedLayers: ['Knowledge', 'Reasoning', 'Planning', 'Simulation', 'Memory'],
    totals: {
      records: records.length,
      modules: byModuleMap.size,
      indexBuckets: indexes.length,
      queryPresets: 8,
    },
    byModule: [...byModuleMap.entries()]
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => a.module.localeCompare(b.module)),
    byIndex: ALL_INDEXES.map((index) => ({
      index,
      count: byIndexMap.get(index) ?? 0,
    })),
  }
}

export const MEMORY_QUERY_PRESETS: MemoryQueryPreset[] = [
  'decisions-by-style',
  'supplier-delays',
  'planning-accuracy-by-machine',
  'recurring-bottlenecks',
  'historical-otif',
  'recurring-quality-failures',
  'recurring-purchasing-shortages',
  'recurring-inventory-shortages',
]
