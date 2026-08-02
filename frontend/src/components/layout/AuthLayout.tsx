import { Outlet } from 'react-router-dom'

type AuthLayoutProps = {
  children?: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 px-4 py-10">
      <div className="w-full max-w-md">{children ?? <Outlet />}</div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} KEPLER ERP — Enterprise Production Management
      </p>
    </div>
  )
}
