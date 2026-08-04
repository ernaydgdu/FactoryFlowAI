import axios, { isAxiosError } from 'axios'

import { getRuntimeTenantContext } from '@/domain/platform/tenant/tenant-context.runtime'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kepler_token')

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  const { tenantId, factoryId } = getRuntimeTenantContext()
  config.headers.set('X-Tenant-Id', tenantId)
  config.headers.set('X-Factory-Id', factoryId)

  return config
})

export { isAxiosError }
