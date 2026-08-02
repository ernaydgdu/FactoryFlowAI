/** Master Data approval request port */
import type { MasterDataApprovalRequest, MasterDataLifecycleStatus } from '@/domain/master-data/enterprise/types'

export interface IMasterDataApprovalRepository {
  findById(tenantId: string, id: string): MasterDataApprovalRequest | null
  findByEntityId(tenantId: string, entityId: string): MasterDataApprovalRequest | null
  findPending(tenantId: string): MasterDataApprovalRequest[]
  findAll(tenantId: string): MasterDataApprovalRequest[]
  save(tenantId: string, request: MasterDataApprovalRequest): MasterDataApprovalRequest
  getLifecycleStatus(tenantId: string, entityId: string): MasterDataLifecycleStatus
  nextApprovalId(tenantId: string): string
  seedFromLegacy(tenantId: string, requests: MasterDataApprovalRequest[]): void
}
