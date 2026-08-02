export type ExecutionCalendarSlotDto = {
  id: string
  productionOrderNo: string
  lineId: string
  lineCode: string
  operationCode: string
  slotDate: string
  hourStart: number
  hourEnd: number
  plannedQty: number
  actualQty: number
  status: 'Planned' | 'InProgress' | 'Completed' | 'Delayed'
}

export type ExecutionCalendarViewModel = {
  productionOrderNo: string | null
  slots: ExecutionCalendarSlotDto[]
}
