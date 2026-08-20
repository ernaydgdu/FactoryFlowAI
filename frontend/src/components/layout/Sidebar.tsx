import { ChevronRight } from 'lucide-react'
import { type ComponentType, type ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  appConfig,
  dashboardNavItem,
  footerNavItems,
  navGroups,
  type NavGroup,
} from '@/config/navigation'
import { filterNavHref } from '@/domain/platform/iam/permission-policy'
import type { KeplerRole } from '@/domain/platform/iam/types'
import { cn } from '@/lib/utils'

// Bir href'in "bölüm kökü" — /orders, /orders/new, /orders/123/edit hepsi
// aynı gruba ait sayılsın diye ilk path segmentine indirgenir.
function sectionRoot(href: string): string {
  const segment = href.split('/').filter(Boolean)[0]
  return segment ? `/${segment}` : '/'
}

function isGroupActive(group: NavGroup, pathname: string): boolean {
  const currentRoot = sectionRoot(pathname)
  return group.items.some((item) => sectionRoot(item.href) === currentRoot)
}

export function Sidebar() {
  const { user } = useAuth()
  const role = (user?.role ?? 'VIEWER') as KeplerRole
  const location = useLocation()

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => filterNavHref(role, item.href)),
    }))
    .filter((group) => group.items.length > 0)

  const visibleFooter = footerNavItems.filter((item) => filterNavHref(role, item.href))

  // Başlangıçta sadece o an içinde bulunulan sayfanın grubu açık gelir.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = visibleGroups.find((g) => isGroupActive(g, location.pathname))
    return new Set(active ? [active.title] : [])
  })

  // Sayfa değiştikçe (ör. dashboard'daki bir karttan doğrudan bir siparişe
  // gidilince) ilgili grup görünür kalsın diye açık kümeye eklenir — daha
  // önce kullanıcının manuel açtığı diğer gruplar kapanmaz.
  useEffect(() => {
    const active = visibleGroups.find((g) => isGroupActive(g, location.pathname))
    if (!active) return
    setOpenGroups((prev) => (prev.has(active.title) ? prev : new Set(prev).add(active.title)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  function toggleGroup(title: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground print:hidden">
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

        {visibleGroups.map((group) => {
          const isOpen = openGroups.has(group.title)
          return (
            <div key={group.title} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-sidebar-accent/40"
              >
                <group.icon className="size-3.5 shrink-0 text-sidebar-brand/80" />
                <p className="flex-1 text-xs font-medium tracking-wider text-sidebar-foreground/50 uppercase">
                  {group.title}
                </p>
                <ChevronRight
                  className={cn(
                    'size-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200',
                    isOpen && 'rotate-90',
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-in-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
                aria-hidden={!isOpen}
                inert={!isOpen}
              >
                <div className="space-y-1 overflow-hidden">
                  {group.items.map((item) => (
                    <SidebarSubLink key={item.href} href={item.href}>
                      {item.title}
                    </SidebarSubLink>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
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
          'flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'border-sidebar-brand bg-sidebar-accent text-white'
            : 'border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white',
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
          'block rounded-md border-l-2 py-2 pr-3 pl-9 text-sm transition-colors',
          isActive
            ? 'border-sidebar-brand bg-sidebar-accent font-medium text-white'
            : 'border-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white',
        )
      }
    >
      {children}
    </NavLink>
  )
}
