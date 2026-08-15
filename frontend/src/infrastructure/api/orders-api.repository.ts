import type { Order, ProductionStatus } from '@/modules/orders/types'
import { api, isAxiosError } from '@/services/api'

export type MaterialStatusValue = 'PENDING' | 'ARRIVED' | 'PARTIAL'

export type ApiMaterial = {
  id: number
  orderId: number
  materialName: string
  materialType: string
  supplierName: string
  orderedQuantity: number
  orderedDate: string | null
  expectedArrival: string | null
  arrivedQuantity: number
  status: MaterialStatusValue
  fabricWidth: number | null
  fabricWeight: number | null
  unitPrice: number | null
  currency: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

type ApiOrder = {
  id: number | string
  orderNo: string
  buyerName: string
  productName: string
  totalQuantity: number
  shipmentDate: string
  status: string
  tenantId: string
  createdAt: string
  updatedAt: string
  materials: ApiMaterial[]
}

export type ApiOrderDetail = ApiOrder

const STATUS_MAP: Record<string, ProductionStatus> = {
  PLANNING: 'Beklemede',
  IN_PRODUCTION: 'Üretimde',
  COMPLETED: 'Tamamlandı',
  SHIPPED: 'Sevk Edildi',
}

function formatExf(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function dateOnly(value: string): number {
  const d = new Date(value)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function isPastExf(expectedArrival: string, shipmentDate: string): boolean {
  return dateOnly(expectedArrival) > dateOnly(shipmentDate)
}

function computeTerminRisk(raw: ApiOrder): boolean {
  return (raw.materials ?? []).some(
    (m) => m.expectedArrival != null && isPastExf(m.expectedArrival, raw.shipmentDate),
  )
}

function mapOrder(raw: ApiOrder): Order {
  const exfDateObj = new Date(raw.shipmentDate)

  return {
    id: String(raw.id),
    orderNo: raw.orderNo,
    customer: raw.buyerName,
    brand: '',
    model: raw.productName,
    season: '',
    color: '',
    sizeSet: '',
    totalQuantity: raw.totalQuantity,
    exfDate: formatExf(exfDateObj),
    exfTimestamp: exfDateObj.getTime(),
    productionStatus: STATUS_MAP[raw.status] ?? 'Beklemede',
    fabricStatus: 'Bekliyor',
    accessoryStatus: 'Bekliyor',
    cuttingStatus: '—',
    sewingStatus: '—',
    packingStatus: '—',
    shippingStatus: '—',
    progress: 0,
    planner: '',
    terminRisk: computeTerminRisk(raw),
  }
}

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiOrder[]>('/orders')
  return data.map(mapOrder)
}

export type CreateOrderInput = {
  orderNo: string
  buyerName: string
  productName: string
  totalQuantity: number
  shipmentDate: string
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  try {
    const { data } = await api.post<ApiOrder>('/orders', input)
    return mapOrder(data)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 409) {
      throw new Error('Bu sipariş numarası zaten kayıtlı.')
    }
    throw err
  }
}

export async function fetchOrderById(id: string): Promise<ApiOrderDetail> {
  const { data } = await api.get<ApiOrderDetail>(`/orders/${id}`)
  return data
}

export type CreateMaterialInput = {
  materialName: string
  materialType: string
  supplierName: string
  orderedQuantity: number
  expectedArrival?: string
  fabricWidth?: number
  fabricWeight?: number
  unitPrice?: number
  currency?: string
}

export async function fetchMaterials(orderId: string): Promise<ApiMaterial[]> {
  const { data } = await api.get<ApiMaterial[]>(`/orders/${orderId}/materials`)
  return data
}

export async function createMaterial(
  orderId: string,
  input: CreateMaterialInput,
): Promise<ApiMaterial> {
  const { data } = await api.post<ApiMaterial>(`/orders/${orderId}/materials`, input)
  return data
}

export async function updateMaterialStatus(
  orderId: string,
  materialId: number,
  status: MaterialStatusValue,
): Promise<ApiMaterial> {
  const { data } = await api.patch<ApiMaterial>(
    `/orders/${orderId}/materials/${materialId}`,
    { status },
  )
  return data
}

export type ProductionStage = 'CUTTING' | 'SEWING' | 'IRONING' | 'PACKING' | 'SHIPPING'

export type ApiProductionEntry = {
  id: number
  orderId: number
  stage: ProductionStage
  quantity: number
  date: string
  lineNo: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type CreateProductionEntryInput = {
  stage: ProductionStage
  quantity: number
  date?: string
  lineNo?: string
  notes?: string
}

export async function fetchProductionEntries(orderId: string): Promise<ApiProductionEntry[]> {
  const { data } = await api.get<ApiProductionEntry[]>(`/orders/${orderId}/production`)
  return data
}

export async function createProductionEntry(
  orderId: string,
  input: CreateProductionEntryInput,
): Promise<ApiProductionEntry> {
  const { data } = await api.post<ApiProductionEntry>(`/orders/${orderId}/production`, input)
  return data
}
