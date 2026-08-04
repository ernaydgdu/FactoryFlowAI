/**
 * Labor Tracking — işçilik/operatör read-model'i.
 * Kalıcı work session stream'i + master-data personel kayıtlarından
 * türetilir; yeni persistence portu YOK.
 */
import { employeeRepository } from '@/domain/master-data'
import type { OperationWorkSession } from '@/domain/execution-platform/execution-types'

import { listAllWorkSessions } from './machine-tracking.service'
import type { LaborTrackingView, MachineRuntimeStatus } from './shop-floor.types'

function statusFromSessions(sessions: OperationWorkSession[]): MachineRuntimeStatus {
  if (sessions.some((s) => s.status === 'InProgress')) return 'Running'
  if (sessions.some((s) => s.status === 'Paused')) return 'Paused'
  return 'Idle'
}

export function getLaborTrackingList(): LaborTrackingView[] {
  const allSessions = listAllWorkSessions()
  const byOperator = new Map<string, OperationWorkSession[]>()
  for (const s of allSessions) {
    const list = byOperator.get(s.operatorId) ?? []
    list.push(s)
    byOperator.set(s.operatorId, list)
  }

  const employees = employeeRepository.getAll()
  const employeeByKey = new Map(employees.flatMap((e) => [[e.id, e] as const, [e.code, e] as const]))

  const views: LaborTrackingView[] = []
  for (const [operatorId, sessions] of byOperator) {
    const employee = employeeByKey.get(operatorId)
    const active =
      sessions.find((s) => s.status === 'InProgress') ?? sessions.find((s) => s.status === 'Paused')
    views.push({
      operatorId,
      operatorName: employee?.name ?? operatorId,
      department: employee?.department ?? '—',
      status: statusFromSessions(sessions),
      activeProductionOrderNo: active?.productionOrderNo ?? null,
      activeOperationCode: active?.operationCode ?? null,
      activeMachineId: active?.machineId ?? null,
      sessionCount: sessions.length,
      totalCompletedQty: sessions.reduce((sum, s) => sum + s.completedQty, 0),
      totalReworkQty: sessions.reduce((sum, s) => sum + s.reworkQty, 0),
      totalRejectQty: sessions.reduce((sum, s) => sum + s.rejectQty, 0),
      totalDowntimeMinutes: sessions.reduce((sum, s) => sum + s.downtimeMinutes, 0),
    })
  }

  // Oturumu olmayan aktif operatörler de listede görünsün (Idle)
  for (const employee of employees.filter((e) => e.isActive)) {
    if (byOperator.has(employee.id) || byOperator.has(employee.code)) continue
    views.push({
      operatorId: employee.code,
      operatorName: employee.name,
      department: employee.department,
      status: 'Idle',
      activeProductionOrderNo: null,
      activeOperationCode: null,
      activeMachineId: null,
      sessionCount: 0,
      totalCompletedQty: 0,
      totalReworkQty: 0,
      totalRejectQty: 0,
      totalDowntimeMinutes: 0,
    })
  }

  return views.sort((a, b) => a.operatorName.localeCompare(b.operatorName, 'tr'))
}
