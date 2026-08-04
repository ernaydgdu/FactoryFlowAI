import { DEFAULT_FACTORY_ID } from '@/domain/platform/iam/types'

import { DEFAULT_TENANT_ID, type TenantContext } from './types'

let context: TenantContext = {
  tenantId: DEFAULT_TENANT_ID,
  factoryId: DEFAULT_FACTORY_ID,
  userId: null,
  userEmail: null,
  role: null,
}

export function getRuntimeTenantContext(): TenantContext {
  return { ...context }
}

export function setRuntimeTenantContext(next: Partial<TenantContext>): void {
  context = { ...context, ...next }
}

export function clearRuntimeTenantContext(): void {
  context = {
    tenantId: DEFAULT_TENANT_ID,
    factoryId: DEFAULT_FACTORY_ID,
    userId: null,
    userEmail: null,
    role: null,
  }
}

export function resetRuntimeTenantContextForTests(): void {
  clearRuntimeTenantContext()
}
