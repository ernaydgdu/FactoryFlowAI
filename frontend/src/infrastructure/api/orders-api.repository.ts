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
  stockLotId?: number | null
  hasStockLot?: boolean
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
  productType: string | null
  materialWarning: boolean
  colorCount?: number
  colorSizeTotal?: number
  cuttingReady?: boolean
  colorSizes?: ApiOrderColorSize[]
  closedAt?: string | null
  closedBy?: string | null
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
    productType: raw.productType ?? null,
    materialWarning: raw.materialWarning ?? false,
    colorCount: raw.colorCount ?? 0,
    colorSizeTotal: raw.colorSizeTotal ?? 0,
    cuttingReady: raw.cuttingReady ?? false,
    closedAt: raw.closedAt ?? null,
  }
}

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiOrder[]>('/orders')
  return data.map(mapOrder)
}

export async function exportOrdersCsv(): Promise<Blob> {
  const { data } = await api.get<Blob>('/orders/export', {
    responseType: 'blob',
  })
  return data
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
    const { data } = await api.post<ApiOrderDetail>('/orders', input)
    return mapOrder(data)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 409) {
      throw new Error('Bu sipariş numarası zaten kayıtlı.')
    }
    throw err
  }
}

export type UpdateOrderInput = {
  orderNo?: string
  buyerName?: string
  productName?: string
  totalQuantity?: number
  shipmentDate?: string
}

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
  try {
    const { data } = await api.patch<ApiOrder>(`/orders/${id}`, input)
    return mapOrder(data)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 409) {
      throw new Error('Bu sipariş numarası zaten kayıtlı.')
    }
    if (isAxiosError(err) && err.response?.status === 404) {
      throw new Error('Sipariş bulunamadı.')
    }
    if (isAxiosError(err) && err.response?.status === 403) {
      throw new Error('Bu işlem için yetkiniz yok.')
    }
    throw err
  }
}

export async function deleteOrder(id: string): Promise<void> {
  try {
    await api.delete(`/orders/${id}`)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      throw new Error('Sipariş bulunamadı.')
    }
    if (isAxiosError(err) && err.response?.status === 403) {
      throw new Error('Bu işlem için yetkiniz yok.')
    }
    throw err
  }
}

export async function fetchOrderById(id: string): Promise<ApiOrderDetail> {
  const { data } = await api.get<ApiOrderDetail>(`/orders/${id}`)
  return data
}

export type OrderAiSuggestion = {
  productType: string | null
  estimatedNeed: number | null
  warning: string | null
  ok: boolean
}

export async function fetchAiSuggestion(orderId: string): Promise<OrderAiSuggestion> {
  const { data } = await api.get<OrderAiSuggestion>(`/orders/${orderId}/ai-suggestion`)
  return data
}

export type OrderCompletionForecast = {
  hasEnoughData: boolean
  dailyAverageRate: number | null
  estimatedCompletionDate: string | null
  daysRemaining: number | null
  willMeetDeadline: boolean | null
  delayDays: number | null
}

