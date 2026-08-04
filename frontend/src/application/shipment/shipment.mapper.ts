import { queryAllShipments, queryShipmentDashboard } from '@/domain/shipment/shipment-query.service'
import type { ShipmentDashboardDto } from './shipment.dto'

export function mapShipmentDashboard(): ShipmentDashboardDto {
  const d = queryShipmentDashboard()
  return {
    kpis: [
      { label: 'Shipments', value: String(d.total) },
      { label: 'Draft', value: String(d.draft) },
      { label: 'Booked', value: String(d.booked) },
      { label: 'In Transit', value: String(d.inTransit) },
      { label: 'Delivered', value: String(d.delivered) },
      { label: 'Closed', value: String(d.closed) },
      { label: 'Qty', value: String(d.totalQty) },
      { label: 'CBM', value: String(d.totalCbm) },
    ],
    shipments: queryAllShipments(),
  }
}
