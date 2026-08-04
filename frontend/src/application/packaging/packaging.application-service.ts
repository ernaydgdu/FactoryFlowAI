import { mapPackagingDashboard } from './packaging.mapper'
import {
  executeAddPackage,
  executeAutoGenerateFromFg,
  executeBindShipment,
  executeConfirmPackingList,
  executeCreatePackingList,
  executeValidatePackingList,
  queryPackingList,
  queryPackingLists,
} from './packaging-command.mapper'

export const packagingApplicationService = {
  query: {
    dashboard: mapPackagingDashboard,
    lists: queryPackingLists,
    detail: queryPackingList,
  },
  command: {
    create: executeCreatePackingList,
    addPackage: executeAddPackage,
    validate: executeValidatePackingList,
    confirm: executeConfirmPackingList,
    autoGenerateFromFg: executeAutoGenerateFromFg,
    bindShipment: executeBindShipment,
  },
}
