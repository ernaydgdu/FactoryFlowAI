import { recordMasterDataCreate } from './audit-service'
import { publishMasterDataBrainEvent } from './brain-change-feed'
import { submitMasterDataForApproval, approveMasterDataChange } from './approval-service'

/** Demo audit/approval/brain feed — runtime bootstrap */
export function bootstrapEnterpriseMasterDataDemo(): void {
  const ctx = { changedBy: 'system@kepler.local', ip: '127.0.0.1', machine: 'KEPLER-MD-01' }

  recordMasterDataCreate('fit', {
    id: 'fit-oversize',
    code: 'OVERSIZE',
    name: 'Oversize',
    version: 1,
  }, ctx)

  publishMasterDataBrainEvent({
    entityType: 'fit',
    entityId: 'fit-oversize',
    entityCode: 'OVERSIZE',
    changeType: 'created',
    summary: 'Yeni Fit oluşturuldu: Oversize',
    occurredAt: new Date().toISOString(),
  })

  publishMasterDataBrainEvent({
    entityType: 'washType',
    entityId: 'wash-silicone',
    entityCode: 'SILICONE',
    changeType: 'created',
    summary: 'Yeni Wash Type eklendi: Silicone Wash',
    occurredAt: new Date().toISOString(),
  })

  publishMasterDataBrainEvent({
    entityType: 'warehouse',
    entityId: 'wh-kms',
    entityCode: 'KMS-01',
    changeType: 'activated',
    summary: 'Yeni Warehouse açıldı: Kumaş Deposu',
    occurredAt: new Date().toISOString(),
  })

  const approval = submitMasterDataForApproval('fabricType', 'ft-fleece', 'FLEECE', 'planner@kepler.local')
  approveMasterDataChange(approval.id, 'manager@kepler.local', ctx, {
    id: 'ft-fleece',
    code: 'FLEECE',
    name: 'Fleece',
    version: 2,
    lifecycleStatus: 'Active',
  })
}

let bootstrapped = false
export function ensureEnterpriseDemoBootstrapped(): void {
  if (bootstrapped) return
  bootstrapped = true
  bootstrapEnterpriseMasterDataDemo()
}
