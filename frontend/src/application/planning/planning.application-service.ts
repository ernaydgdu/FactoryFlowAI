import { mapPlanningKpis, mapSizeSetList } from './planning.mapper'

export const planningApplicationService = {
  getSizeSetList: mapSizeSetList,
  getKpis: mapPlanningKpis,
}
