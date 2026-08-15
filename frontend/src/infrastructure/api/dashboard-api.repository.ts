import { api } from '@/services/api'

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
