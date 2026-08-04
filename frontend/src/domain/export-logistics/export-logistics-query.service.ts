import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'
import type { PersistedExportShipment } from '@/domain/ports/persistence/persistence-aggregates'

import { evaluateExportGates } from './export-logistics-crud.service'
import type { ExportLogisticsBrainReadModel, ExportShipment } from './export-logistics.types'

function strip(row: PersistedExportShipment): ExportShipment {
  const { tenantId: _t, version: _v, schemaVersion: _s, deletedAt: _d, ...rest } = row
  return rest
}

export function queryAllExportShipments(): ExportShipment[] {
  const page = requireUnitOfWork().exportShipments.cursor(
    DEFAULT_TENANT_ID,
    {},
    { limit: PERSISTENCE_CURSOR_MAX_LIMIT },
  )
  return page.items.map(strip).sort((a, b) => b.exportShipmentNo.localeCompare(a.exportShipmentNo))
}

export function queryExportShipmentById(id: string): ExportShipment | null {
  const row = requireUnitOfWork().exportShipments.findById(DEFAULT_TENANT_ID, id)
  return row ? strip(row) : null
}

export function queryExportLogisticsDashboard() {
  const list = queryAllExportShipments()
  return {
    total: list.length,
    planning: list.filter((e) => e.status === 'Planning').length,
    booked: list.filter((e) => e.status === 'Booked' || e.status === 'ContainerAssigned').length,
    customs: list.filter((e) => e.status === 'CustomsCleared' || e.status === 'DocumentsComplete')
      .length,
    inTransit: list.filter((e) => e.status === 'Departed' || e.status === 'Loaded').length,
    arrived: list.filter((e) => e.status === 'Arrived').length,
    closed: list.filter((e) => e.status === 'Closed').length,
    blocked: list.filter((e) => e.gateChecks.some((g) => !g.passed) && e.status !== 'Closed')
      .length,
  }
}

export function queryExportLogisticsBrainReadModel(): ExportLogisticsBrainReadModel {
  const list = queryAllExportShipments()
  const avg =
    list.length === 0
      ? 0
      : Math.round((list.reduce((s, e) => s + e.delayRiskScore, 0) / list.length) * 10) / 10
  return {
    total: list.length,
    planning: list.filter((e) => e.status === 'Planning').length,
    inTransit: list.filter((e) => e.status === 'Departed' || e.status === 'Loaded').length,
    blocked: list.filter((e) => e.gateChecks.some((g) => !g.passed) && e.status !== 'Closed')
      .length,
    closed: list.filter((e) => e.status === 'Closed').length,
    avgDelayRiskScore: avg,
    shipments: list.map((e) => {
      const gates = e.gateChecks.length ? e.gateChecks : evaluateExportGates(e)
      return {
        id: e.id,
        exportShipmentNo: e.exportShipmentNo,
        status: e.status,
        customsStatus: e.customsStatus,
        delayRiskScore: e.delayRiskScore,
        predictedDelayDays: e.predictedDelayDays,
        riskFlags: e.riskFlags,
        gateFailures: gates.filter((g) => !g.passed).map((g) => g.code),
      }
    }),
  }
}
