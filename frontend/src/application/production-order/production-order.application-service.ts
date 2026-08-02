import {
  mapProductionKpis,
  mapProductionLines,
  mapProductionOperations,
  mapProductionOrderList,
} from './production-order.mapper'

export const productionOrderApplicationService = {
  getList: mapProductionOrderList,
  getLines: mapProductionLines,
  getOperations: mapProductionOperations,
  getKpis: mapProductionKpis,
}
