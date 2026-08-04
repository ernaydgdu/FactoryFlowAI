import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RequireRole } from '@/components/auth/RequireRole'
import { LazyRoute, lazyPage } from '@/performance/lazy-route'

const LoginPage = lazyPage(() => import('@/pages/LoginPage'), 'LoginPage')
const DashboardPage = lazyPage(() => import('@/pages/DashboardPage'), 'DashboardPage')
const OrderListPage = lazyPage(() => import('@/pages/orders/OrderListPage'), 'OrderListPage')
const OrderCreatePage = lazyPage(() => import('@/pages/orders/OrderCreatePage'), 'OrderCreatePage')
const OrderEditPage = lazyPage(() => import('@/pages/orders/OrderEditPage'), 'OrderEditPage')
const OrderDetailPage = lazyPage(() => import('@/modules/orders/pages/OrderDetailPage'), 'OrderDetailPage')
const ProductListPage = lazyPage(() => import('@/pages/catalog/ProductPages'), 'ProductListPage')
const ProductCreatePage = lazyPage(() => import('@/pages/catalog/ProductPages'), 'ProductCreatePage')
const ProductEditRoute = lazyPage(() => import('@/pages/catalog/ProductEditRoute'), 'ProductEditRoute')
const ProductDetailRoute = lazyPage(() => import('@/pages/catalog/ProductDetailRoute'), 'ProductDetailRoute')
const BomDesignerPage = lazyPage(() => import('@/modules/bom-designer/pages/BomDesignerPage'), 'BomDesignerPage')
const CostSheetDesignerPage = lazyPage(
  () => import('@/modules/cost-sheet-designer/pages/CostSheetDesignerPage'),
  'CostSheetDesignerPage',
)
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
const WarehouseDetailPage = lazyPage(
  () => import('@/pages/warehouse-management/WarehouseManagementPages'),
  'WarehouseDetailPage',
)
const FinishedGoodsReceiptPage = lazyPage(
  () => import('@/pages/warehouse-management/WarehouseManagementPages'),
  'FinishedGoodsReceiptPage',
)
const WarehouseInboundPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'GoodsReceiptPage')
const WarehouseOutboundPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'GoodsIssuePage')
const WarehouseCountPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'CycleCountPage')
const InventoryHubPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'InventoryHubPage')
const InventoryDashboardPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'InventoryDashboardPage')
const StockInquiryPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'StockInquiryPage')
const StockLedgerPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'StockLedgerPage')
const WarehouseDashboardPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'WarehouseDashboardPage')
const TransferPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'TransferPage')
const ReservationPage = lazyPage(() => import('@/pages/inventory/InventoryPages'), 'ReservationPage')
const MerchandisingListPage = lazyPage(() => import('@/pages/merchandising/MerchandisingPages'), 'MerchandisingListPage')
const MerchandisingDetailRoute = lazyPage(() => import('@/pages/merchandising/MerchandisingPages'), 'MerchandisingDetailRoute')
const PurchasingPage = lazyPage(() => import('@/pages/purchasing/PurchasingPages'), 'PurchasingPage')
const PurchaseOrderDetailRoute = lazyPage(() => import('@/pages/purchasing/PurchasingPages'), 'PurchaseOrderDetailRoute')
const CostAnalysisPage = lazyPage(() => import('@/pages/misc/MiscPages'), 'CostAnalysisPage')
const ReportsPage = lazyPage(() => import('@/pages/misc/MiscPages'), 'ReportsPage')
const KeplerAiPage = lazyPage(() => import('@/pages/misc/MiscPages'), 'KeplerAiPage')
const SettingsPage = lazyPage(() => import('@/pages/misc/MiscPages'), 'SettingsPage')
const UserManagementPage = lazyPage(
  () => import('@/modules/platform/pages/UserManagementPage'),
  'UserManagementPage',
)
const MasterDataHubPage = lazyPage(
  () => import('@/modules/master-data/pages/MasterDataHubPage'),
  'MasterDataHubPage',
)
const MasterDataRoutePage = lazyPage(
  () => import('@/modules/master-data/pages/MasterDataRoutePage'),
  'MasterDataRoutePage',
)

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
const PlanningBoardPage = lazyPage(
  () => import('@/modules/production-planning/pages/PlanningSchedulingPages'),
  'PlanningBoardPage',
)
const CapacityViewPage = lazyPage(
  () => import('@/modules/production-planning/pages/PlanningSchedulingPages'),
  'CapacityViewPage',
)
const LineLoadPage = lazyPage(
  () => import('@/modules/production-planning/pages/PlanningSchedulingPages'),
  'LineLoadPage',
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
const ProductionOrderStatusBoardPage = lazyPage(
  () => import('@/modules/production-order-lifecycle/pages/ProductionOrderBoardPages'),
  'ProductionOrderStatusBoardPage',
)
const ProductionOrderOperationListPage = lazyPage(
  () => import('@/modules/production-order-lifecycle/pages/ProductionOrderBoardPages'),
  'ProductionOrderOperationListPage',
)
const ProductionOrderReservationPage = lazyPage(
  () => import('@/modules/production-order-lifecycle/pages/ProductionOrderBoardPages'),
  'ProductionOrderReservationPage',
)
const CreateProductionOrderFromSalesPage = lazyPage(
  () => import('@/modules/production-order-lifecycle/pages/CreateProductionOrderFromSalesPage'),
  'CreateProductionOrderFromSalesPage',
)
const ExecutionDemoDevPage = lazyPage(
  () => import('@/modules/dev/pages/ExecutionDemoDevPage'),
  'ExecutionDemoDevPage',
)

const ShopFloorLayout = lazyPage(
  () => import('@/modules/shop-floor/layout/ShopFloorLayout'),
  'ShopFloorLayout',
)
const ShopFloorOperatorPage = lazyPage(
  () => import('@/modules/shop-floor/pages/ShopFloorPages'),
  'ShopFloorOperatorPage',
)
const ShopFloorWorkstationPage = lazyPage(
  () => import('@/modules/shop-floor/pages/ShopFloorPages'),
  'ShopFloorWorkstationPage',
)
const ShopFloorOperationPage = lazyPage(
  () => import('@/modules/shop-floor/pages/ShopFloorPages'),
  'ShopFloorOperationPage',
)
const ShopFloorBundlePage = lazyPage(
  () => import('@/modules/shop-floor/pages/ShopFloorPages'),
  'ShopFloorBundlePage',
)
const ShopFloorDeclarationPage = lazyPage(
  () => import('@/modules/shop-floor/pages/ShopFloorPages'),
  'ShopFloorDeclarationPage',
)
const ShopFloorMachineStatusPage = lazyPage(
  () => import('@/modules/shop-floor/pages/ShopFloorPages'),
  'ShopFloorMachineStatusPage',
)
const ShopFloorLaborPage = lazyPage(
  () => import('@/modules/shop-floor/pages/ShopFloorPages'),
  'ShopFloorLaborPage',
)
const ShopFloorTimelinePage = lazyPage(
  () => import('@/modules/shop-floor/pages/ShopFloorPages'),
  'ShopFloorTimelinePage',
)

const QualityManagementLayout = lazyPage(
  () => import('@/modules/quality-management/layout/QualityManagementLayout'),
  'QualityManagementLayout',
)
const QualityDashboardPage = lazyPage(
  () => import('@/modules/quality-management/pages/QualityManagementPages'),
  'QualityDashboardPage',
)
const QualityInspectionPage = lazyPage(
  () => import('@/modules/quality-management/pages/QualityManagementPages'),
  'QualityInspectionPage',
)
const QualityReworkQueuePage = lazyPage(
  () => import('@/modules/quality-management/pages/QualityManagementPages'),
  'QualityReworkQueuePage',
)
const QualityHoldQueuePage = lazyPage(
  () => import('@/modules/quality-management/pages/QualityManagementPages'),
  'QualityHoldQueuePage',
)
const QualityNcrDetailPage = lazyPage(
  () => import('@/modules/quality-management/pages/QualityManagementPages'),
  'QualityNcrDetailPage',
)
const QualityTimelinePage = lazyPage(
  () => import('@/modules/quality-management/pages/QualityManagementPages'),
  'QualityTimelinePage',
)

const PackagingLayout = lazyPage(
  () => import('@/modules/packaging/layout/PackagingLayout'),
  'PackagingLayout',
)
const PackagingDashboardPage = lazyPage(
  () => import('@/modules/packaging/pages/PackagingPages'),
  'PackagingDashboardPage',
)
const PackingListPage = lazyPage(
  () => import('@/modules/packaging/pages/PackagingPages'),
  'PackingListPage',
)
const PackingListDetailPage = lazyPage(
  () => import('@/modules/packaging/pages/PackagingPages'),
  'PackingListDetailPage',
)
const PackingStationPage = lazyPage(
  () => import('@/modules/packaging/pages/PackagingPages'),
  'PackingStationPage',
)

const ShippingLayout = lazyPage(
  () => import('@/modules/shipping/layout/ShippingLayout'),
  'ShippingLayout',
)
const ShipmentDashboardPage = lazyPage(
  () => import('@/modules/shipping/pages/ShippingPages'),
  'ShipmentDashboardPage',
)
const ShipmentListPage = lazyPage(
  () => import('@/modules/shipping/pages/ShippingPages'),
  'ShipmentListPage',
)
const ShipmentDetailPage = lazyPage(
  () => import('@/modules/shipping/pages/ShippingPages'),
  'ShipmentDetailPage',
)
const ShipmentStationPage = lazyPage(
  () => import('@/modules/shipping/pages/ShippingPages'),
  'ShipmentStationPage',
)
const ShipmentContainersPage = lazyPage(
  () => import('@/modules/shipping/pages/ShippingPages'),
  'ShipmentContainersPage',
)

const BarcodeMobileLayout = lazyPage(
  () => import('@/modules/barcode-mobile/layout/BarcodeMobileLayout'),
  'BarcodeMobileLayout',
)
const BarcodeDashboardPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'BarcodeDashboardPage',
)
const MobileOperatorPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'MobileOperatorPage',
)
const ScannerScreenPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'ScannerScreenPage',
)
const BundleScanPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'BundleScanPage',
)
const MaterialScanPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'MaterialScanPage',
)
const FinishedGoodsScanPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'FinishedGoodsScanPage',
)
const QualityScanPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'QualityScanPage',
)
const WarehouseScanPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'WarehouseScanPage',
)
const ReceivingScanPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'ReceivingScanPage',
)
const MaterialIssueScanPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'MaterialIssueScanPage',
)
const ProductionScanWorkflowPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'ProductionScanWorkflowPage',
)
const FgReceiptScanPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'FgReceiptScanPage',
)
const ShipmentScanPage = lazyPage(
  () => import('@/modules/barcode-mobile/pages/BarcodeMobilePages'),
  'ShipmentScanPage',
)

