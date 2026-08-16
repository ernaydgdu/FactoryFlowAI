import type { ComponentType, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  appConfig,
  dashboardNavItem,
  footerNavItems,
  navGroups,
} from '@/config/navigation'
import { filterNavHref } from '@/domain/platform/iam/permission-policy'
import type { KeplerRole } from '@/domain/platform/iam/types'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { user } = useAuth()
  const role = (user?.role ?? 'VIEWER') as KeplerRole

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => filterNavHref(role, item.href)),
    }))
    .filter((group) => group.items.length > 0)

  const visibleFooter = footerNavItems.filter((item) => filterNavHref(role, item.href))

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex size-9 items-center justify-center">
          <img src="/kepler-mountain-logo.svg" alt="Kepler ERP" className="size-9" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-wide text-white">
            {appConfig.name}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            {appConfig.product}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {filterNavHref(role, dashboardNavItem.href) ? (
          <SidebarLink href={dashboardNavItem.href} icon={dashboardNavItem.icon}>
            {dashboardNavItem.title}
          </SidebarLink>
        ) : null}

        {visibleGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <group.icon className="size-3.5 shrink-0 text-sidebar-foreground/50" />
              <p className="text-xs font-medium tracking-wider text-sidebar-foreground/50 uppercase">
                {group.title}
              </p>
            </div>
            {group.items.map((item) => (
              <SidebarSubLink key={item.href} href={item.href}>
                {item.title}
              </SidebarSubLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        {visibleFooter.map((item) => (
          <SidebarLink key={item.href} href={item.href} icon={item.icon}>
            {item.title}
          </SidebarLink>
        ))}
      </div>
    </aside>
  )
}

type SidebarLinkProps = {
  href: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}

function SidebarLink({ href, icon: Icon, children }: SidebarLinkProps) {
  return (
    <NavLink
      to={href}
      end={href === '/dashboard'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-white'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white',
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      <span>{children}</span>
    </NavLink>
  )
}

function SidebarSubLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <NavLink
      to={href}
      end
      className={({ isActive }) =>
        cn(
          'block rounded-md py-2 pr-3 pl-9 text-sm transition-colors',
          isActive
            ? 'bg-sidebar-accent font-medium text-white'
            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white',
        )
      }
    >
      {children}
    </NavLink>
  )
}
