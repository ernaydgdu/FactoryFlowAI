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
