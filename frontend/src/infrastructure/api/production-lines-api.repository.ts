import { api, isAxiosError } from '@/services/api'

export type ApiProductionLine = {
  id: number
  name: string
  capacity: number
  tenantId: string
  createdAt: string
  updatedAt: string
}

export type LineStatusOrder = {
  orderNo: string
  buyerName: string
  productName: string
}

export type LineStatus = {
  lineName: string
  capacity: number
  todayProduction: number
  fillRate: number
  activeOrders: LineStatusOrder[]
  currentHour: number
  workdayStartHour: number
  workdayEndHour: number
  expectedProgressByNow: number
  onPace: boolean
  paceMessage: string | null
}

export async function fetchProductionLines(): Promise<ApiProductionLine[]> {
  const { data } = await api.get<ApiProductionLine[]>('/production-lines')
  return data
}

export async function fetchLineStatus(): Promise<LineStatus[]> {
  const { data } = await api.get<LineStatus[]>('/production-lines/status')
  return data
}

export type CreateProductionLineInput = {
  name: string
  capacity?: number
}

export async function createProductionLine(
  input: CreateProductionLineInput,
): Promise<ApiProductionLine> {
  try {
    const { data } = await api.post<ApiProductionLine>('/production-lines', input)
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}