const ExecutionPlatformLayout = lazyPage(
  () => import('@/modules/execution-platform/layout/ExecutionPlatformLayout'),
  'ExecutionPlatformLayout',
)
const ExecutionDashboardPage = lazyPage(
  () => import('@/modules/execution-platform/pages/ExecutionDashboardPage'),
  'ExecutionDashboardPage',
)
const BundleBoardPage = lazyPage(
  () => import('@/modules/execution-platform/pages/BundleBoardPage'),
  'BundleBoardPage',
)
const OperationBoardPage = lazyPage(
  () => import('@/modules/execution-platform/pages/OperationBoardPage'),
  'OperationBoardPage',
)
const WorkSessionMonitorPage = lazyPage(
  () => import('@/modules/execution-platform/pages/WorkSessionMonitorPage'),
  'WorkSessionMonitorPage',
)
const ExecutionDailyEntryPage = lazyPage(
  () => import('@/modules/execution-platform/pages/ExecutionDailyEntryPage'),
  'ExecutionDailyEntryPage',
)
const WipMonitorPage = lazyPage(
  () => import('@/modules/execution-platform/pages/WipMonitorPage'),
  'WipMonitorPage',
)
const QualityGateConsolePage = lazyPage(
  () => import('@/modules/execution-platform/pages/QualityGateConsolePage'),
  'QualityGateConsolePage',
)
const ExecutionTimelinePage = lazyPage(
  () => import('@/modules/execution-platform/pages/ExecutionTimelinePage'),
  'ExecutionTimelinePage',
)
const SplitProductionConsolePage = lazyPage(
  () => import('@/modules/execution-platform/pages/SplitProductionConsolePage'),
  'SplitProductionConsolePage',
)
const ExecutionProductionCalendarPage = lazyPage(
  () => import('@/modules/execution-platform/pages/ExecutionProductionCalendarPage'),
  'ExecutionProductionCalendarPage',
)
const BrainConsolePage = lazyPage(
  () => import('@/modules/execution-platform/pages/BrainConsolePage'),
  'BrainConsolePage',
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
        <Route path="/products/new" element={<L><ProductCreatePage /></L>} />
        <Route path="/products/:id/edit" element={<L><ProductEditRoute /></L>} />
        <Route path="/products/:id" element={<L><ProductDetailRoute /></L>} />
        <Route path="/products/:productId/bom" element={<L><BomDesignerPage /></L>} />
        <Route path="/products/:productId/cost-sheet" element={<L><CostSheetDesignerPage /></L>} />
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
          <Route path="board" element={<L><PlanningBoardPage /></L>} />
          <Route path="capacity-view" element={<L><CapacityViewPage /></L>} />
          <Route path="line-load" element={<L><LineLoadPage /></L>} />
        </Route>

        <Route path="/production-order-lifecycle" element={<L><ProductionOrderLifecycleLayout /></L>}>
          <Route index element={<Navigate to="/production-order-lifecycle/orders" replace />} />
          <Route path="orders" element={<L><ProductionOrderLifecycleListPage /></L>} />
          <Route path="orders/:productionOrderNo" element={<L><ProductionOrderLifecycleDetailPage /></L>} />
          <Route path="board" element={<L><ProductionOrderStatusBoardPage /></L>} />
          <Route path="operations" element={<L><ProductionOrderOperationListPage /></L>} />
          <Route path="reservations" element={<L><ProductionOrderReservationPage /></L>} />
          <Route path="create" element={<L><CreateProductionOrderFromSalesPage /></L>} />
          <Route path="daily-entry" element={<L><ProductionOrderLifecycleDailyEntryPage /></L>} />
        </Route>

        <Route path="/execution-platform" element={<L><ExecutionPlatformLayout /></L>}>
          <Route index element={<Navigate to="/execution-platform/dashboard" replace />} />
          <Route path="dashboard" element={<L><ExecutionDashboardPage /></L>} />
          <Route path="bundles" element={<L><BundleBoardPage /></L>} />
          <Route path="operations" element={<L><OperationBoardPage /></L>} />
          <Route path="work-sessions" element={<L><WorkSessionMonitorPage /></L>} />
          <Route path="daily-entry" element={<L><ExecutionDailyEntryPage /></L>} />
          <Route path="wip" element={<L><WipMonitorPage /></L>} />
          <Route path="quality" element={<L><QualityGateConsolePage /></L>} />
          <Route path="timeline" element={<L><ExecutionTimelinePage /></L>} />
          <Route path="split" element={<L><SplitProductionConsolePage /></L>} />
          <Route path="calendar" element={<L><ExecutionProductionCalendarPage /></L>} />
          <Route path="brain" element={<L><BrainConsolePage /></L>} />
        </Route>

        <Route path="/shop-floor" element={<L><ShopFloorLayout /></L>}>
          <Route index element={<Navigate to="/shop-floor/operator" replace />} />
          <Route path="operator" element={<L><ShopFloorOperatorPage /></L>} />
          <Route path="workstation" element={<L><ShopFloorWorkstationPage /></L>} />
          <Route path="operations" element={<L><ShopFloorOperationPage /></L>} />
          <Route path="bundles" element={<L><ShopFloorBundlePage /></L>} />
          <Route path="declaration" element={<L><ShopFloorDeclarationPage /></L>} />
          <Route path="machines" element={<L><ShopFloorMachineStatusPage /></L>} />
          <Route path="labor" element={<L><ShopFloorLaborPage /></L>} />
          <Route path="timeline" element={<L><ShopFloorTimelinePage /></L>} />
        </Route>

        <Route path="/quality-management" element={<L><QualityManagementLayout /></L>}>
          <Route index element={<Navigate to="/quality-management/dashboard" replace />} />
          <Route path="dashboard" element={<L><QualityDashboardPage /></L>} />
          <Route path="inspection" element={<L><QualityInspectionPage /></L>} />
          <Route path="rework" element={<L><QualityReworkQueuePage /></L>} />
          <Route path="hold" element={<L><QualityHoldQueuePage /></L>} />
          <Route path="timeline" element={<L><QualityTimelinePage /></L>} />
          <Route path="ncr/:ncrId" element={<L><QualityNcrDetailPage /></L>} />
        </Route>

        <Route path="/barcode-mobile" element={<L><BarcodeMobileLayout /></L>}>
          <Route index element={<Navigate to="/barcode-mobile/dashboard" replace />} />
          <Route path="dashboard" element={<L><BarcodeDashboardPage /></L>} />
          <Route path="operator" element={<L><MobileOperatorPage /></L>} />
          <Route path="scanner" element={<L><ScannerScreenPage /></L>} />
          <Route path="receiving" element={<L><ReceivingScanPage /></L>} />
          <Route path="material-issue" element={<L><MaterialIssueScanPage /></L>} />
          <Route path="production" element={<L><ProductionScanWorkflowPage /></L>} />
          <Route path="fg-receipt" element={<L><FgReceiptScanPage /></L>} />
          <Route path="shipment" element={<L><ShipmentScanPage /></L>} />
          <Route path="bundle" element={<L><BundleScanPage /></L>} />
          <Route path="material" element={<L><MaterialScanPage /></L>} />
          <Route path="finished-goods" element={<L><FinishedGoodsScanPage /></L>} />
          <Route path="quality" element={<L><QualityScanPage /></L>} />
          <Route path="warehouse" element={<L><WarehouseScanPage /></L>} />
        </Route>

        <Route path="/quality" element={<L><QualityHubPage /></L>} />
        <Route path="/quality/inline" element={<L><InlineQualityPage /></L>} />
        <Route path="/quality/midline" element={<L><MidlineQualityPage /></L>} />
        <Route path="/quality/final" element={<L><FinalQualityPage /></L>} />

        <Route path="/packaging" element={<L><PackagingLayout /></L>}>
          <Route index element={<Navigate to="/packaging/dashboard" replace />} />
          <Route path="dashboard" element={<L><PackagingDashboardPage /></L>} />
          <Route path="lists" element={<L><PackingListPage /></L>} />
          <Route path="lists/:packingListId" element={<L><PackingListDetailPage /></L>} />
          <Route path="station" element={<L><PackingStationPage /></L>} />
        </Route>

        <Route path="/inventory" element={<L><InventoryHubPage /></L>} />
        <Route path="/inventory/dashboard" element={<L><InventoryDashboardPage /></L>} />
        <Route path="/inventory/stock-inquiry" element={<L><StockInquiryPage /></L>} />
        <Route path="/inventory/ledger" element={<L><StockLedgerPage /></L>} />

        <Route path="/warehouse" element={<L><WarehouseDashboardPage /></L>} />
        <Route path="/warehouse/inbound" element={<L><WarehouseInboundPage /></L>} />
        <Route path="/warehouse/outbound" element={<L><WarehouseOutboundPage /></L>} />
        <Route path="/warehouse/transfer" element={<L><TransferPage /></L>} />
        <Route path="/warehouse/reservation" element={<L><ReservationPage /></L>} />
        <Route path="/warehouse/count" element={<L><WarehouseCountPage /></L>} />
        <Route path="/warehouse/fg-receipt" element={<L><FinishedGoodsReceiptPage /></L>} />
        <Route path="/warehouse/:code" element={<L><WarehouseDetailPage /></L>} />

        <Route path="/shipping" element={<L><ShippingLayout /></L>}>
          <Route index element={<Navigate to="/shipping/dashboard" replace />} />
          <Route path="dashboard" element={<L><ShipmentDashboardPage /></L>} />
          <Route path="shipments" element={<L><ShipmentListPage /></L>} />
          <Route path="shipments/:shipmentId" element={<L><ShipmentDetailPage /></L>} />
          <Route path="containers" element={<L><ShipmentContainersPage /></L>} />
          <Route path="station" element={<L><ShipmentStationPage /></L>} />
        </Route>
        <Route path="/cost" element={<L><CostAnalysisPage /></L>} />
        <Route path="/reports" element={<L><ReportsPage /></L>} />
        <Route path="/ai" element={<L><KeplerAiPage /></L>} />
        <Route path="/settings" element={<L><SettingsPage /></L>} />
        <Route path="/master-data" element={<L><MasterDataHubPage /></L>} />
        <Route path="/master-data/:entityPath" element={<L><MasterDataRoutePage /></L>} />
        <Route
          path="/settings/users"
          element={
            <L>
              <RequireRole permission="users.manage">
                <UserManagementPage />
              </RequireRole>
            </L>
          }
        />
        <Route path="/dev/execution-demo" element={<L><ExecutionDemoDevPage /></L>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
