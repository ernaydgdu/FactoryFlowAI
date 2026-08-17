import { api, isAxiosError } from '@/services/api'

export type ApiStockLot = {
  id: number
  code: string | null
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
  warehouseId: number | null
  warehouseName: string | null
  createdAt: string
  updatedAt: string
}

export type CreateStockLotInput = {
  code?: string
  materialName: string
  materialType: string
  supplierName: string
  lotNo?: string
  receivedQty: number
  unitPrice?: number
  currency?: string
  receivedDate?: string
  orderId?: number
  warehouseId?: number
}

export async function fetchStockLots(
  materialType?: string,
  warehouseId?: number,
): Promise<ApiStockLot[]> {
  const { data } = await api.get<ApiStockLot[]>('/stock/lots', {
    params: {
      ...(materialType ? { materialType } : {}),
      ...(warehouseId ? { warehouseId } : {}),
    },
  })
  return data
}

export type ApiWarehouse = {
  id: number
  code: string
  name: string
  type: string
  lineId: number | null
  lotCount: number
  totalValueByCurrency: Record<string, number>
  createdAt: string
  updatedAt: string
}

export async function fetchWarehouses(): Promise<ApiWarehouse[]> {
  const { data } = await api.get<ApiWarehouse[]>('/stock/warehouses')
  return data
}

export async function exportStockLotsCsv(warehouseId?: number): Promise<Blob> {
  const { data } = await api.get<Blob>('/stock/lots/export', {
    params: warehouseId ? { warehouseId } : undefined,
    responseType: 'blob',
  })
  return data
}

export type FinishedGoodsStatus =
  | 'SEVKIYAT_BEKLIYOR'
  | 'KISMI_SEVK_EDILDI'
  | 'TAMAMEN_SEVK_EDILDI'

export type ApiFinishedGoodsLine = {
  lotId: number
  orderId: number | null
  orderNo: string | null
  buyerName: string | null
  productName: string | null
  totalQuantity: number | null
  shipmentDate: string | null
  packagedQty: number
  remainingQty: number
  shippedQty: number
  status: FinishedGoodsStatus
}

export type ApiFinishedGoodsSummary = {
  totalPackaged: number
  totalShipped: number
  totalPending: number
  lines: ApiFinishedGoodsLine[]
}

export async function fetchFinishedGoods(): Promise<ApiFinishedGoodsSummary> {
  const { data } = await api.get<ApiFinishedGoodsSummary>('/stock/finished-goods')
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
