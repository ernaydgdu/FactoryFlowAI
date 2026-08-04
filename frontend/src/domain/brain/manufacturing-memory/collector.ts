/**
 * Collects immutable MemoryRecords from ERP reads + Planning + Simulation.
 * Deterministic IDs → idempotent append. No ERP writes.
 */
import { queryCommercialDocumentsBrainReadModel } from '@/domain/commercial-documents/commercial-documents-query.service'
import { queryCostClosingBrainReadModel } from '@/domain/cost-closing/cost-closing-query.service'
import { queryExportLogisticsBrainReadModel } from '@/domain/export-logistics/export-logistics-query.service'
import { queryFinanceIntegrationBrainReadModel } from '@/domain/finance-integration/finance-integration-query.service'
import { queryAllBalances } from '@/domain/inventory/stock-ledger-query.service'
import { runManufacturingPlanning } from '@/domain/brain/manufacturing-planning'
import { runManufacturingReasoning } from '@/domain/brain/manufacturing-reasoning'
import { runManufacturingSimulation } from '@/domain/brain/manufacturing-simulation'
import { queryLatestMrpRun } from '@/domain/mrp/mrp-query.service'
import { queryPackagingBrainReadModel } from '@/domain/packaging/packing-list-query.service'
import { queryAllProductionOrders } from '@/domain/production-order/production-order-query.service'
import { queryAllPurchaseOrders } from '@/domain/purchasing/purchase-order-query.service'
import { listHoldQueue, getQualityDashboardKpis } from '@/domain/quality/quality-query.service'
import { queryAllSalesOrders } from '@/domain/sales-order/sales-order-query.service'
import { queryAllShipments } from '@/domain/shipment/shipment-query.service'
import { getLaborTrackingList } from '@/domain/shop-floor/labor-tracking.service'
import { getMachineStatusList } from '@/domain/shop-floor/machine-tracking.service'
import { queryStyleClosingBrainReadModel } from '@/domain/style-closing/style-closing-query.service'

import type { MemoryIndexKey, MemoryModule, MemoryOutcome, MemoryRecord } from './types'
import { MANUFACTURING_MEMORY_SCHEMA_VERSION } from './types'

function nowIso(): string {
  return new Date().toISOString()
}

type MemoryRecordDraft = Omit<
  MemoryRecord,
  | 'schemaVersion'
  | 'observation'
  | 'action'
  | 'contextSnapshot'
  | 'rulesFired'
  | 'outcome'
  | 'accuracy'
  | 'lessons'
  | 'traceId'
  | 'links'
> &
  Partial<
    Pick<
      MemoryRecord,
      | 'observation'
      | 'action'
      | 'contextSnapshot'
      | 'rulesFired'
      | 'outcome'
      | 'accuracy'
      | 'lessons'
      | 'traceId'
      | 'links'
      | 'correctionOf'
    >
  >

function deterministicLessons(partial: MemoryRecordDraft): string[] {
  if (partial.success === 'FAILURE') {
    return [`${partial.event} failed under constraints: ${partial.constraints.join(', ') || 'none'}`]
  }
  if (partial.success === 'PARTIAL') {
    return [`${partial.event} partially met expected outcome; preserve constraints for replay`]
  }
  return [`${partial.event} observed; retain as historical baseline`]
}

function traceIdOf(partial: MemoryRecordDraft): string {
  const r = partial.references
  return (
    r.productionOrderNo ??
    r.orderNo ??
    r.orderId ??
    r.styleCode ??
    r.shipmentNo ??
    r.materialCode ??
    `${partial.module}:${partial.aggregate}`
  )
}

function record(partial: MemoryRecordDraft): MemoryRecord {
  const actual = partial.finalOutcome
  const expected = partial.decision
  return {
    schemaVersion: MANUFACTURING_MEMORY_SCHEMA_VERSION,
    ...partial,
    observation: partial.observation ?? partial.context,
    action:
      partial.action ??
      {
        recommended: partial.decision,
        executed: null,
        actor: null,
        status: 'UNKNOWN',
      },
    contextSnapshot: partial.contextSnapshot ?? { ...partial.inputs },
    rulesFired: partial.rulesFired ?? [],
    outcome: partial.outcome ?? { actual, status: partial.success },
    accuracy:
      partial.accuracy ??
      {
        expected,
        actual,
        delta: null,
        status: 'NOT_YET_MEASURABLE',
      },
    lessons: partial.lessons ?? deterministicLessons(partial),
    traceId: partial.traceId ?? traceIdOf(partial),
    links: partial.links ?? [],
    indexKeys: [
      ...new Set<MemoryIndexKey>([
        ...partial.indexKeys,
        'DecisionIndex',
        ...(partial.constraints.length > 0 ? (['ConstraintIndex'] as MemoryIndexKey[]) : []),
        ...(Object.keys(partial.kpis).length > 0 ? (['KpiIndex'] as MemoryIndexKey[]) : []),
      ]),
    ],
  }
}

function outcomeFromBool(ok: boolean): MemoryOutcome {
  return ok ? 'SUCCESS' : 'FAILURE'
}

