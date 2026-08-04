import { coerceKeplerRole, type KeplerRole } from './types.ts'

export type Permission =
  | 'platform.users.manage'
  | 'platform.settings'
  | 'dashboard.view'
  | 'orders.read'
  | 'orders.write'
  | 'merchandising.read'
  | 'products.read'
  | 'products.write'
  | 'planning.read'
  | 'planning.write'
  | 'fabric.read'
  | 'accessories.read'
  | 'cutting.read'
  | 'production.read'
  | 'production.write'
  | 'execution.read'
  | 'execution.write'
  | 'warehouse.read'
  | 'warehouse.write'
  | 'shipping.read'
  | 'shipping.write'
  | 'finance.read'
  | 'finance.write'
  | 'style.close'
  | 'cost.read'
  | 'reports.read'
  | 'ai.read'
  | 'quality.read'
  | 'quality.write'
  | 'inventory.write'
  | 'purchasing.write'

const ROLE_PERMISSIONS: Record<KeplerRole, readonly Permission[]> = {
  ADMIN: [
    'platform.users.manage',
    'platform.settings',
    'dashboard.view',
    'orders.read',
    'orders.write',
    'merchandising.read',
    'products.read',
    'products.write',
    'planning.read',
    'planning.write',
    'fabric.read',
    'accessories.read',
    'cutting.read',
    'production.read',
    'production.write',
    'execution.read',
    'execution.write',
    'warehouse.read',
    'warehouse.write',
    'shipping.read',
    'shipping.write',
    'finance.read',
    'finance.write',
    'style.close',
    'cost.read',
    'reports.read',
    'ai.read',
    'quality.read',
    'quality.write',
    'inventory.write',
    'purchasing.write',
  ],
  MANAGER: [
    'platform.settings',
    'dashboard.view',
    'orders.read',
    'orders.write',
    'merchandising.read',
    'products.read',
    'products.write',
    'planning.read',
    'planning.write',
    'fabric.read',
    'accessories.read',
    'cutting.read',
    'production.read',
    'production.write',
    'execution.read',
    'execution.write',
    'warehouse.read',
    'warehouse.write',
    'shipping.read',
    'shipping.write',
    'finance.read',
    'finance.write',
    'style.close',
    'cost.read',
    'reports.read',
    'ai.read',
    'quality.read',
    'quality.write',
    'inventory.write',
    'purchasing.write',
  ],
  PLANNER: [
    'dashboard.view',
    'orders.read',
    'orders.write',
    'merchandising.read',
    'products.read',
    'planning.read',
    'planning.write',
    'fabric.read',
    'accessories.read',
    'cutting.read',
    'production.read',
    'production.write',
    'warehouse.read',
    'warehouse.write',
    'shipping.read',
    'shipping.write',
    'reports.read',
    'ai.read',
    'inventory.write',
    'purchasing.write',
  ],
  SHOP_FLOOR_OPERATOR: [
    'dashboard.view',
    'execution.read',
    'execution.write',
    'production.read',
    'quality.read',
    'quality.write',
  ],
  VIEWER: ['dashboard.view', 'reports.read'],
}

const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: '/master-data', permission: 'platform.settings' },
  { prefix: '/settings/users', permission: 'platform.users.manage' },
  { prefix: '/settings', permission: 'platform.settings' },
  { prefix: '/orders', permission: 'orders.read' },
  { prefix: '/merchandising', permission: 'merchandising.read' },
  { prefix: '/purchasing', permission: 'orders.read' },
  { prefix: '/products', permission: 'products.read' },
  { prefix: '/planning', permission: 'planning.read' },
  { prefix: '/fabric', permission: 'fabric.read' },
  { prefix: '/accessories', permission: 'accessories.read' },
  { prefix: '/cutting', permission: 'cutting.read' },
  { prefix: '/production-planning', permission: 'production.read' },
  { prefix: '/production-order-lifecycle', permission: 'production.read' },
  { prefix: '/production/', permission: 'production.read' },
  { prefix: '/execution-platform', permission: 'execution.read' },
  { prefix: '/shop-floor', permission: 'execution.read' },
  { prefix: '/barcode-mobile', permission: 'execution.write' },
  { prefix: '/quality-management', permission: 'quality.read' },
  { prefix: '/quality', permission: 'quality.read' },
  { prefix: '/packaging', permission: 'warehouse.read' },
  { prefix: '/warehouse', permission: 'warehouse.read' },
  { prefix: '/export-logistics', permission: 'shipping.read' },
  { prefix: '/commercial-documents', permission: 'shipping.read' },
  { prefix: '/shipping', permission: 'shipping.read' },
  { prefix: '/finance-integration', permission: 'finance.read' },
  { prefix: '/cost-closing', permission: 'finance.read' },
  { prefix: '/style-closing', permission: 'products.read' },
  { prefix: '/cost', permission: 'cost.read' },
  { prefix: '/enterprise', permission: 'platform.settings' },
  { prefix: '/reports', permission: 'reports.read' },
  { prefix: '/ai', permission: 'ai.read' },
  { prefix: '/dev', permission: 'platform.users.manage' },
]

function permissionsForRole(role: KeplerRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.VIEWER
}

export function roleHasPermission(role: KeplerRole, permission: Permission): boolean {
  return permissionsForRole(coerceKeplerRole(role)).includes(permission)
}

export function canAccessRoute(role: KeplerRole, pathname: string): boolean {
  const normalized = coerceKeplerRole(role)

  if (pathname === '/dashboard' || pathname === '/') {
    return roleHasPermission(normalized, 'dashboard.view')
  }

  const rule = ROUTE_PERMISSIONS.find((entry) => pathname.startsWith(entry.prefix))
  if (!rule) {
    return normalized === 'ADMIN'
  }
  return roleHasPermission(normalized, rule.permission)
}

export function canManageUsers(role: KeplerRole): boolean {
  return roleHasPermission(role, 'platform.users.manage')
}

export function filterNavHref(role: KeplerRole, href: string): boolean {
  return canAccessRoute(role, href)
}
