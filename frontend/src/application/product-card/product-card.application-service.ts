import {
  executeActivateProductCard,
  executeApproveProductCard,
  executeArchiveProductCard,
  executeCreateProductCard,
  executeCreateRevision,
  executeDeactivateProductCard,
  executeSubmitProductCardForReview,
  executeUpdateProductCard,
} from './product-card-command.mapper'
import {
  mapApprovedProductCardOptions,
  mapProductCardDetail,
  mapProductCardEditForm,
  mapProductCardKpis,
  mapProductCardList,
} from './product-card.mapper'

export const productCardApplicationService = {
  query: {
    list: mapProductCardList,
    detail: mapProductCardDetail,
    editForm: mapProductCardEditForm,
    kpis: mapProductCardKpis,
    approvedOptions: mapApprovedProductCardOptions,
  },
  command: {
    create: executeCreateProductCard,
    update: executeUpdateProductCard,
    createRevision: executeCreateRevision,
    approve: executeApproveProductCard,
    submitForReview: executeSubmitProductCardForReview,
    activate: executeActivateProductCard,
    deactivate: executeDeactivateProductCard,
    archive: executeArchiveProductCard,
  },
}