export function collectManufacturingMemoryRecords(): MemoryRecord[] {
  const collectedAt = nowIso()
  const records: MemoryRecord[] = []
  const reasoning = runManufacturingReasoning()

  // Sales Orders
  for (const so of queryAllSalesOrders().slice(0, 80)) {
    records.push(
      record({
        id: `mem-so-${so.id}-${so.status}`,
        timestamp: collectedAt,
        module: 'sales-order',
        aggregate: 'SalesOrder',
        event: 'ORDER_STATE_OBSERVED',
        decision: so.terminRisk ? 'FLAG_TERMIN_RISK' : 'CONTINUE',
        context: `Sales order ${so.orderNo} status ${so.status}`,
        constraints: so.terminRisk ? ['termin-risk'] : [],
        inputs: { status: so.status, progress: so.progress, fabricStatus: so.fabricStatus },
        outputs: { terminRisk: so.terminRisk },
        kpis: { progress: so.progress, terminRisk: so.terminRisk ? 1 : 0 },
        confidence: 90,
        finalOutcome: so.terminRisk ? 'At risk' : 'On track observation',
        success: so.terminRisk ? 'PARTIAL' : 'OBSERVED',
        durationMs: 0,
        references: {
          orderId: so.id,
          orderNo: so.orderNo,
          customer: so.general.customer,
          styleCode: so.productCardId,
        },
        indexKeys: ['ProductionIndex', 'CustomerIndex', 'StyleIndex', ...(so.terminRisk ? (['RiskIndex'] as MemoryIndexKey[]) : [])],
      }),
    )
  }

  // Production Orders
  for (const po of queryAllProductionOrders().slice(0, 80)) {
    const done = po.status === 'Completed' || po.status === 'Closed'
    records.push(
      record({
        id: `mem-po-${po.productionOrderNo}-${po.status}-${po.revision}`,
        timestamp: collectedAt,
        module: 'production-order',
        aggregate: 'ProductionOrder',
        event: 'PO_STATE_OBSERVED',
        observation: `Produced ${po.producedQty}/${po.plannedQty}; status ${po.status}`,
        decision: done ? 'COMPLETE' : 'CONTINUE_PRODUCTION',
        action: {
          recommended: done ? 'COMPLETE' : 'CONTINUE_PRODUCTION',
          executed: po.status,
          actor: null,
          status: 'EXECUTED',
        },
        context: `PO ${po.productionOrderNo} @ ${po.workshopCode}`,
        contextSnapshot: {
          workshopCode: po.workshopCode,
          productionLineCode: po.productionLineCode,
          plannedFinish: po.plannedFinish,
        },
        constraints: po.snapshots.planning.terminRiskScore > 50 ? ['termin-risk-score'] : [],
        rulesFired: [],
        inputs: {
          plannedQty: po.plannedQty,
          producedQty: po.producedQty,
          status: po.status,
        },
        outputs: {
          rejectQty: po.rejectQty,
          reworkQty: po.reworkQty,
          terminRiskScore: po.snapshots.planning.terminRiskScore,
        },
        kpis: {
          producedQty: po.producedQty,
          rejectQty: po.rejectQty,
          terminRiskScore: po.snapshots.planning.terminRiskScore,
        },
        confidence: 88,
        finalOutcome: po.status,
        outcome: { actual: po.status, status: done ? 'SUCCESS' : 'OBSERVED' },
        accuracy: {
          expected: po.plannedQty,
          actual: po.producedQty,
          delta: po.producedQty - po.plannedQty,
          status: done && po.producedQty >= po.plannedQty ? 'MATCH' : 'DEVIATION',
        },
        lessons:
          po.producedQty >= po.plannedQty
            ? ['Produced quantity met or exceeded planned quantity']
            : [`Production remains ${po.plannedQty - po.producedQty} units below plan`],
        success: done ? 'SUCCESS' : po.rejectQty > 0 ? 'PARTIAL' : 'OBSERVED',
        durationMs: 0,
        references: {
          orderId: po.salesOrderId,
          orderNo: po.salesOrderNo,
          productionOrderNo: po.productionOrderNo,
          styleCode: po.productCode,
          customer: po.customer,
          machineCode: po.productionLineCode,
        },
        indexKeys: ['ProductionIndex', 'StyleIndex', 'MachineIndex'],
      }),
    )
  }

  // MRP shortages
  const mrp = queryLatestMrpRun()
  for (const line of (mrp?.currentSnapshot.lines ?? []).filter((l) => l.netShortage > 0).slice(0, 40)) {
    records.push(
      record({
        id: `mem-mrp-${mrp!.id}-${line.stockCardId}`,
        timestamp: collectedAt,
        module: 'mrp',
        aggregate: 'MrpSnapshotLine',
        event: 'MATERIAL_SHORTAGE',
        decision: 'SUGGEST_PURCHASE',
        context: `Net shortage ${line.netShortage} for ${line.materialCode}`,
        constraints: ['net-shortage'],
        inputs: {
          gross: line.grossRequirement,
          stock: line.availableStock,
          openPO: line.openPurchaseQty,
        },
        outputs: { netShortage: line.netShortage, suggestedSupplier: line.suggestedSupplier },
        kpis: { netShortage: line.netShortage, purchaseRequirement: line.purchaseRequirement },
        confidence: 92,
        finalOutcome: 'Shortage recorded',
        success: 'FAILURE',
        durationMs: 0,
        references: {
          materialCode: line.materialCode,
          supplier: line.suggestedSupplier,
        },
        indexKeys: ['MaterialIndex', 'SupplierIndex', 'RiskIndex'],
      }),
    )
  }

  // Purchasing
  for (const po of queryAllPurchaseOrders().slice(0, 60)) {
    const delayed = po.status === 'Open' || po.status === 'Partially Received'
    records.push(
      record({
        id: `mem-pur-${po.id}-${po.status}`,
        timestamp: collectedAt,
        module: 'purchasing',
        aggregate: 'PurchaseOrder',
        event: delayed ? 'PO_OPEN_OR_PARTIAL' : 'PO_STATE_OBSERVED',
        decision: delayed ? 'MONITOR_SUPPLIER' : 'ACCEPT_STATUS',
        context: `PO ${po.poNo} supplier ${po.supplier}`,
        constraints: delayed ? ['open-supply'] : [],
        inputs: { status: po.status, termin: po.termin, totalAmount: po.totalAmount },
        outputs: { lineCount: po.lines.length },
        kpis: { totalAmount: po.totalAmount, lines: po.lines.length },
        confidence: 85,
        finalOutcome: po.status,
        success: po.status === 'Completed' || po.status === 'Closed' ? 'SUCCESS' : delayed ? 'PARTIAL' : 'OBSERVED',
        durationMs: 0,
        references: { supplier: po.supplierCode || po.supplier, orderNo: po.sourceOrderNo },
        indexKeys: ['SupplierIndex', ...(delayed ? (['RiskIndex'] as MemoryIndexKey[]) : [])],
      }),
    )
  }

  // Inventory / Warehouse
  for (const b of queryAllBalances().slice(0, 80)) {
    const short = b.available < b.reserved * 0.1 && b.reserved > 0
    records.push(
      record({
        id: `mem-inv-${b.stockCardId}-${b.warehouseCode}`,
        timestamp: collectedAt,
        module: 'inventory',
        aggregate: 'InventoryBalance',
        event: short ? 'LOW_AVAILABLE' : 'BALANCE_OBSERVED',
        decision: short ? 'RESERVE_CAUTION' : 'HOLD',
        context: `${b.materialCode} @ ${b.warehouseCode}`,
        constraints: short ? ['low-available'] : [],
        inputs: { onHand: b.onHand, reserved: b.reserved, available: b.available },
        outputs: { unit: b.unit },
        kpis: { available: b.available, reserved: b.reserved, onHand: b.onHand },
        confidence: 90,
        finalOutcome: short ? 'Low available vs reserved' : 'Balance observed',
        success: short ? 'FAILURE' : 'OBSERVED',
        durationMs: 0,
        references: { materialCode: b.materialCode },
        indexKeys: ['MaterialIndex', 'InventoryIndex', 'RiskIndex'],
      }),
    )
    records.push(
      record({
        id: `mem-wh-${b.stockCardId}-${b.warehouseCode}`,
        timestamp: collectedAt,
        module: 'warehouse',
        aggregate: 'WarehouseBalance',
        event: 'WAREHOUSE_BALANCE_OBSERVED',
        decision: 'FIFO_POLICY',
        context: `Warehouse ${b.warehouseName}`,
        constraints: ['fifo'],
        inputs: { available: b.available, reserved: b.reserved },
        outputs: { warehouseCode: b.warehouseCode },
        kpis: { available: b.available },
        confidence: 88,
        finalOutcome: 'Warehouse snapshot',
        success: 'OBSERVED',
        durationMs: 0,
        references: { materialCode: b.materialCode },
        indexKeys: ['MaterialIndex', 'InventoryIndex'],
      }),
    )
  }

  // Shop floor machines / operators
  for (const m of getMachineStatusList().slice(0, 40)) {
    records.push(
      record({
        id: `mem-sf-m-${m.machineId}-${m.status}`,
        timestamp: collectedAt,
        module: 'shop-floor',
        aggregate: 'MachineStatus',
        event: 'MACHINE_STATUS_OBSERVED',
        observation: `${m.machineName}: ${m.status}, downtime ${m.downtimeMinutes} min`,
        decision: m.downtimeMinutes > 60 || m.status === 'Paused' ? 'BLOCK_NEW_LOAD' : 'ACCEPT_LOAD',
        action: {
          recommended: m.downtimeMinutes > 60 ? 'BLOCK_NEW_LOAD' : 'ACCEPT_LOAD',
          executed: m.activeOperationCode,
          actor: m.activeOperatorId,
          status: m.activeOperationCode ? 'EXECUTED' : 'UNKNOWN',
        },
        context: `Machine ${m.machineName} status ${m.status}`,
        contextSnapshot: {
          lineCode: m.lineCode,
          machineType: m.machineType,
          activeProductionOrderNo: m.activeProductionOrderNo,
        },
        constraints: m.downtimeMinutes > 0 ? ['downtime'] : [],
        rulesFired: m.downtimeMinutes > 60 ? ['MAINTENANCE_EXPIRED_BLOCK'] : [],
        inputs: { status: m.status, downtimeMinutes: m.downtimeMinutes },
        outputs: { completedQtyToday: m.completedQtyToday },
        kpis: { downtimeMinutes: m.downtimeMinutes, completedQtyToday: m.completedQtyToday },
        confidence: 80,
        finalOutcome: m.status,
        outcome: { actual: m.status, status: m.downtimeMinutes > 60 ? 'FAILURE' : 'OBSERVED' },
        accuracy: {
          expected: 'Running',
          actual: m.status,
          delta: null,
          status: m.status === 'Running' ? 'MATCH' : 'DEVIATION',
        },
        lessons:
          m.downtimeMinutes > 0
            ? [`Machine accumulated ${m.downtimeMinutes} downtime minutes`]
            : ['No machine downtime observed'],
        success: m.downtimeMinutes > 60 ? 'FAILURE' : 'OBSERVED',
        durationMs: 0,
        references: {
          machineCode: m.machineId,
          productionOrderNo: m.activeProductionOrderNo ?? undefined,
          operatorId: m.activeOperatorId ?? undefined,
        },
        indexKeys: ['MachineIndex', 'ProductionIndex'],
      }),
    )
  }
  for (const lab of getLaborTrackingList().slice(0, 40)) {
    records.push(
      record({
        id: `mem-sf-op-${lab.operatorId}-${lab.activeProductionOrderNo ?? 'idle'}`,
        timestamp: collectedAt,
        module: 'shop-floor',
        aggregate: 'LaborTracking',
        event: 'OPERATOR_ACTIVITY_OBSERVED',
        decision: 'TRACK_LABOR',
        context: `Operator ${lab.operatorName}`,
        constraints: [],
        inputs: { status: lab.status, sessionCount: lab.sessionCount },
        outputs: {
          totalCompletedQty: lab.totalCompletedQty,
          totalRejectQty: lab.totalRejectQty,
        },
        kpis: {
          totalCompletedQty: lab.totalCompletedQty,
          totalReworkQty: lab.totalReworkQty,
          totalRejectQty: lab.totalRejectQty,
          totalDowntimeMinutes: lab.totalDowntimeMinutes,
        },
        confidence: 78,
        finalOutcome: 'Labor observed',
        success: lab.totalRejectQty > 0 ? 'PARTIAL' : 'OBSERVED',
        durationMs: 0,
        references: {
          operatorId: lab.operatorId,
          productionOrderNo: lab.activeProductionOrderNo ?? undefined,
          machineCode: lab.activeMachineId ?? undefined,
        },
        indexKeys: ['OperatorIndex', 'ProductionIndex'],
      }),
    )
  }

  // Quality
  const qKpi = getQualityDashboardKpis()
  records.push(
    record({
      id: `mem-qa-dash-${qKpi.holdOpen}-${qKpi.ncrOpen}-${qKpi.rejectCount}`,
      timestamp: collectedAt,
      module: 'quality',
      aggregate: 'QualityDashboard',
      event: qKpi.holdOpen > 0 ? 'HOLDS_OPEN' : 'QUALITY_KPI_SNAPSHOT',
      decision: qKpi.holdOpen > 0 ? 'BLOCK_SHIPMENT_PATH' : 'ALLOW',
      context: 'Quality KPI snapshot',
      constraints: qKpi.holdOpen > 0 ? ['quality-hold'] : [],
      inputs: { holdOpen: qKpi.holdOpen, ncrOpen: qKpi.ncrOpen, rejectCount: qKpi.rejectCount },
      outputs: { passCount: qKpi.passCount },
      kpis: {
        holdOpen: qKpi.holdOpen,
        ncrOpen: qKpi.ncrOpen,
        rejectCount: qKpi.rejectCount,
        passCount: qKpi.passCount,
      },
      confidence: 93,
      finalOutcome: qKpi.holdOpen > 0 ? 'Holds open' : 'Clear',
      success: qKpi.holdOpen > 0 ? 'FAILURE' : 'SUCCESS',
      durationMs: 0,
      references: {},
      indexKeys: ['QualityIndex', 'RiskIndex'],
    }),
  )
  for (const h of listHoldQueue().slice(0, 40)) {
    records.push(
      record({
        id: `mem-qa-hold-${h.bundleId}`,
        timestamp: collectedAt,
        module: 'quality',
        aggregate: 'QualityHold',
        event: 'BUNDLE_ON_HOLD',
        observation: `Bundle ${h.bundleNo} held for ${h.reasonCode}`,
        decision: 'HOLD_BUNDLE',
        action: {
          recommended: 'HOLD_BUNDLE',
          executed: 'HOLD_BUNDLE',
          actor: null,
          status: 'EXECUTED',
        },
        context: `Hold ${h.bundleNo} reason ${h.reasonCode}`,
        contextSnapshot: { operationCode: h.currentOperationCode, pieceCount: h.pieceCount },
        constraints: ['inspection-hold'],
        rulesFired: ['INSPECTION_FAIL_BLOCK_SHIP'],
        inputs: { reasonCode: h.reasonCode, pieceCount: h.pieceCount },
        outputs: {},
        kpis: { pieceCount: h.pieceCount },
        confidence: 95,
        finalOutcome: 'On hold',
        outcome: { actual: 'On hold', status: 'FAILURE' },
        accuracy: {
          expected: 'Pass',
          actual: 'On hold',
          delta: null,
          status: 'DEVIATION',
        },
        lessons: [`Quality failure ${h.reasonCode} blocked ${h.pieceCount} pieces`],
        success: 'FAILURE',
        durationMs: 0,
        references: { productionOrderNo: h.productionOrderNo },
        indexKeys: ['QualityIndex', 'RiskIndex', 'ProductionIndex'],
      }),
    )
  }

  // Packaging
  const pack = queryPackagingBrainReadModel()
  records.push(
    record({
      id: `mem-pack-${pack.packingListCount}-${pack.confirmedOrApproved}-${pack.openValidationErrors}`,
      timestamp: collectedAt,
      module: 'packaging',
      aggregate: 'PackagingBrain',
      event: pack.openValidationErrors > 0 ? 'PACK_VALIDATION_ERRORS' : 'PACKAGING_SNAPSHOT',
      decision: pack.openValidationErrors > 0 ? 'FIX_VALIDATION' : 'OBSERVE_PACK',
      context: 'Packaging brain read model',
      constraints: pack.openValidationErrors > 0 ? ['pack-validation'] : [],
      inputs: {
        packingListCount: pack.packingListCount,
        confirmedOrApproved: pack.confirmedOrApproved,
        pendingApproval: pack.pendingApproval,
      },
      outputs: { shipped: pack.shipped, totalQty: pack.totalQty },
      kpis: {
        packingListCount: pack.packingListCount,
        openValidationErrors: pack.openValidationErrors,
        totalQty: pack.totalQty,
      },
      confidence: 82,
      finalOutcome: pack.openValidationErrors > 0 ? 'Validation errors' : 'Packaging snapshot',
      success: pack.openValidationErrors > 0 ? 'FAILURE' : 'OBSERVED',
      durationMs: 0,
      references: { orderId: pack.salesOrderId ?? undefined },
      indexKeys: ['ShipmentIndex', 'RiskIndex'],
    }),
  )

  // Shipment
  for (const sh of queryAllShipments().slice(0, 50)) {
    records.push(
      record({
        id: `mem-ship-${sh.id}-${sh.status}`,
        timestamp: collectedAt,
        module: 'shipment',
        aggregate: 'Shipment',
        event: 'SHIPMENT_STATE_OBSERVED',
        observation: `Shipment ${sh.shipmentNo} reached ${sh.status}`,
        decision: sh.status === 'Delivered' || sh.status === 'Closed' ? 'COMPLETE' : 'IN_TRANSIT_MONITOR',
        action: {
          recommended: sh.status === 'Delivered' || sh.status === 'Closed' ? 'COMPLETE' : 'MONITOR',
          executed: sh.status,
          actor: null,
          status: 'EXECUTED',
        },
        context: `Shipment ${sh.shipmentNo}`,
        contextSnapshot: { salesOrderId: sh.salesOrderId, totalQty: sh.totals.totalQty },
        constraints: [],
        rulesFired: [],
        inputs: { status: sh.status, totalQty: sh.totals.totalQty },
        outputs: {},
        kpis: { totalQty: sh.totals.totalQty },
        confidence: 87,
        finalOutcome: sh.status,
        outcome: {
          actual: sh.status,
          status: sh.status === 'Delivered' || sh.status === 'Closed' ? 'SUCCESS' : 'OBSERVED',
        },
        accuracy: {
          expected: 'Delivered',
          actual: sh.status,
          delta: null,
          status: sh.status === 'Delivered' || sh.status === 'Closed' ? 'MATCH' : 'NOT_YET_MEASURABLE',
        },
        lessons:
          sh.status === 'Delivered' || sh.status === 'Closed'
            ? ['Shipment completed']
            : [`Shipment remains in ${sh.status}`],
        success: outcomeFromBool(sh.status === 'Delivered' || sh.status === 'Closed'),
        durationMs: 0,
        references: { shipmentNo: sh.shipmentNo, orderId: sh.salesOrderId },
        indexKeys: ['ShipmentIndex', 'ProductionIndex'],
      }),
    )
  }

  // Commercial / Export / Finance / Cost / Style
  const commercial = queryCommercialDocumentsBrainReadModel()
  records.push(moduleSnapshot('commercial-documents', 'CommercialBrain', commercial, ['ShipmentIndex']))
  const exportLog = queryExportLogisticsBrainReadModel()
  records.push(moduleSnapshot('export-logistics', 'ExportLogisticsBrain', exportLog, ['ShipmentIndex', 'RiskIndex']))
  const finance = queryFinanceIntegrationBrainReadModel()
  records.push(
    record({
      id: `mem-fin-${finance.failed}-${finance.posted}-${finance.queued}`,
      timestamp: collectedAt,
      module: 'finance-integration',
      aggregate: 'FinanceBrain',
      event: finance.failed > 0 ? 'POSTING_FAILURES' : 'FINANCE_SNAPSHOT',
      decision: finance.failed > 0 ? 'RESOLVE_FAILED_POSTINGS' : 'OBSERVE',
      context: 'Finance integration snapshot',
      constraints: finance.failed > 0 ? ['failed-postings'] : [],
      inputs: { failed: finance.failed, queued: finance.queued, posted: finance.posted },
      outputs: { avgCostAnomalyScore: finance.avgCostAnomalyScore },
      kpis: {
        failed: finance.failed,
        queued: finance.queued,
        posted: finance.posted,
        avgCostAnomalyScore: finance.avgCostAnomalyScore,
      },
      confidence: 90,
      finalOutcome: finance.failed > 0 ? 'Failures present' : 'Healthy',
      success: finance.failed > 0 ? 'FAILURE' : 'SUCCESS',
      durationMs: 0,
      references: {},
      indexKeys: ['RiskIndex'],
    }),
  )
  const cost = queryCostClosingBrainReadModel()
  records.push(
    record({
      id: `mem-cost-${cost.open}-${cost.closed}-${cost.avgAnomalyScore}`,
      timestamp: collectedAt,
      module: 'cost-closing',
      aggregate: 'CostClosingBrain',
      event: 'COST_CLOSING_SNAPSHOT',
      decision: cost.avgAnomalyScore >= 70 ? 'REVIEW_ANOMALY' : 'OBSERVE',
      context: 'Cost closing snapshot',
      constraints: [],
      inputs: { open: cost.open, closed: cost.closed },
      outputs: { avgAnomalyScore: cost.avgAnomalyScore },
      kpis: { open: cost.open, closed: cost.closed, avgAnomalyScore: cost.avgAnomalyScore },
      confidence: 86,
      finalOutcome: 'Cost closing observed',
      success: cost.avgAnomalyScore >= 70 ? 'PARTIAL' : 'OBSERVED',
      durationMs: 0,
      references: {},
      indexKeys: ['RiskIndex'],
    }),
  )
  const style = queryStyleClosingBrainReadModel()
  records.push(
    record({
      id: `mem-style-${style.open}-${style.closed}-${style.avgMarginPercent}`,
      timestamp: collectedAt,
      module: 'style-closing',
      aggregate: 'StyleClosingBrain',
      event: 'STYLE_CLOSING_SNAPSHOT',
      decision: 'OBSERVE_STYLE_CLOSE',
      context: 'Style closing snapshot',
      constraints: [],
      inputs: { open: style.open, closed: style.closed },
      outputs: { avgMarginPercent: style.avgMarginPercent },
      kpis: {
        open: style.open,
        closed: style.closed,
        avgMarginPercent: style.avgMarginPercent,
        avgAnomalyScore: style.avgAnomalyScore,
      },
      confidence: 86,
      finalOutcome: 'Style closing observed',
      success: 'OBSERVED',
      durationMs: 0,
      references: {},
      indexKeys: ['StyleIndex'],
    }),
  )
  for (const s of style.styleSummaries.slice(0, 20)) {
    records.push(
      record({
        id: `mem-style-sum-${s.id}`,
        timestamp: collectedAt,
        module: 'style-closing',
        aggregate: 'StyleClosingSummary',
        event: 'STYLE_SUMMARY',
        decision: s.missingCount > 0 ? 'CLOSE_GAPS' : 'READY',
        context: `Style ${s.productCode}`,
        constraints: s.missingCount > 0 ? ['missing-requirements'] : [],
        inputs: { status: s.status, missingCount: s.missingCount },
        outputs: { marginPercent: s.marginPercent },
        kpis: {
          missingCount: s.missingCount,
          anomalyScore: s.anomalyScore,
          marginPercent: s.marginPercent ?? 0,
        },
        confidence: 84,
        finalOutcome: s.status,
        success: s.missingCount > 0 ? 'PARTIAL' : 'OBSERVED',
        durationMs: 0,
        references: { styleCode: s.productCode },
        indexKeys: ['StyleIndex'],
      }),
    )
  }

  // Reasoning Engine — fired rules are facts needed by later timeline replay.
  for (const rule of reasoning.ruleEvaluations.filter((r) => r.matched)) {
    records.push(
      record({
        id: `mem-reason-${rule.ruleId}-${rule.verdict}`,
        timestamp: collectedAt,
        module: 'reasoning-engine',
        aggregate: 'RuleEvaluation',
        event: 'RULE_FIRED',
        observation: rule.message,
        decision: rule.actions[0] ?? 'OBSERVE_RULE',
        action: {
          recommended: rule.actions[0] ?? 'OBSERVE_RULE',
          executed: null,
          actor: null,
          status: 'UNKNOWN',
        },
        context: rule.evidence.join('; '),
        contextSnapshot: { verdict: rule.verdict, applicable: rule.applicable },
        constraints: rule.relatedConcepts,
        rulesFired: [rule.ruleCode],
        inputs: { ruleCode: rule.ruleCode, severity: rule.severity },
        outputs: { verdict: rule.verdict },
        kpis: {},
        confidence: 90,
        finalOutcome: rule.message,
        outcome: { actual: rule.verdict, status: 'OBSERVED' },
        accuracy: {
          expected: rule.severity,
          actual: rule.verdict,
          delta: null,
          status: 'NOT_YET_MEASURABLE',
        },
        lessons: [`Rule ${rule.ruleCode} fired because: ${rule.evidence.join('; ')}`],
        success: rule.verdict === 'BLOCKED' ? 'FAILURE' : 'OBSERVED',
        durationMs: 0,
        references: {},
        traceId: `reasoning:${rule.ruleCode}`,
        links: [],
        indexKeys: ['DecisionIndex', 'ConstraintIndex'],
      }),
    )
  }

  // Planning Engine
  const planning = runManufacturingPlanning()
  const firedRules = reasoning.ruleEvaluations.filter((r) => r.matched).map((r) => r.ruleCode)
  for (const plan of planning.plans) {
    records.push(
      record({
        id: `mem-plan-${plan.variant}-${plan.confidence}-${plan.sequencing.length}`,
        timestamp: collectedAt,
        module: 'planning-engine',
        aggregate: 'ManufacturingPlan',
        event: 'PLAN_RECOMMENDED',
        decision: `SELECT_PLAN_${plan.variant}`,
        context: plan.explanation.why,
        constraints: plan.explanation.constraintsEvaluated,
        rulesFired: firedRules,
        inputs: { strategy: plan.strategy, preferred: planning.preferredVariant === plan.variant },
        outputs: {
          sequenceSteps: plan.sequencing.length,
          bottlenecks: plan.bottlenecks.length,
        },
        kpis: {
          confidence: plan.confidence,
          bottlenecks: plan.bottlenecks.length,
          deliveryHighRisk: plan.deliveryRisks.filter((d) => d.riskLevel === 'HIGH' || d.riskLevel === 'CRITICAL').length,
        },
        confidence: plan.confidence,
        finalOutcome: plan.name,
        success: planning.preferredVariant === plan.variant ? 'SUCCESS' : 'OBSERVED',
        durationMs: 0,
        references: {},
        indexKeys: ['PlanningIndex', 'RiskIndex'],
      }),
    )
    for (const step of plan.sequencing.slice(0, 40)) {
      records.push(
        record({
          id: `mem-plan-seq-${plan.variant}-${step.productionOrderNo}-${step.sequence}`,
          timestamp: collectedAt,
          module: 'planning-engine',
          aggregate: 'ProductionSequenceDecision',
          event: 'PRODUCTION_SEQUENCE_RECOMMENDED',
          observation: `${step.productionOrderNo} ranked ${step.sequence} in Plan ${plan.variant}`,
          decision: `SEQUENCE_${step.sequence}`,
          action: {
            recommended: `Start D+${step.plannedStartDayOffset} for ${step.plannedDurationDays}d`,
            executed: null,
            actor: null,
            status: 'UNKNOWN',
          },
          context: plan.explanation.why,
          contextSnapshot: {
            priority: step.priority,
            remainingQty: step.remainingQty,
            workshopCode: step.workshopCode,
          },
          constraints: plan.explanation.constraintsEvaluated,
          rulesFired: firedRules,
          inputs: {
            strategy: plan.strategy,
            priority: step.priority,
            remainingQty: step.remainingQty,
          },
          outputs: {
            startDay: step.plannedStartDayOffset,
            durationDays: step.plannedDurationDays,
          },
          kpis: { confidence: plan.confidence },
          confidence: plan.confidence,
          finalOutcome: 'Awaiting execution evidence',
          outcome: { actual: 'PENDING', status: 'OBSERVED' },
          accuracy: {
            expected: step.plannedDurationDays,
            actual: null,
            delta: null,
            status: 'NOT_YET_MEASURABLE',
          },
          lessons: ['Plan accuracy remains unmeasured until execution outcome is appended'],
          success: 'OBSERVED',
          durationMs: 0,
          references: {
            orderNo: step.salesOrderNo,
            productionOrderNo: step.productionOrderNo,
            styleCode: step.productCode,
            machineCode: step.workshopCode,
          },
          traceId: step.productionOrderNo,
          links: [],
          indexKeys: ['PlanningIndex', 'ProductionIndex', 'MachineIndex'],
        }),
      )
    }
    for (const bn of plan.bottlenecks.slice(0, 8)) {
      records.push(
        record({
          id: `mem-plan-bn-${plan.variant}-${bn.id}`,
          timestamp: collectedAt,
          module: 'planning-engine',
          aggregate: 'Bottleneck',
          event: 'BOTTLENECK_IDENTIFIED',
          decision: bn.reliefActions[0] ?? 'MONITOR',
          context: bn.label,
          constraints: [bn.kind],
          inputs: { severity: bn.severity },
          outputs: {},
          kpis: {},
          confidence: plan.confidence,
          finalOutcome: bn.severity,
          success: bn.severity === 'CRITICAL' ? 'FAILURE' : 'PARTIAL',
          durationMs: 0,
          references: { machineCode: bn.kind === 'Machine' ? bn.label : undefined },
          indexKeys: ['PlanningIndex', 'RiskIndex', 'MachineIndex'],
        }),
      )
    }
  }

  // Simulation Engine
  const sim = runManufacturingSimulation()
  const preferredPlan =
    planning.plans.find((p) => p.variant === planning.preferredVariant) ?? planning.plans[0]
  for (const sc of sim.scenarios) {
    records.push(
      record({
        id: `mem-sim-${sc.slot}-${sc.definition.code}-${sc.metrics.confidence}`,
        timestamp: collectedAt,
        module: 'simulation-engine',
        aggregate: 'ScenarioResult',
        event: 'SCENARIO_SIMULATED',
        decision: `EVALUATE_${sc.slot}`,
        context: sc.definition.question,
        constraints: sc.definition.shocks.map((s) => s.type),
        rulesFired: firedRules,
        inputs: { shocks: sc.definition.shocks.length },
        outputs: {
          otifImpactPct: sc.metrics.otifImpactPct,
          completionDelta: sc.metrics.productionCompletionDayOffset,
          costDelta: sc.metrics.costDelta,
        },
        kpis: {
          otifImpactPct: sc.metrics.otifImpactPct,
          utilization: sc.metrics.resourceUtilizationPct,
          shipmentDelayDays: sc.metrics.shipmentDelayDays,
          costDelta: sc.metrics.costDelta,
          confidence: sc.metrics.confidence,
        },
        confidence: sc.metrics.confidence,
        finalOutcome: sc.metrics.bottleneckLabel,
        success: sc.metrics.otifImpactPct < 0 ? 'PARTIAL' : 'OBSERVED',
        durationMs: 0,
        references: { machineCode: sc.definition.shocks.find((s) => s.type === 'MACHINE_DOWNTIME')?.target },
        indexKeys: ['SimulationIndex', 'RiskIndex'],
      }),
    )
    for (const step of preferredPlan?.sequencing.slice(0, 40) ?? []) {
      records.push(
        record({
          id: `mem-sim-po-${sc.slot}-${step.productionOrderNo}`,
          timestamp: collectedAt,
          module: 'simulation-engine',
          aggregate: 'ProductionOrderScenario',
          event: 'PRODUCTION_ORDER_SIMULATED',
          observation: sc.definition.question,
          decision: `CONSIDER_SCENARIO_${sc.slot}`,
          action: {
            recommended: `Review ${sc.definition.code}`,
            executed: null,
            actor: null,
            status: 'UNKNOWN',
          },
          context: sc.drivers.join('; '),
          contextSnapshot: {
            scenario: sc.definition.code,
            completionDelta: sc.metrics.productionCompletionDayOffset,
            otifImpact: sc.metrics.otifImpactPct,
          },
          constraints: sc.definition.shocks.map((s) => s.type),
          rulesFired: firedRules,
          inputs: { scenario: sc.definition.code, shockCount: sc.definition.shocks.length },
          outputs: {
            completionDelta: sc.metrics.productionCompletionDayOffset,
            shipmentDelay: sc.metrics.shipmentDelayDays,
          },
          kpis: {
            otifImpactPct: sc.metrics.otifImpactPct,
            confidence: sc.metrics.confidence,
          },
          confidence: sc.metrics.confidence,
          finalOutcome: sc.metrics.bottleneckLabel,
          outcome: { actual: sc.metrics.bottleneckLabel, status: 'OBSERVED' },
          accuracy: {
            expected: sc.metrics.productionCompletionDayOffset,
            actual: null,
            delta: null,
            status: 'NOT_YET_MEASURABLE',
          },
          lessons: ['Scenario remains hypothetical until linked execution evidence is appended'],
          success: 'OBSERVED',
          durationMs: 0,
          references: {
            orderNo: step.salesOrderNo,
            productionOrderNo: step.productionOrderNo,
            styleCode: step.productCode,
          },
          traceId: step.productionOrderNo,
          links: [],
          indexKeys: ['SimulationIndex', 'ProductionIndex', 'RiskIndex'],
        }),
      )
    }
  }

  return linkTraceChains(records)
}

