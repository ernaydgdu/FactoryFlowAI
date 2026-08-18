import { api, isAxiosError } from '@/services/api'

export type ApiShipmentListItem = {
  id: number
  shipmentNo: string
  shipmentDate: string
  notes: string | null
  orderCount: number
  totalQty: number
  totalCartons: number
  createdAt: string
}

export type ApiShipmentLine = {
  id: number
  orderId: number
  orderNo: string
  buyerName: string
  productName: string
  color: string
  size: string
  totalQty: number
  unitsPerCarton: number | null
  fullCartons: number | null
  lottedQty: number | null
  looseQty: number
  totalCartons: number | null
}

export type ApiShipmentGrandTotal = {
  totalQty: number
  fullCartons: number
  lottedQty: number
  looseQty: number
  totalCartons: number
}

export type ApiShipmentDetail = {
  id: number
  shipmentNo: string
  shipmentDate: string
  notes: string | null
  createdBy: string | null
  lines: ApiShipmentLine[]
  grandTotal: ApiShipmentGrandTotal
}

export async function fetchShipments(): Promise<ApiShipmentListItem[]> {
  const { data } = await api.get<ApiShipmentListItem[]>('/shipments')
  return data
}

export async function fetchShipmentDetail(id: string): Promise<ApiShipmentDetail> {
  const { data } = await api.get<ApiShipmentDetail>(`/shipments/${id}`)
  return data
}

export type CreateShipmentLineInput = {
  orderId: number
  color: string
  size: string
  quantity: number
  unitsPerCarton?: number | null
}

export type CreateShipmentInput = {
  shipmentDate?: string
  notes?: string
  lines: CreateShipmentLineInput[]
}

export async function createShipment(input: CreateShipmentInput): Promise<ApiShipmentDetail> {
  try {
    const { data } = await api.post<ApiShipmentDetail>('/shipments', input)
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}

export async function deleteShipment(id: number): Promise<void> {
  await api.delete(`/shipments/${id}`)
}

export async function exportShipmentCsv(id: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/shipments/${id}/export`, {
    responseType: 'blob',
  })
  return data
}
