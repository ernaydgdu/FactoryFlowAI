import { api, isAxiosError } from '@/services/api'

export type ApiStockLot = {
  id: number
  materialName: string
  materialType: string
  supplierName: string
  lotNo: string | null
  receivedQty: number
  remainingQty: number
  unitPrice: number | null
  currency: string
  receivedDate: string
  orderId: number | null
  createdAt: string
  updatedAt: string
}

export type CreateStockLotInput = {
  materialName: string
  materialType: string
  supplierName: string
  lotNo?: string
  receivedQty: number
  unitPrice?: number
  currency?: string
  receivedDate?: string
  orderId?: number
}

export async function fetchStockLots(materialType?: string): Promise<ApiStockLot[]> {
  const { data } = await api.get<ApiStockLot[]>('/stock/lots', {
    params: materialType ? { materialType } : undefined,
  })
  return data
}

export async function createStockLot(input: CreateStockLotInput): Promise<ApiStockLot> {
  try {
    const { data } = await api.post<ApiStockLot>('/stock/lots', input)
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}

export type ConsumeStockLotInput = {
  quantity: number
  reason?: string
  orderId?: number
}

export async function consumeStockLot(
  lotId: number,
  input: ConsumeStockLotInput,
): Promise<ApiStockLot> {
  try {
    const { data } = await api.post<ApiStockLot>(`/stock/lots/${lotId}/consume`, input)
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}

export type ApiStockMovement = {
  id: number
  stockLotId: number
  type: 'GIRIS' | 'CIKIS'
  quantity: number
  reason: string | null
  orderId: number | null
  date: string
  createdAt: string
}

export async function fetchStockMovements(lotId: number): Promise<ApiStockMovement[]> {
  const { data } = await api.get<ApiStockMovement[]>(`/stock/lots/${lotId}/movements`)
  return data
}

export type FifoSuggestionLine = {
  lotId: number
  lotNo: string | null
  supplierName: string
  receivedDate: string
  useQty: number
  remainingAfter: number
}

export type FifoSuggestion = {
  materialName: string
  neededQty: number
  fulfilled: boolean
  shortfall: number
  totalAvailable: number
  suggestions: FifoSuggestionLine[]
}

export async function fetchFifoSuggestion(
  materialName: string,
  neededQty: number,
): Promise<FifoSuggestion> {
  try {
    const { data } = await api.get<FifoSuggestion>('/stock/fifo-suggestion', {
      params: { materialName, neededQty },
    })
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}
