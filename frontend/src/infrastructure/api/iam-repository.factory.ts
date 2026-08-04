import type { IIamRepository } from '@/domain/ports/platform/iam.repository.port'
import { isRemoteApiRuntime } from '@/infrastructure/api/api-runtime.config'
import { iamApiRepository } from '@/infrastructure/api/iam-api.repository'
import { iamInMemoryRepository } from '@/infrastructure/persistence/in-memory/iam-in-memory.repository'

let repository: IIamRepository | null = null

export function resolveIamRepository(): IIamRepository {
  if (!repository) {
    repository = isRemoteApiRuntime() ? iamApiRepository : iamInMemoryRepository
  }
  return repository
}

export function resetIamRepositoryForTests(): void {
  repository = null
}
