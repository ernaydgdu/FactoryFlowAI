import { mapPackagingDashboard } from './packaging.mapper'
import {
  executeAddPackage,
  executeApprovePackingList,
  executeAssignContainer,
  executeAutoGenerateFromFg,
  executeBindShipment,
  executeConfirmPackingList,
  executeCreatePackingList,
  executeNestPackage,
  executeRevisePackingList,
  executeSubmitPackingApproval,
  executeValidatePackingList,
  queryPackageLabel,
  queryPackagingBrain,
  queryPackingList,
  queryPackingListPdf,
  queryPackingLists,
} from './packaging-command.mapper'

export const packagingApplicationService = {
  query: {
    dashboard: mapPackagingDashboard,
    lists: queryPackingLists,
    detail: queryPackingList,
    brain: queryPackagingBrain,
    pdf: queryPackingListPdf,
    packageLabel: queryPackageLabel,
  },
  command: {
    create: executeCreatePackingList,
    addPackage: executeAddPackage,
    validate: executeValidatePackingList,
    confirm: executeConfirmPackingList,
    submitApproval: executeSubmitPackingApproval,
    approve: executeApprovePackingList,
    revise: executeRevisePackingList,
    assignContainer: executeAssignContainer,
    nestPackage: executeNestPackage,
    autoGenerateFromFg: executeAutoGenerateFromFg,
    bindShipment: executeBindShipment,
  },
}
