import type { IIamRepository } from '@/domain/ports/platform/iam.repository.port'
import { iamApiRepository } from '@/infrastructure/api/iam-api.repository'

export function resolveIamRepository(): IIamRepository {
  return iamApiRepository
}
