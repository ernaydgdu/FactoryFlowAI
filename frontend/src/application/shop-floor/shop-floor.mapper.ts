/**
 * Shop Floor (MES) — read mapper'lar.
 * Kaynak: kalıcı execution platform aggregate/stream'leri + master data.
 */
import type { StatusBadgeDto } from '@/application/core/types'
import { getAllExecutionContexts } from '@/domain/execution-platform/execution-platform-service'
import { getAllExecutionTimelineEvents } from '@/domain/execution-platform/execution-timeline-service'
import { getBundlesForProductionOrder } from '@/domain/execution-platform/bundle-tracking-service'
import { getOperationExecutions } from '@/domain/execution-platform/operation-execution-service'
import { getWorkSessions } from '@/domain/execution-platform/operation-work-session-service'
import type { OperationWorkSession } from '@/domain/execution-platform/execution-types'
import { employeeRepository, machineRepository } from '@/domain/master-data'
import { getLaborTrackingList } from '@/domain/shop-floor/labor-tracking.service'
import { getMachineStatusList, listAllWorkSessions } from '@/domain/shop-floor/machine-tracking.service'
import type { MachineRuntimeStatus } from '@/domain/shop-floor/shop-floor.types'

import type {
  BundleRowDto,
  LaborTrackingDto,
  MachineStatusDto,
  OperationProgressRowDto,
  OptionDto,
  ShopFloorContextOptionDto,
  ShopFloorOperationDto,
  ShopFloorSessionDto,
  TimelineItemDto,
  WorkstationViewDto,
} from './shop-floor.dto'

export const SHIFT_OPTIONS: OptionDto[] = [
  { value: 'SHIFT-1', label: 'Vardiya 1 (08–16)' },
  { value: 'SHIFT-2', label: 'Vardiya 2 (16–24)' },
  { value: 'SHIFT-3', label: 'Vardiya 3 (24–08)' },
]

function runtimeBadge(status: MachineRuntimeStatus): StatusBadgeDto {
  switch (status) {
    case 'Running':
      return { label: 'Çalışıyor', tone: 'success' }
    case 'Paused':
      return { label: 'Duraklatıldı', tone: 'warning' }
    default:
      return { label: 'Boşta', tone: 'default' }
  }
}

function operationBadge(status: string): StatusBadgeDto {
  switch (status) {
    case 'Completed':
      return { label: 'Tamamlandı', tone: 'success' }
    case 'InProgress':
      return { label: 'Devam Ediyor', tone: 'warning' }
    case 'Paused':
      return { label: 'Duraklatıldı', tone: 'warning' }
    case 'Blocked':
      return { label: 'Bloklu', tone: 'danger' }
    default:
      return { label: status, tone: 'default' }
  }
}

function sessionBadge(status: string): StatusBadgeDto {
  switch (status) {
    case 'InProgress':
      return { label: 'Devam Ediyor', tone: 'success' }
    case 'Paused':
      return { label: 'Duraklatıldı', tone: 'warning' }
    case 'Completed':
      return { label: 'Tamamlandı', tone: 'default' }
    case 'Cancelled':
      return { label: 'İptal', tone: 'muted' }
    default:
      return { label: status, tone: 'default' }
  }
}

export function mapShopFloorContexts(): ShopFloorContextOptionDto[] {
  return getAllExecutionContexts()
    .filter((c) => c.status !== 'Completed')
    .map((c) => ({
      productionOrderNo: c.productionOrderNo,
      productCode: c.productCode,
      lineId: c.lineId ?? '—',
      workshopCode: c.workshopCode,
      plannedQty: c.plannedQty,
      contextStatus: c.status,
    }))
    .sort((a, b) => a.productionOrderNo.localeCompare(b.productionOrderNo))
}

export function mapOperationsForOrder(productionOrderNo: string): ShopFloorOperationDto[] {
  if (!productionOrderNo) return []
  return getOperationExecutions(productionOrderNo)
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((op) => ({
      operationCode: op.operationCode,
      operationName: op.operationName,
      sequence: op.sequence,
      status: operationBadge(op.status),
      rawStatus: op.status,
      plannedQty: op.plannedQty,
      completedQty: op.completedQty,
      progressPercent: op.plannedQty > 0 ? Math.round((op.completedQty / op.plannedQty) * 100) : 0,
      requiredGate: op.requiredGate,
      gatePassed: op.gatePassed,
    }))
}

