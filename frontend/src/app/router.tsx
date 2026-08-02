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
const ProductListPage = lazyPage(() => import('@/pages/catalog/ProductPages'), 'ProductListPage')
const ProductDetailRoute = lazyPage(() => import('@/pages/catalog/ProductDetailRoute'), 'ProductDetailRoute')
const BomDesignerPage = lazyPage(() => import('@/modules/bom-designer/pages/BomDesignerPage'), 'BomDesignerPage')
const MrpPage = lazyPage(() => import('@/pages/planning/PlanningPages'), 'MrpPage')
const SizeSetsPage = lazyPage(() => import('@/pages/planning/PlanningPages'), 'SizeSetsPage')
const FabricCardsPage = lazyPage(() => import('@/pages/fabric/FabricPages'), 'FabricCardsPage')
const FabricStockPage = lazyPage(() => import('@/pages/fabric/FabricPages'), 'FabricStockPage')
const FabricMovementsPage = lazyPage(() => import('@/pages/fabric/FabricPages'), 'FabricMovementsPage')
const FabricReceiptPage = lazyPage(() => import('@/pages/fabric/FabricReceiptPage'), 'FabricReceiptPage')
const AccessoryCardsPage = lazyPage(() => import('@/pages/accessories/AccessoryPages'), 'AccessoryCardsPage')
const AccessoryStockPage = lazyPage(() => import('@/pages/accessories/AccessoryPages'), 'AccessoryStockPage')
const CuttingWorkflowPage = lazyPage(() => import('@/pages/cutting/CuttingPages'), 'CuttingWorkflowPage')
const ProductionOrdersPage = lazyPage(() => import('@/pages/production/ProductionPages'), 'ProductionOrdersPage')
const ProductionLinesPage = lazyPage(() => import('@/pages/production/ProductionPages'), 'ProductionLinesPage')
const ProductionOperationsPage = lazyPage(() => import('@/pages/production/ProductionPages'), 'ProductionOperationsPage')
const SewingTrackingPage = lazyPage(() => import('@/pages/production/SewingWashingPages'), 'SewingTrackingPage')
const WashingTrackingPage = lazyPage(() => import('@/pages/production/SewingWashingPages'), 'WashingTrackingPage')
const QualityHubPage = lazyPage(() => import('@/pages/quality/QualityPages'), 'QualityHubPage')
const InlineQualityPage = lazyPage(() => import('@/pages/quality/QualityPages'), 'InlineQualityPage')
const MidlineQualityPage = lazyPage(() => import('@/pages/quality/QualityPages'), 'MidlineQualityPage')
const FinalQualityPage = lazyPage(() => import('@/pages/quality/QualityPages'), 'FinalQualityPage')
const PackagingPage = lazyPage(() => import('@/pages/packaging/PackagingPages'), 'PackagingPage')
const WarehouseInboundPage = lazyPage(() => import('@/pages/warehouse/WarehousePages'), 'WarehouseInboundPage')
const WarehouseOutboundPage = lazyPage(() => import('@/pages/warehouse/WarehousePages'), 'WarehouseOutboundPage')
const WarehouseCountPage = lazyPage(() => import('@/pages/warehouse/WarehousePages'), 'WarehouseCountPage')
const MerchandisingListPage = lazyPage(() => import('@/pages/merchandising/MerchandisingPages'), 'MerchandisingListPage')
const MerchandisingDetailRoute = lazyPage(() => import('@/pages/merchandising/MerchandisingPages'), 'MerchandisingDetailRoute')
const PurchasingPage = lazyPage(() => import('@/pages/purchasing/PurchasingPages'), 'PurchasingPage')
const PurchaseOrderDetailRoute = lazyPage(() => import('@/pages/purchasing/PurchasingPages'), 'PurchaseOrderDetailRoute')
const ShippingPage = lazyPage(() => import('@/pages/misc/MiscPages'), 'ShippingPage')
const ContainerPlanningPage = lazyPage(() => import('@/pages/shipping/ContainerPages'), 'ContainerPlanningPage')
const CostAnalysisPage = lazyPage(() => import('@/pages/misc/MiscPages'), 'CostAnalysisPage')
const ReportsPage = lazyPage(() => import('@/pages/misc/MiscPages'), 'ReportsPage')
const KeplerAiPage = lazyPage(() => import('@/pages/misc/MiscPages'), 'KeplerAiPage')
const SettingsPage = lazyPage(() => import('@/pages/misc/MiscPages'), 'SettingsPage')

