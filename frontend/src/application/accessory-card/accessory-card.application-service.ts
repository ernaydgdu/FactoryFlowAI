import { mapAccessoryCardList, mapAccessoryKpis, mapAccessoryStock } from './accessory-card.mapper'

export const accessoryCardApplicationService = {
  getList: mapAccessoryCardList,
  getKpis: mapAccessoryKpis,
  getStock: mapAccessoryStock,
}
