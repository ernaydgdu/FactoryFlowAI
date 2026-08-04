import { runCommandInTransaction } from '@/application/core/command-transaction'
import {
  MasterDataDomainError,
  persistCreateMasterDataEntity,
  persistDeactivateMasterDataEntity,
  persistReactivateMasterDataEntity,
  persistUpdateMasterDataEntity,
  queryMasterDataById,
  queryMasterDataList,
} from '@/domain/master-data/master-data-crud.service'
import type { MasterDataCrudEntityKey } from '@/domain/master-data/master-data-crud.registry'
import {
  brandRepository,
  collectionRepository,
  colorCardRepository,
  countryRepository,
  currencyRepository,
  customerRepository,
  productionLineRepository,
  seasonRepository,
  seasonTypeRepository,
  sizeSetRepository,
  supplierRepository,
  warehouseRepository,
  workshopRepository,
} from '@/domain/master-data/repositories'
import type {
  CreateMasterDataCommand,
  LifecycleMasterDataCommand,
  MasterDataEntityDto,
  MasterDataReferenceOption,
  UpdateMasterDataCommand,
} from './master-data.dto'

export { MasterDataDomainError }

export function queryMasterDataEntities(entityKey: MasterDataCrudEntityKey): MasterDataEntityDto[] {
  return queryMasterDataList(entityKey) as MasterDataEntityDto[]
}

export function queryMasterDataEntity(
  entityKey: MasterDataCrudEntityKey,
  id: string,
): MasterDataEntityDto | null {
  const row = queryMasterDataById(entityKey, id)
  return row ? (row as MasterDataEntityDto) : null
}

export function executeCreateMasterData(command: CreateMasterDataCommand): MasterDataEntityDto {
  return runCommandInTransaction(() =>
    persistCreateMasterDataEntity(command.entityKey, command.input, command.actorUserId),
  ) as MasterDataEntityDto
}

export function executeUpdateMasterData(command: UpdateMasterDataCommand): MasterDataEntityDto {
  const { expectedVersion, ...fields } = command.input
  return runCommandInTransaction(() =>
    persistUpdateMasterDataEntity(
      command.entityKey,
      command.id,
      fields,
      expectedVersion,
      command.actorUserId,
    ),
  ) as MasterDataEntityDto
}

export function executeDeactivateMasterData(command: LifecycleMasterDataCommand): MasterDataEntityDto {
  return runCommandInTransaction(() =>
    persistDeactivateMasterDataEntity(
      command.entityKey,
      command.id,
      command.expectedVersion,
      command.actorUserId,
    ),
  ) as MasterDataEntityDto
}

export function executeReactivateMasterData(command: LifecycleMasterDataCommand): MasterDataEntityDto {
  return runCommandInTransaction(() =>
    persistReactivateMasterDataEntity(
      command.entityKey,
      command.id,
      command.expectedVersion,
      command.actorUserId,
    ),
  ) as MasterDataEntityDto
}

function toOptions(rows: { id: string; code: string; name: string }[]): MasterDataReferenceOption[] {
  return rows.map((row) => ({ id: row.id, code: row.code, name: row.name }))
}

export function queryMasterDataReferenceOptions(
  refKey: MasterDataCrudEntityKey | 'country' | 'currency' | 'seasonType',
): MasterDataReferenceOption[] {
  switch (refKey) {
    case 'customer':
      return toOptions(customerRepository.getActive())
    case 'supplier':
      return toOptions(supplierRepository.getActive())
    case 'warehouse':
      return toOptions(warehouseRepository.getActive())
    case 'workshop':
      return toOptions(workshopRepository.getActive())
    case 'productionLine':
      return toOptions(productionLineRepository.getActive())
    case 'brand':
      return toOptions(brandRepository.getActive())
    case 'season':
      return toOptions(seasonRepository.getActive())
    case 'collection':
      return toOptions(collectionRepository.getActive())
    case 'colorCard':
      return toOptions(colorCardRepository.getActive())
    case 'sizeSet':
      return toOptions(sizeSetRepository.getActive())
    case 'country':
      return toOptions(countryRepository.getActive())
    case 'currency':
      return toOptions(currencyRepository.getActive())
    case 'seasonType':
      return toOptions(seasonTypeRepository.getActive())
    default:
      return []
  }
}