const ProductionPlanningLayout = lazyPage(
  () => import('@/modules/production-planning/layout/ProductionPlanningLayout'),
  'ProductionPlanningLayout',
)
const ProductionPlanningDashboardPage = lazyPage(
  () => import('@/modules/production-planning/pages/ProductionDashboardPage'),
  'ProductionDashboardPage',
)
const ProductionCalendarPage = lazyPage(
  () => import('@/modules/production-planning/pages/ProductionCalendarPage'),
  'ProductionCalendarPage',
)
const ProductionPlanningOrdersPage = lazyPage(
  () => import('@/modules/production-planning/pages/ProductionPlanningOrdersPage'),
  'ProductionPlanningOrdersPage',
)
const ProductionSchedulePage = lazyPage(
  () => import('@/modules/production-planning/pages/ProductionSchedulePage'),
  'ProductionSchedulePage',
)
const CapacityPlanningPage = lazyPage(
  () => import('@/modules/production-planning/pages/CapacityPlanningPage'),
  'CapacityPlanningPage',
)
const WorkshopPlanningPage = lazyPage(
  () => import('@/modules/production-planning/pages/WorkshopPlanningPage'),
  'WorkshopPlanningPage',
)
const LinePlanningPage = lazyPage(
  () => import('@/modules/production-planning/pages/LinePlanningPage'),
  'LinePlanningPage',
)
const DailyProductionEntryPage = lazyPage(
  () => import('@/modules/production-planning/pages/DailyProductionEntryPage'),
  'DailyProductionEntryPage',
)
const OperationTrackingPage = lazyPage(
  () => import('@/modules/production-planning/pages/OperationTrackingPage'),
  'OperationTrackingPage',
)
const ProductionTimelinePage = lazyPage(
  () => import('@/modules/production-planning/pages/ProductionTimelinePage'),
  'ProductionTimelinePage',
)

