import { api, isAxiosError } from '@/services/api'
import type { PlatformCommandRequest, PlatformCommandResult, PlatformHealth, TenantContext } from '@/domain/platform/tenant/types'

export class ApiTransportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiTransportError'
  }
}

export async function fetchPlatformHealth(): Promise<PlatformHealth> {
  try {
    const { data } = await api.get<PlatformHealth>('/platform/health', { timeout: 3000 })
    return data
  } catch {
    return {
      status: 'degraded',
      runtime: 'remote',
      persistence: 'postgres',
      apiReachable: false,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function fetchTenantContext(): Promise<TenantContext> {
  try {
    const { data } = await api.get<TenantContext>('/platform/context')
    return data
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 401) {
      throw new ApiTransportError('Oturum gerekli.')
    }
    throw new ApiTransportError('Tenant context alınamadı.')
  }
}

export async function postPlatformCommand<T = unknown>(
  request: PlatformCommandRequest,
): Promise<PlatformCommandResult<T>> {
  try {
    const { data } = await api.post<PlatformCommandResult<T>>('/platform/commands', request)
    return data
  } catch (err) {
    if (isAxiosError(err) && err.response?.data) {
      const body = err.response.data as PlatformCommandResult<T>
      if (body.commandKey) return body
    }
    throw new ApiTransportError('Komut yürütülemedi.')
  }
}

export async function listRemoteCommands(): Promise<string[]> {
  const { data } = await api.get<{ commands: string[] }>('/platform/commands')
  return data.commands
}
