import { mapFabricCardList, mapFabricKpis, mapFabricMovements, mapFabricStock } from './fabric-card.mapper'

export const fabricCardApplicationService = {
  getList: mapFabricCardList,
  getKpis: mapFabricKpis,
  getStock: mapFabricStock,
  getMovements: mapFabricMovements,
}
