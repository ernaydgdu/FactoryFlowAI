/** Product Card lifecycle — aggregate root state machine */

export type ProductCardLifecycleStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved'
  | 'In Production'
  | 'Closed'
  | 'Archived'

export type ProductCardLifecycleTransition = {
  from: ProductCardLifecycleStatus
  to: ProductCardLifecycleStatus
  businessRuleId: string
  label: string
}

export const PRODUCT_CARD_LIFECYCLE_TRANSITIONS: ProductCardLifecycleTransition[] = [
  { from: 'Draft', to: 'Under Review', businessRuleId: 'PC-01-SUBMIT', label: 'İncelemeye gönder' },
  { from: 'Under Review', to: 'Approved', businessRuleId: 'PC-02-APPROVE', label: 'Onayla' },
  { from: 'Under Review', to: 'Draft', businessRuleId: 'PC-02-REJECT', label: 'Taslak\'a döndür' },
  { from: 'Approved', to: 'In Production', businessRuleId: 'PC-03-ACTIVATE', label: 'Üretime al' },
  { from: 'In Production', to: 'Closed', businessRuleId: 'PC-04-DEACTIVATE', label: 'Kapat' },
  { from: 'Approved', to: 'Closed', businessRuleId: 'PC-04-DEACTIVATE', label: 'Kapat' },
  { from: 'Closed', to: 'Archived', businessRuleId: 'PC-05-ARCHIVE', label: 'Arşivle' },
]

export const PRODUCT_CARD_EDITABLE_STATUSES: ProductCardLifecycleStatus[] = ['Draft', 'Under Review']

export const PRODUCT_CARD_READONLY_STATUSES: ProductCardLifecycleStatus[] = ['Archived']

export function isProductCardTransitionAllowed(
  from: ProductCardLifecycleStatus,
  to: ProductCardLifecycleStatus,
): boolean {
  return PRODUCT_CARD_LIFECYCLE_TRANSITIONS.some((t) => t.from === from && t.to === to)
}

export function findProductCardTransition(
  from: ProductCardLifecycleStatus,
  to: ProductCardLifecycleStatus,
): ProductCardLifecycleTransition | undefined {
  return PRODUCT_CARD_LIFECYCLE_TRANSITIONS.find((t) => t.from === from && t.to === to)
}

export function isProductCardEditable(status: ProductCardLifecycleStatus): boolean {
  return PRODUCT_CARD_EDITABLE_STATUSES.includes(status)
}

export function isProductCardReadOnly(status: ProductCardLifecycleStatus): boolean {
  return PRODUCT_CARD_READONLY_STATUSES.includes(status)
}
