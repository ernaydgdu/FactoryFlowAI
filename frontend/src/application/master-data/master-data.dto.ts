import type { MasterDataCrudEntityKey } from '@/domain/master-data/master-data-crud.registry'
import type { BaseMasterEntity } from '@/domain/master-data/types'

export type MasterDataEntityDto = BaseMasterEntity & Record<string, unknown>

export type CreateMasterDataDto = Record<string, unknown> & {
  code: string
  name: string
}

export type UpdateMasterDataDto = Record<string, unknown> & {
  expectedVersion: number
}

export type MasterDataMutationContext = {
  entityKey: MasterDataCrudEntityKey
  actorUserId: string
}

export type CreateMasterDataCommand = MasterDataMutationContext & {
  input: CreateMasterDataDto
}

export type UpdateMasterDataCommand = MasterDataMutationContext & {
  id: string
  input: UpdateMasterDataDto
}

export type LifecycleMasterDataCommand = MasterDataMutationContext & {
  id: string
  expectedVersion: number
}

export type MasterDataReferenceOption = {
  id: string
  code: string
  name: string
}
