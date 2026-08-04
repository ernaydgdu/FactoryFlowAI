import {
  executeActivateCostSheetRevision,
  executeApproveCostSheet,
  executeArchiveCostSheet,
  executeCreateCostSheet,
  executeCreateRevision,
  executeRecalculatePlannedCost,
  executeSubmitCostSheetForReview,
  executeUpdateCostSheet,
} from './cost-sheet-command.mapper'
import { mapCostSheetDesigner, mapCostSheetRevisionCompare } from './cost-sheet-designer.mapper'

export const costSheetDesignerApplicationService = {
  query: {
    byProduct: mapCostSheetDesigner,
    revisionCompare: mapCostSheetRevisionCompare,
  },
  command: {
    create: executeCreateCostSheet,
    update: executeUpdateCostSheet,
    approve: executeApproveCostSheet,
    createRevision: executeCreateRevision,
    activateRevision: executeActivateCostSheetRevision,
    archive: executeArchiveCostSheet,
    submitForReview: executeSubmitCostSheetForReview,
    recalculate: executeRecalculatePlannedCost,
  },
}
