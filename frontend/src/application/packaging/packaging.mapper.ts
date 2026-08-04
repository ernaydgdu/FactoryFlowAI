import { queryAllPackingLists, queryPackagingDashboard } from '@/domain/packaging/packing-list-query.service'
import type { PackagingDashboardDto } from './packaging.dto'

export function mapPackagingDashboard(): PackagingDashboardDto {
  const d = queryPackagingDashboard()
  return {
    kpis: [
      { label: 'Packing Lists', value: String(d.totalLists) },
      { label: 'Draft', value: String(d.draft) },
      { label: 'Pending Approval', value: String(d.pendingApproval) },
      { label: 'Confirmed', value: String(d.confirmed) },
      { label: 'Shipped', value: String(d.shipped) },
      { label: 'Packages', value: String(d.totalPackages) },
      { label: 'CBM', value: String(d.totalCbm) },
    ],
    lists: queryAllPackingLists(),
  }
}
