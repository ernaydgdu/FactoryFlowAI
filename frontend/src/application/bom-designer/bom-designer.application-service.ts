import {
  executeActivateBomRevision,
  executeApproveBom,
  executeArchiveBom,
  executeCreateBom,
  executeCreateBomRevision,
  executeDeleteBomLine,
  executeSubmitBomForReview,
  executeUpdateBom,
} from './bom-command.mapper'
import { mapBomDesigner, mapBomRevisionCompare, mapStockCardOptions } from './bom-designer.mapper'

export const bomDesignerApplicationService = {
  query: {
    byProduct: mapBomDesigner,
    stockOptions: mapStockCardOptions,
    revisionCompare: mapBomRevisionCompare,
  },
  command: {
    create: executeCreateBom,
    update: executeUpdateBom,
    deleteLine: executeDeleteBomLine,
    approve: executeApproveBom,
    createRevision: executeCreateBomRevision,
    activateRevision: executeActivateBomRevision,
    archive: executeArchiveBom,
    submitForReview: executeSubmitBomForReview,
  },
}
