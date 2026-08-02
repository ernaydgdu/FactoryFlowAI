import { SALES_ORDERS } from '@/domain/data/orders'
import { getProductById } from '@/domain/data/products'

import type { SalesOrderKpisDto, SalesOrderListItemDto } from './sales-order.dto'
import { salesOrderStatusBadge } from './sales-order.dto'

export function mapSalesOrderList(): SalesOrderListItemDto[] {
  return SALES_ORDERS.map((o) => {
    const product = getProductById(o.productCardId)
    const terminRisk = new Date(o.exfDate) < new Date(Date.now() + 7 * 86400000)
    return {
      id: o.id,
      orderNo: o.orderNo,
      customer: product?.customer ?? '—',
      brand: product?.brand ?? '—',
      productCode: product?.productCode ?? '—',
      productName: product?.productName ?? '—',
      orderQty: o.matrixTotals.grandTotal,
      exfDate: o.exfDate,
      productionStatus: salesOrderStatusBadge(o.productionStatus),
      terminRisk,
      progress: o.progress,
    }
  })
}

export function mapSalesOrderKpis(): SalesOrderKpisDto {
  const orders = SALES_ORDERS
  return {
    items: [
      { label: 'Toplam Sipariş', value: String(orders.length), hint: 'Aktif portföy' },
      { label: 'Üretimde', value: String(orders.filter((o) => o.productionStatus === 'Üretimde').length), hint: 'Devam eden' },
      { label: 'Termin Riski', value: String(orders.filter((o) => new Date(o.exfDate) < new Date(Date.now() + 7 * 86400000)).length), hint: '7 gün içinde' },
      { label: 'Tamamlanan', value: String(orders.filter((o) => o.productionStatus === 'Tamamlandı' || o.productionStatus === 'Sevk Edildi').length), hint: 'Sevk/Tamam' },
    ],
  }
}
