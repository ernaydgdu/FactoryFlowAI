import { api, isAxiosError } from '@/services/api'

export type ApiDashboard = {
  totalOrders: number
  terminRiskOrders: number
  totalProduction: number
  cuttingToday: number
  sewingToday: number
}

export async function fetchDashboard(): Promise<ApiDashboard> {
  const { data } = await api.get<ApiDashboard>('/dashboard')
  return data
}

export type DashboardAlertType = 'MATERIAL_DELAY' | 'MATERIAL_PENDING' | 'NO_PRODUCTION'
export type DashboardAlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW'

export type DashboardAlert = {
  id: string
  type: DashboardAlertType
  severity: DashboardAlertSeverity
  message: string
  orderId?: number
  orderNo?: string
}

export async function fetchDashboardAlerts(): Promise<DashboardAlert[]> {
  const { data } = await api.get<DashboardAlert[]>('/dashboard/alerts')
  return data
}

export type QualitySummary = {
  totalChecked: number
  totalFirstQuality: number
  totalSecondQuality: number
  totalRejected: number
  secondQualityRate: number
  rejectionRate: number
}

export async function fetchQualitySummary(): Promise<QualitySummary> {
  const { data } = await api.get<QualitySummary>('/dashboard/quality-summary')
  return data
}

export type RiskyOrder = {
  orderId: number
  orderNo: string
  buyerName: string
  productName: string
  riskScore: number
  risks: string[]
}

export async function fetchRiskyOrders(): Promise<RiskyOrder[]> {
  const { data } = await api.get<RiskyOrder[]>('/dashboard/risky-orders')
  return data
}

export type SupplierPerformance = {
  supplierName: string
  totalOrders: number
  onTimeCount: number
  lateCount: number
  pendingCount: number
  avgDelayDays: number
  reliabilityScore: number
}

export async function fetchSupplierPerformance(): Promise<SupplierPerformance[]> {
  const { data } = await api.get<SupplierPerformance[]>('/dashboard/supplier-performance')
  return data
}

export type SubcontractorPerformance = {
  subcontractorName: string
  totalShipments: number
  onTimeCount: number
  lateCount: number
  pendingCount: number
  avgDelayDays: number
  avgFireRate: number
  reliabilityScore: number
}

export async function fetchSubcontractorPerformance(): Promise<SubcontractorPerformance[]> {
  const { data } = await api.get<SubcontractorPerformance[]>(
    '/dashboard/subcontractor-performance',
  )
  return data
}

export async function fetchAiAdvice(): Promise<{ advice: string }> {
  try {
    const { data } = await api.post<{ advice: string }>('/dashboard/ai-advice')
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}

export async function fetchAskQuestion(question: string): Promise<{ answer: string }> {
  try {
    const { data } = await api.post<{ answer: string }>('/dashboard/ask', { question })
    return data
  } catch (err) {
    if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
      throw new Error(err.response.data.message)
    }
    throw err
  }
}
