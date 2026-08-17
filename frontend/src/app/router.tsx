import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LazyRoute, lazyPage } from '@/performance/lazy-route'

const LoginPage = lazyPage(() => import('@/pages/LoginPage'), 'LoginPage')
const DashboardPage = lazyPage(() => import('@/pages/DashboardPage'), 'DashboardPage')
const OrderListPage = lazyPage(() => import('@/pages/orders/OrderListPage'), 'OrderListPage')
const OrderCreatePage = lazyPage(() => import('@/pages/orders/OrderCreatePage'), 'OrderCreatePage')
const OrderEditPage = lazyPage(() => import('@/pages/orders/OrderEditPage'), 'OrderEditPage')
const OrderDetailPage = lazyPage(() => import('@/modules/orders/pages/OrderDetailPage'), 'OrderDetailPage')
const StockPage = lazyPage(() => import('@/pages/stock/StockPage'), 'StockPage')
const WarehousesPage = lazyPage(
  () => import('@/pages/warehouses/WarehousesPage'),
  'WarehousesPage',
)
const SupplierPerformancePage = lazyPage(
  () => import('@/pages/suppliers/SupplierPerformancePage'),
  'SupplierPerformancePage',
)
const LineStatusPage = lazyPage(
  () => import('@/pages/line-status/LineStatusPage'),
  'LineStatusPage',
)

function L({ children }: { children: ReactNode }) {
  return <LazyRoute>{children}</LazyRoute>
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<L><LoginPage /></L>} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<L><DashboardPage /></L>} />

        <Route path="/orders" element={<L><OrderListPage /></L>} />
        <Route path="/orders/new" element={<L><OrderCreatePage /></L>} />
        <Route path="/orders/:id" element={<L><OrderDetailPage /></L>} />
        <Route path="/orders/:id/edit" element={<L><OrderEditPage /></L>} />

        <Route path="/stock" element={<L><StockPage /></L>} />
        <Route path="/warehouses" element={<L><WarehousesPage /></L>} />
        <Route path="/suppliers" element={<L><SupplierPerformancePage /></L>} />
        <Route path="/line-status" element={<L><LineStatusPage /></L>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
