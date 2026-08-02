import { syncAllActiveProductionOrders } from '@/domain/execution-platform/execution-provisioning'

/** Execution Platform sorgularından önce lifecycle ile senkronize et (görünmez bootstrap) */
export function syncExecutionPlatformBeforeQuery(actor = 'system'): void {
  syncAllActiveProductionOrders(actor)
}
