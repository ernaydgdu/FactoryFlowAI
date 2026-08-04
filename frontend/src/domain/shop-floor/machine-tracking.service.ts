/**
 * Machine Tracking — makine durumu read-model'i.
 * Kalıcı work session stream'i + master-data makine kayıtlarından türetilir;
 * yeni persistence portu YOK. Durum kuralı: InProgress oturum → Running,
 * yalnızca Paused oturum → Paused, hiç aktif oturum yok → Idle.
 */
import { machineRepository, productionLineRepository } from '@/domain/master-data'
import { getAllExecutionContexts } from '@/domain/execution-platform/execution-platform-service'
import { getWorkSessions } from '@/domain/execution-platform/operation-work-session-service'
import type { OperationWorkSession } from '@/domain/execution-platform/execution-types'

import type { MachineRuntimeStatus, MachineStatusView } from './shop-floor.types'

export function listAllWorkSessions(): OperationWorkSession[] {
  return getAllExecutionContexts().flatMap((ctx) => getWorkSessions(ctx.productionOrderNo))
}

function statusFromSessions(sessions: OperationWorkSession[]): MachineRuntimeStatus {
  if (sessions.some((s) => s.status === 'InProgress')) return 'Running'
  if (sessions.some((s) => s.status === 'Paused')) return 'Paused'
  return 'Idle'
}

export function getMachineStatusList(): MachineStatusView[] {
  const allSessions = listAllWorkSessions()
  const byMachine = new Map<string, OperationWorkSession[]>()
  for (const s of allSessions) {
    const list = byMachine.get(s.machineId) ?? []
    list.push(s)
    byMachine.set(s.machineId, list)
  }

  const linesById = new Map(productionLineRepository.getAll().map((l) => [l.id, l]))
  const today = new Date().toISOString().slice(0, 10)

  const views: MachineStatusView[] = machineRepository.getActive().map((machine) => {
    const sessions = byMachine.get(machine.id) ?? byMachine.get(machine.code) ?? []
    const active = sessions.find((s) => s.status === 'InProgress') ?? sessions.find((s) => s.status === 'Paused')
    return {
      machineId: machine.code,
      machineName: machine.name,
      machineType: machine.machineType,
      lineCode: linesById.get(machine.productionLineId)?.code ?? '—',
      status: statusFromSessions(sessions),
      activeProductionOrderNo: active?.productionOrderNo ?? null,
      activeOperationCode: active?.operationCode ?? null,
      activeOperatorId: active?.operatorId ?? null,
      completedQtyToday: sessions
        .filter((s) => s.startedAt.slice(0, 10) === today)
        .reduce((sum, s) => sum + s.completedQty, 0),
      downtimeMinutes: sessions.reduce((sum, s) => sum + s.downtimeMinutes, 0),
    }
  })

  // Master data'da olmayan ama oturumlarda geçen makineler de görünür olsun
  const knownIds = new Set(views.map((v) => v.machineId))
  const knownMasterIds = new Set(machineRepository.getActive().map((m) => m.id))
  for (const [machineId, sessions] of byMachine) {
    if (knownIds.has(machineId) || knownMasterIds.has(machineId)) continue
    const active = sessions.find((s) => s.status === 'InProgress') ?? sessions.find((s) => s.status === 'Paused')
    views.push({
      machineId,
      machineName: machineId,
      machineType: '—',
      lineCode: active?.lineId ?? '—',
      status: statusFromSessions(sessions),
      activeProductionOrderNo: active?.productionOrderNo ?? null,
      activeOperationCode: active?.operationCode ?? null,
      activeOperatorId: active?.operatorId ?? null,
      completedQtyToday: sessions
        .filter((s) => s.startedAt.slice(0, 10) === today)
        .reduce((sum, s) => sum + s.completedQty, 0),
      downtimeMinutes: sessions.reduce((sum, s) => sum + s.downtimeMinutes, 0),
    })
  }

  return views.sort((a, b) => a.machineId.localeCompare(b.machineId))
}