function mapSession(s: OperationWorkSession): ShopFloorSessionDto {
  return {
    id: s.id,
    productionOrderNo: s.productionOrderNo,
    operationCode: s.operationCode,
    lineId: s.lineId,
    machineId: s.machineId,
    operatorId: s.operatorId,
    shiftCode: s.shiftCode,
    status: sessionBadge(s.status),
    rawStatus: s.status,
    startedAt: s.startedAt,
    plannedQty: s.plannedQty,
    completedQty: s.completedQty,
    downtimeMinutes: s.downtimeMinutes,
  }
}

export function mapSessionsForOrder(productionOrderNo: string): ShopFloorSessionDto[] {
  if (!productionOrderNo) return []
  return getWorkSessions(productionOrderNo).map(mapSession).reverse()
}

function mapMachineStatus(v: ReturnType<typeof getMachineStatusList>[number]): MachineStatusDto {
  return {
    machineId: v.machineId,
    machineName: v.machineName,
    machineType: v.machineType,
    lineCode: v.lineCode,
    status: runtimeBadge(v.status),
    rawStatus: v.status,
    activeProductionOrderNo: v.activeProductionOrderNo ?? '—',
    activeOperationCode: v.activeOperationCode ?? '—',
    activeOperatorId: v.activeOperatorId ?? '—',
    completedQtyToday: v.completedQtyToday,
    downtimeMinutes: v.downtimeMinutes,
  }
}

export function mapMachineStatusList(): MachineStatusDto[] {
  return getMachineStatusList().map(mapMachineStatus)
}

export function mapLaborTrackingList(): LaborTrackingDto[] {
  return getLaborTrackingList().map((v) => ({
    operatorId: v.operatorId,
    operatorName: v.operatorName,
    department: v.department,
    status: runtimeBadge(v.status),
    activeProductionOrderNo: v.activeProductionOrderNo ?? '—',
    activeOperationCode: v.activeOperationCode ?? '—',
    activeMachineId: v.activeMachineId ?? '—',
    sessionCount: v.sessionCount,
    totalCompletedQty: v.totalCompletedQty,
    totalReworkQty: v.totalReworkQty,
    totalRejectQty: v.totalRejectQty,
    totalDowntimeMinutes: v.totalDowntimeMinutes,
  }))
}

export function mapOperationProgressList(): OperationProgressRowDto[] {
  return getAllExecutionContexts().flatMap((ctx) =>
    getOperationExecutions(ctx.productionOrderNo)
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((op) => ({
        id: `${ctx.productionOrderNo}-${op.operationCode}`,
        productionOrderNo: ctx.productionOrderNo,
        productCode: ctx.productCode,
        operationCode: op.operationCode,
        operationName: op.operationName,
        sequence: op.sequence,
        status: operationBadge(op.status),
        plannedQty: op.plannedQty,
        completedQty: op.completedQty,
        progressPercent: op.plannedQty > 0 ? Math.round((op.completedQty / op.plannedQty) * 100) : 0,
        gateLabel: op.requiredGate ? `${op.requiredGate}${op.gatePassed ? ' ✓' : ''}` : '—',
      })),
  )
}

export function mapWorkstationView(machineId: string): WorkstationViewDto {
  const machines = mapMachineStatusList()
  const machine = machines.find((m) => m.machineId === machineId) ?? null
  const sessions = machineId
    ? listAllWorkSessions()
        .filter((s) => s.machineId === machineId)
        .map(mapSession)
        .reverse()
        .slice(0, 25)
    : []
  return { machine, sessions }
}

export function mapMachineOptions(): OptionDto[] {
  return machineRepository.getActive().map((m) => ({ value: m.code, label: `${m.code} — ${m.name}` }))
}

export function mapOperatorOptions(): OptionDto[] {
  return employeeRepository
    .getActive()
    .map((e) => ({ value: e.code, label: `${e.code} — ${e.name}` }))
}

export function mapBundleList(productionOrderNo: string): BundleRowDto[] {
  if (!productionOrderNo) return []
  return getBundlesForProductionOrder(productionOrderNo).map((b) => ({
    id: b.id,
    bundleNo: b.bundleNo,
    productionOrderNo: b.productionOrderNo,
    status: b.status,
    currentOperationCode: b.currentOperationCode ?? '—',
    workshopCode: b.currentWorkshopCode ?? '—',
    pieceCount: b.pieceCount,
  }))
}

export function mapShopFloorTimeline(productionOrderNo?: string): TimelineItemDto[] {
  const events = productionOrderNo
    ? getAllExecutionTimelineEvents().filter((e) => e.productionOrderNo === productionOrderNo)
    : getAllExecutionTimelineEvents()
  return events
    .slice()
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 100)
    .map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      eventType: e.eventType,
      title: e.title,
      description: e.description,
      actor: e.actor,
    }))
}
