import type { ProductionCalendarSlot } from '@/domain/execution-platform/execution-types'
import { getProductionCalendar } from '@/domain/execution-platform/execution-platform-service'

import type { ExecutionCalendarSlotDto, ExecutionCalendarViewModel } from './execution-calendar.dto'

function mapSlot(s: ProductionCalendarSlot): ExecutionCalendarSlotDto {
  return {
    id: s.id,
    productionOrderNo: s.productionOrderNo,
    lineId: s.lineId,
    lineCode: s.lineCode,
    operationCode: s.operationCode,
    slotDate: s.slotDate,
    hourStart: s.hourStart,
    hourEnd: s.hourEnd,
    plannedQty: s.plannedQty,
    actualQty: s.actualQty,
    status: s.status,
  }
}

export function queryExecutionCalendar(productionOrderNo?: string): ExecutionCalendarViewModel {
  return {
    productionOrderNo: productionOrderNo ?? null,
    slots: getProductionCalendar(productionOrderNo).map(mapSlot),
  }
}
