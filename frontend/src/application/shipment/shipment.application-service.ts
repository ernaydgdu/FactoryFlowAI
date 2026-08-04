import { mapShipmentDashboard } from './shipment.mapper'
import {
  executeAddLoad,
  executeCreateShipment,
  executePostInventory,
  executeTransition,
  executeUpdateLogistics,
  queryShipment,
  queryShipments,
} from './shipment-command.mapper'

export const shipmentApplicationService = {
  query: {
    dashboard: mapShipmentDashboard,
    lists: queryShipments,
    detail: queryShipment,
  },
  command: {
    create: executeCreateShipment,
    updateLogistics: executeUpdateLogistics,
    addLoad: executeAddLoad,
    transition: executeTransition,
    postInventory: executePostInventory,
  },
}
