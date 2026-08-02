import type { MasterDataApprovalRequest, MasterDataLifecycleStatus } from '@/domain/master-data/enterprise/types'
import type { IMasterDataApprovalRepository } from '@/domain/ports/persistence/aggregates/master-data-approval.repository'

export class MasterDataApprovalInMemoryRepository implements IMasterDataApprovalRepository {
  private requests: MasterDataApprovalRequest[] = []
  private counter = 0

  captureSnapshot(): { requests: MasterDataApprovalRequest[]; counter: number } {
    return { requests: structuredClone(this.requests), counter: this.counter }
  }

  restoreSnapshot(state: { requests: MasterDataApprovalRequest[]; counter: number }): void {
    this.requests = structuredClone(state.requests)
    this.counter = state.counter
  }

  findById(_tenantId: string, id: string): MasterDataApprovalRequest | null {
    return this.requests.find((r) => r.id === id) ?? null
  }

  findByEntityId(_tenantId: string, entityId: string): MasterDataApprovalRequest | null {
    return (
      this.requests.find((r) => r.entityId === entityId && r.lifecycleStatus === 'PendingApproval') ?? null
    )
  }

  findPending(_tenantId: string): MasterDataApprovalRequest[] {
    return this.requests.filter((r) => r.lifecycleStatus === 'PendingApproval')
  }

  findAll(_tenantId: string): MasterDataApprovalRequest[] {
    return [...this.requests]
  }

  save(_tenantId: string, request: MasterDataApprovalRequest): MasterDataApprovalRequest {
    const idx = this.requests.findIndex((r) => r.id === request.id)
    if (idx >= 0) this.requests[idx] = request
    else this.requests.push(request)
    return request
  }

  getLifecycleStatus(_tenantId: string, entityId: string): MasterDataLifecycleStatus {
    const pending = this.requests.find((r) => r.entityId === entityId && r.lifecycleStatus === 'PendingApproval')
    return pending ? 'PendingApproval' : 'Active'
  }

  nextApprovalId(_tenantId: string): string {
    this.counter += 1
    return `mda-${String(this.counter).padStart(6, '0')}`
  }

  seedFromLegacy(_tenantId: string, requests: MasterDataApprovalRequest[]): void {
    this.requests = [...requests]
    this.counter = requests.length
  }
}

export const masterDataApprovalInMemory = new MasterDataApprovalInMemoryRepository()