export async function fetchOrderForecast(orderId: string): Promise<OrderCompletionForecast> {
  const { data } = await api.get<OrderCompletionForecast>(`/orders/${orderId}/forecast`)
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

export type UpdateMaterialInput = {
  materialName?: string
  supplierName?: string
  orderedQuantity?: number
  expectedArrival?: string
  fabricWidth?: number
  fabricWeight?: number
  unitPrice?: number
  currency?: string
}

export async function updateMaterial(
  orderId: string,
  materialId: number,
  input: UpdateMaterialInput,
): Promise<ApiMaterial> {
  const { data } = await api.patch<ApiMaterial>(
    `/orders/${orderId}/materials/${materialId}`,
    input,
  )
  return data
}

export async function deleteMaterial(orderId: string, materialId: number): Promise<void> {
  await api.delete(`/orders/${orderId}/materials/${materialId}`)
}

export type MaterialStockAvailabilityLot = {
  lotId: number
  lotNo: string | null
  remainingQty: number
  receivedDate: string
}

export type MaterialStockAvailability = {
  availableQty: number
  lots: MaterialStockAvailabilityLot[]
}

export async function fetchMaterialStockAvailability(
  orderId: string,
  materialId: number,
): Promise<MaterialStockAvailability> {
  const { data } = await api.get<MaterialStockAvailability>(
    `/orders/${orderId}/materials/${materialId}/stock-availability`,
  )
  return data
}

export async function fulfillMaterialFromStock(
  orderId: string,
  materialId: number,
  quantity: number,
): Promise<ApiMaterial> {
  try {
    const { data } = await api.post<ApiMaterial>(
      `/orders/${orderId}/materials/${materialId}/fulfill-from-stock`,
      { quantity },
    )
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
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

export type FabricConsumptionResult = {
  consumedQty: number
  warehouseName: string
  success: boolean
}

export type FinishedGoodsEntryResult = {
  addedQty: number
  warehouseName: string
}

export type ShipmentEntryResult = {
  deductedQty: number
  warehouseName: string
  remainingAfterShipment: number
}

export type CreateProductionEntryResult = ApiProductionEntry & {
  fabricConsumption: FabricConsumptionResult | null
  finishedGoodsEntry: FinishedGoodsEntryResult | null
  shipmentEntry: ShipmentEntryResult | null
}

export async function fetchProductionEntries(orderId: string): Promise<ApiProductionEntry[]> {
  const { data } = await api.get<ApiProductionEntry[]>(`/orders/${orderId}/production`)
  return data
}

export async function createProductionEntry(
  orderId: string,
  input: CreateProductionEntryInput,
): Promise<CreateProductionEntryResult> {
  const { data } = await api.post<CreateProductionEntryResult>(
    `/orders/${orderId}/production`,
    input,
  )
  return data
}

export async function deleteProductionEntry(orderId: string, entryId: number): Promise<void> {
  await api.delete(`/orders/${orderId}/production/${entryId}`)
}

export type ApiQualityEntry = {
  id: number
  orderId: number
  checkedQty: number
  firstQuality: number
  secondQuality: number
  rejected: number
  defectType: string | null
  date: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type CreateQualityEntryInput = {
  checkedQty: number
  firstQuality: number
  secondQuality: number
  rejected: number
  defectType?: string
  date?: string
  notes?: string
}

export async function fetchQualityEntries(orderId: string): Promise<ApiQualityEntry[]> {
  const { data } = await api.get<ApiQualityEntry[]>(`/orders/${orderId}/quality`)
  return data
}

export async function createQualityEntry(
  orderId: string,
  input: CreateQualityEntryInput,
): Promise<ApiQualityEntry> {
  try {
    const { data } = await api.post<ApiQualityEntry>(`/orders/${orderId}/quality`, input)
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}

export async function deleteQualityEntry(orderId: string, entryId: number): Promise<void> {
  await api.delete(`/orders/${orderId}/quality/${entryId}`)
}

export type ApiOrderColorSize = {
  id: number
  orderId: number
  color: string
  size: string
  quantity: number
  createdAt: string
  updatedAt: string
}

export type UpsertColorSizeInput = {
  color: string
  size: string
  quantity: number
}

export async function fetchColorSizes(orderId: string): Promise<ApiOrderColorSize[]> {
  const { data } = await api.get<ApiOrderColorSize[]>(`/orders/${orderId}/color-sizes`)
  return data
}

export async function upsertColorSize(
  orderId: string,
  input: UpsertColorSizeInput,
): Promise<ApiOrderColorSize> {
  const { data } = await api.post<ApiOrderColorSize>(`/orders/${orderId}/color-sizes`, input)
  return data
}

export async function deleteColorSize(orderId: string, colorSizeId: number): Promise<void> {
  await api.delete(`/orders/${orderId}/color-sizes/${colorSizeId}`)
}

export type ApprovalStageType =
  | 'PP_NUMUNE'
  | 'PASTAL_ONAY'
  | 'SARFIYAT_ONAY'
  | 'KESIM_ONAY'

export type ApprovalStageStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ApiApprovalStage = {
  id: number
  orderId: number
  stageType: ApprovalStageType
  status: ApprovalStageStatus
  approvedBy: string | null
  approvedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type UpdateApprovalStageInput = {
  status?: ApprovalStageStatus
  approvedBy?: string
  notes?: string
}

export async function fetchApprovalStages(orderId: string): Promise<ApiApprovalStage[]> {
  const { data } = await api.get<ApiApprovalStage[]>(`/orders/${orderId}/approval-stages`)
  return data
}

export async function updateApprovalStage(
  orderId: string,
  stageId: number,
  input: UpdateApprovalStageInput,
): Promise<ApiApprovalStage> {
  try {
    const { data } = await api.patch<ApiApprovalStage>(
      `/orders/${orderId}/approval-stages/${stageId}`,
      input,
    )
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}

export type ProductionStageKey = 'CUTTING' | 'SEWING' | 'IRONING' | 'PACKING' | 'SHIPPING'

export type ClosingChecklist = {
  approvalsComplete: boolean
  cuttingComplete: boolean
  sewingComplete: boolean
  packingComplete: boolean
  shipmentComplete: boolean
  qualityChecked: boolean
  colorSizeMatches: boolean
  readyToClose: boolean
  missingItems: string[]
  alreadyClosed: boolean
  closedAt: string | null
  closedBy: string | null
}

export type ClosingSummary = {
  orderQuantity: number
  productionByStage: Record<ProductionStageKey, number>
  quality: {
    totalChecked: number
    firstQuality: number
    secondQuality: number
    rejected: number
    secondQualityRate: number
    fireRate: number
  }
  fabric: {
    estimatedNeedMeters: number | null
    actualConsumedMeters: number
    varianceMeters: number | null
    variancePercent: number | null
  }
  materials: Array<{
    materialName: string
    orderedQuantity: number
    arrivedQuantity: number
    unitPrice: number | null
    currency: string | null
  }>
  finishedGoods: { packaged: number; shipped: number; remaining: number }
}

export type OrderClosingSummary = {
  checklist: ClosingChecklist
  summary: ClosingSummary
}

export async function fetchClosingSummary(orderId: string): Promise<OrderClosingSummary> {
  const { data } = await api.get<OrderClosingSummary>(`/orders/${orderId}/closing-summary`)
  return data
}

export async function closeOrder(orderId: string, force?: boolean): Promise<ApiOrderDetail> {
  try {
    const { data } = await api.post<ApiOrderDetail>(`/orders/${orderId}/close`, { force })
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}

export async function reopenOrder(orderId: string): Promise<ApiOrderDetail> {
  try {
    const { data } = await api.post<ApiOrderDetail>(`/orders/${orderId}/reopen`, {})
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}

export type PackingListColorSize = {
  color: string
  size: string
  quantity: number
}

export type PackingList = {
  order: {
    orderNo: string
    buyerName: string
    productName: string
    totalQuantity: number
    shipmentDate: string
  }
  colorSizes: PackingListColorSize[]
  packingSummary: { packaged: number; shipped: number; remaining: number }
  reportDate: string
}

export async function fetchPackingList(orderId: string): Promise<PackingList> {
  const { data } = await api.get<PackingList>(`/orders/${orderId}/packing-list`)
  return data
}

export async function exportPackingListCsv(orderId: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/orders/${orderId}/packing-list/export`, {
    responseType: 'blob',
  })
  return data
}