const TRACE_STAGE: Record<MemoryModule, number> = {
  'sales-order': 10,
  'mrp': 20,
  purchasing: 30,
  inventory: 40,
  warehouse: 50,
  'planning-engine': 60,
  'reasoning-engine': 55,
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

function linkTraceChains(records: MemoryRecord[]): MemoryRecord[] {
  const byTrace = new Map<string, MemoryRecord[]>()
  for (const memory of records) {
    const group = byTrace.get(memory.traceId) ?? []
    group.push(memory)
    byTrace.set(memory.traceId, group)
  }
  for (const group of byTrace.values()) {
    group.sort(
      (a, b) =>
        TRACE_STAGE[a.module] - TRACE_STAGE[b.module] ||
        a.timestamp.localeCompare(b.timestamp) ||
        a.id.localeCompare(b.id),
    )
    for (let i = 0; i < group.length; i += 1) {
      const current = group[i]!
      const previous = group[i - 1]
      const next = group[i + 1]
      current.links = [
        ...(previous ? [{ recordId: previous.id, type: 'FOLLOWS' as const }] : []),
        ...(next ? [{ recordId: next.id, type: 'PRECEDES' as const }] : []),
      ]
    }
  }
  return records
}

function moduleSnapshot(
  module: MemoryModule,
  aggregate: string,
  payload: object,
  indexKeys: MemoryIndexKey[],
): MemoryRecord {
  const json = JSON.stringify(payload)
  return record({
    id: `mem-${module}-${json.length}`,
    timestamp: nowIso(),
    module,
    aggregate,
    event: 'MODULE_SNAPSHOT',
    decision: 'OBSERVE',
    context: `${aggregate} snapshot`,
    constraints: [],
    inputs: { bytes: json.length },
    outputs: {},
    kpis: {},
    confidence: 80,
    finalOutcome: 'Snapshot stored',
    success: 'OBSERVED',
    durationMs: 0,
    references: {},
    indexKeys,
  })
}