const ProductionOrderLifecycleLayout = lazyPage(
  () => import('@/modules/production-order-lifecycle/layout/ProductionOrderLifecycleLayout'),
  'ProductionOrderLifecycleLayout',
)
const ProductionOrderLifecycleListPage = lazyPage(
  () => import('@/modules/production-order-lifecycle/pages/ProductionOrderLifecycleListPage'),
  'ProductionOrderLifecycleListPage',
)
const ProductionOrderLifecycleDetailPage = lazyPage(
  () => import('@/modules/production-order-lifecycle/pages/ProductionOrderLifecycleDetailPage'),
  'ProductionOrderLifecycleDetailPage',
)
const ProductionOrderLifecycleDailyEntryPage = lazyPage(
  () => import('@/modules/production-order-lifecycle/pages/ProductionOrderLifecycleDailyEntryPage'),
  'ProductionOrderLifecycleDailyEntryPage',
)
const CreateProductionOrderFromSalesPage = lazyPage(
  () => import('@/modules/production-order-lifecycle/pages/CreateProductionOrderFromSalesPage'),
  'CreateProductionOrderFromSalesPage',
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

        <Route path="/merchandising" element={<L><MerchandisingListPage /></L>} />
        <Route path="/merchandising/:orderId" element={<L><MerchandisingDetailRoute /></L>} />

        <Route path="/purchasing" element={<L><PurchasingPage /></L>} />
        <Route path="/purchasing/orders" element={<L><PurchasingPage /></L>} />
        <Route path="/purchasing/orders/:poId" element={<L><PurchaseOrderDetailRoute /></L>} />

        <Route path="/products" element={<L><ProductListPage /></L>} />
        <Route path="/products/:id" element={<L><ProductDetailRoute /></L>} />
        <Route path="/products/:productId/bom" element={<L><BomDesignerPage /></L>} />
        <Route path="/planning/mrp" element={<L><MrpPage /></L>} />
        <Route path="/planning/size-sets" element={<L><SizeSetsPage /></L>} />

        <Route path="/fabric/cards" element={<L><FabricCardsPage /></L>} />
        <Route path="/fabric/stock" element={<L><FabricStockPage /></L>} />
        <Route path="/fabric/receipt" element={<L><FabricReceiptPage /></L>} />
        <Route path="/fabric/movements" element={<L><FabricMovementsPage /></L>} />

        <Route path="/accessories/cards" element={<L><AccessoryCardsPage /></L>} />
        <Route path="/accessories/stock" element={<L><AccessoryStockPage /></L>} />

        <Route path="/cutting" element={<L><CuttingWorkflowPage /></L>} />
        <Route path="/production/orders" element={<L><ProductionOrdersPage /></L>} />
        <Route path="/production/lines" element={<L><ProductionLinesPage /></L>} />
        <Route path="/production/operations" element={<L><ProductionOperationsPage /></L>} />
        <Route path="/production/sewing" element={<L><SewingTrackingPage /></L>} />
        <Route path="/production/washing" element={<L><WashingTrackingPage /></L>} />

        <Route path="/production-planning" element={<L><ProductionPlanningLayout /></L>}>
          <Route index element={<Navigate to="/production-planning/dashboard" replace />} />
          <Route path="dashboard" element={<L><ProductionPlanningDashboardPage /></L>} />
          <Route path="calendar" element={<L><ProductionCalendarPage /></L>} />
          <Route path="orders" element={<L><ProductionPlanningOrdersPage /></L>} />
          <Route path="schedule" element={<L><ProductionSchedulePage /></L>} />
          <Route path="capacity" element={<L><CapacityPlanningPage /></L>} />
          <Route path="workshops" element={<L><WorkshopPlanningPage /></L>} />
          <Route path="lines" element={<L><LinePlanningPage /></L>} />
          <Route path="daily-entry" element={<L><DailyProductionEntryPage /></L>} />
          <Route path="operations" element={<L><OperationTrackingPage /></L>} />
          <Route path="timeline" element={<L><ProductionTimelinePage /></L>} />
        </Route>

        <Route path="/production-order-lifecycle" element={<L><ProductionOrderLifecycleLayout /></L>}>
          <Route index element={<Navigate to="/production-order-lifecycle/orders" replace />} />
          <Route path="orders" element={<L><ProductionOrderLifecycleListPage /></L>} />
          <Route path="orders/:productionOrderNo" element={<L><ProductionOrderLifecycleDetailPage /></L>} />
          <Route path="create" element={<L><CreateProductionOrderFromSalesPage /></L>} />
          <Route path="daily-entry" element={<L><ProductionOrderLifecycleDailyEntryPage /></L>} />
        </Route>

        <Route path="/quality" element={<L><QualityHubPage /></L>} />
        <Route path="/quality/inline" element={<L><InlineQualityPage /></L>} />
        <Route path="/quality/midline" element={<L><MidlineQualityPage /></L>} />
        <Route path="/quality/final" element={<L><FinalQualityPage /></L>} />

        <Route path="/packaging" element={<L><PackagingPage /></L>} />

        <Route path="/warehouse/inbound" element={<L><WarehouseInboundPage /></L>} />
        <Route path="/warehouse/outbound" element={<L><WarehouseOutboundPage /></L>} />
        <Route path="/warehouse/count" element={<L><WarehouseCountPage /></L>} />

        <Route path="/shipping" element={<L><ShippingPage /></L>} />
        <Route path="/shipping/containers" element={<L><ContainerPlanningPage /></L>} />
        <Route path="/cost" element={<L><CostAnalysisPage /></L>} />
        <Route path="/reports" element={<L><ReportsPage /></L>} />
        <Route path="/ai" element={<L><KeplerAiPage /></L>} />
        <Route path="/settings" element={<L><SettingsPage /></L>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
