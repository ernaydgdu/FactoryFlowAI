import { mapBomDesigner } from './bom-designer.mapper'
import type { BomDesignerViewDto } from './bom-designer.dto'

export const bomDesignerApplicationService = {
  getByProduct(productId: string, orderQty?: number): BomDesignerViewDto | null {
    return mapBomDesigner(productId, orderQty)
  },
}
