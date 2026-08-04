import {
  executeCreateMasterData,
  executeDeactivateMasterData,
  executeReactivateMasterData,
  executeUpdateMasterData,
  queryMasterDataEntities,
  queryMasterDataEntity,
  queryMasterDataReferenceOptions,
} from './master-data.mapper'

export const masterDataApplicationService = {
  query: {
    list: queryMasterDataEntities,
    byId: queryMasterDataEntity,
    referenceOptions: queryMasterDataReferenceOptions,
  },
  command: {
    create: executeCreateMasterData,
    update: executeUpdateMasterData,
    deactivate: executeDeactivateMasterData,
    reactivate: executeReactivateMasterData,
  },
}
