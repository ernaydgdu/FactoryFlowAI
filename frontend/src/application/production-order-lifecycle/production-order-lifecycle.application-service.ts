import {
  executeAddDailyEntry,
  executeCreateProductionOrder,
  executeTransitionProductionOrder,
  mapAllDailyEntries,
  mapBrainInsight,
  mapDailyEntriesForOrder,
  mapLifecycleDashboard,
  mapProductionOrderLifecycleDetail,
  mapProductionOrderLifecycleList,
  mapSalesOrdersForCreate,
  mapTwinSimulation,
} from './production-order-lifecycle.mapper'

export const productionOrderLifecycleApplicationService = {
  getDashboard: mapLifecycleDashboard,
  getOrders: mapProductionOrderLifecycleList,
  getOrderByNo: mapProductionOrderLifecycleDetail,
  getDailyEntries: mapAllDailyEntries,
  getDailyEntriesForOrder: mapDailyEntriesForOrder,
  getBrainInsight: mapBrainInsight,
  getTwinSimulation: mapTwinSimulation,
  getSalesOrdersForCreate: mapSalesOrdersForCreate,
  createFromSalesOrder: executeCreateProductionOrder,
  transitionStatus: executeTransitionProductionOrder,
  addDailyEntry: executeAddDailyEntry,
}
