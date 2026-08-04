import type { StatusBadgeDto } from '@/application/core/types'
import { getNcrById, listNcrRecords, planCapaForNcr } from '@/domain/quality/ncr-capa.service'
import { listQcPlanCoverage, listQcPlanSteps } from '@/domain/quality/qc-plan.service'
import {
  getQualityDashboardKpis,
  listAllGateEvaluations,
  listHoldQueue,
  listQualityTimeline,
  listReworkQueue,
} from '@/domain/quality/quality-query.service'
import type { QualityGateDisposition } from '@/domain/execution-platform/execution-types'

import type {
  CapaPlanDto,
  HoldQueueRowDto,
  InspectionRowDto,
  NcrDetailDto,
  NcrRowDto,
  QualityDashboardDto,
  QualityTimelineRowDto,
  ReworkQueueRowDto,
} from './quality.dto'

function dispositionBadge(d: QualityGateDisposition | string): StatusBadgeDto {
  switch (d) {
    case 'Pass':
    case 'PassWithCondition':
    case 'SecondQuality':
      return { label: d, tone: 'success' }
    case 'Rework':
    case 'Hold':
    case 'Pending':
      return { label: d, tone: 'warning' }
    case 'Reject':
    case 'Scrap':
      return { label: d, tone: 'danger' }
    default:
      return { label: String(d), tone: 'default' }
  }
}

function ncrStatusBadge(status: string): StatusBadgeDto {
  return status === 'Open' ? { label: 'Açık', tone: 'danger' } : { label: status, tone: 'default' }
}

function mapInspection(e: ReturnType<typeof listAllGateEvaluations>[number]): InspectionRowDto {
  const isNcr = e.disposition === 'Reject' || e.disposition === 'Hold' || e.disposition === 'Scrap'
  return {
    id: e.id,
    productionOrderNo: e.productionOrderNo,
    operationCode: e.operationCode,
    gateType: e.gateType,
    disposition: dispositionBadge(e.disposition),
    rawDisposition: e.disposition,
    bundleId: e.bundleId ?? '—',
    evaluatedAt: e.evaluatedAt,
    evaluatedBy: e.evaluatedBy,
    ncrId: isNcr ? `NCR-${e.id}` : '—',
  }
}

export function mapQualityDashboard(): QualityDashboardDto {
  const k = getQualityDashboardKpis()
  return {
    kpis: [
      { label: 'Muayene', value: String(k.totalInspections), hint: 'Gate evaluation' },
      { label: 'Pass', value: String(k.passCount), hint: '' },
      { label: 'Reject/Scrap', value: String(k.rejectCount), hint: '' },
      { label: 'Rework Queue', value: String(k.reworkOpen), hint: 'Açık' },
      { label: 'Hold Queue', value: String(k.holdOpen), hint: 'Bundle OnHold' },
      { label: 'NCR Açık', value: String(k.ncrOpen), hint: '' },
      { label: 'QC Plan Adımı', value: String(k.planSteps), hint: 'Route gates' },
      { label: 'Ort. Coverage', value: `%${k.avgCoverage}`, hint: 'Aktif UE' },
    ],
    planSteps: listQcPlanSteps().map((s) => ({
      operationCode: s.operationCode,
      sequence: s.sequence,
      gateType: s.gateType,
    })),
    coverage: listQcPlanCoverage().map((c) => ({
      productionOrderNo: c.productionOrderNo,
      productCode: c.productCode,
      coveragePercent: c.coveragePercent,
      stepsLabel: c.steps.map((s) => `${s.gateType}:${s.covered ? '✓' : '·'}`).join(' '),
    })),
    recentInspections: listAllGateEvaluations()
      .slice()
      .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
      .slice(0, 50)
      .map(mapInspection),
    ncrs: listNcrRecords().map(
      (n): NcrRowDto => ({
        id: n.id,
        productionOrderNo: n.productionOrderNo,
        operationCode: n.operationCode,
        gateType: n.gateType,
        disposition: n.disposition,
        status: ncrStatusBadge(n.status),
        openedAt: n.openedAt,
        openedBy: n.openedBy,
      }),
    ),
  }
}

export function mapInspectionList(): InspectionRowDto[] {
  return listAllGateEvaluations()
    .slice()
    .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
    .map(mapInspection)
}

export function mapReworkQueue(): ReworkQueueRowDto[] {
  return listReworkQueue().map((r) => ({
    evaluationId: r.evaluationId,
    productionOrderNo: r.productionOrderNo,
    operationCode: r.operationCode,
    gateType: r.gateType,
    bundleId: r.bundleId ?? '—',
    reworkQty: r.reworkQty,
    evaluatedAt: r.evaluatedAt,
    evaluatedBy: r.evaluatedBy,
  }))
}

export function mapHoldQueue(): HoldQueueRowDto[] {
  return listHoldQueue().map((h) => ({
    bundleId: h.bundleId,
    bundleNo: h.bundleNo,
    productionOrderNo: h.productionOrderNo,
    currentOperationCode: h.currentOperationCode ?? '—',
    pieceCount: h.pieceCount,
    reasonCode: h.reasonCode,
  }))
}

export function mapCapaPlan(ncrId: string, owner?: string, dueDate?: string): CapaPlanDto {
  return planCapaForNcr(ncrId, owner, dueDate)
}

export function mapNcrDetail(ncrId: string): NcrDetailDto | null {
  const ncr = getNcrById(ncrId)
  if (!ncr) return null
  const capa = planCapaForNcr(ncrId, 'quality-owner')
  const relatedTimeline = listQualityTimeline(ncr.productionOrderNo)
    .filter(
      (t) =>
        t.operationCode === ncr.operationCode ||
        (ncr.bundleId != null && t.bundleId === ncr.bundleId) ||
        t.title.includes(ncr.disposition),
    )
    .slice(0, 30)
    .map((t) => ({
      id: t.id,
      occurredAt: t.occurredAt,
      eventType: t.eventType,
      title: t.title,
      actor: t.actor,
    }))
  return {
    id: ncr.id,
    productionOrderNo: ncr.productionOrderNo,
    operationCode: ncr.operationCode,
    gateType: ncr.gateType,
    disposition: ncr.disposition,
    status: ncrStatusBadge(ncr.status),
    openedAt: ncr.openedAt,
    openedBy: ncr.openedBy,
    bundleId: ncr.bundleId ?? '—',
    evaluationId: ncr.evaluationId,
    notes: ncr.notes ?? '—',
    capa,
    relatedTimeline,
  }
}

export function mapQualityTimeline(productionOrderNo?: string): QualityTimelineRowDto[] {
  return listQualityTimeline(productionOrderNo).map((t) => ({
    id: t.id,
    occurredAt: t.occurredAt,
    eventType: t.eventType,
    title: t.title,
    description: t.description,
    actor: t.actor,
    productionOrderNo: t.productionOrderNo,
    operationCode: t.operationCode ?? '—',
    bundleId: t.bundleId ?? '—',
  }))
}
