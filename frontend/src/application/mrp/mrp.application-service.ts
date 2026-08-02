import { mapMrpKpis, mapMrpList } from './mrp.mapper'

export const mrpApplicationService = {
  getList: mapMrpList,
  getKpis: mapMrpKpis,
}
