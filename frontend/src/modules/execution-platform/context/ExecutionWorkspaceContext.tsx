import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { useExecutionContextList } from '@/application/execution-platform'

const PO_KEY = 'kepler-exec-po'
const ROLE_KEY = 'kepler-exec-role'

export type ExecutionRole =
  | 'Operator'
  | 'LineSupervisor'
  | 'Quality'
  | 'Cutting'
  | 'Planning'
  | 'Warehouse'
  | 'FactoryManager'
  | 'CEO'

type ExecutionWorkspaceContextValue = {
  productionOrderNo: string
  setProductionOrderNo: (po: string) => void
  role: ExecutionRole
  setRole: (role: ExecutionRole) => void
  actor: string
}

const ExecutionWorkspaceContext = createContext<ExecutionWorkspaceContextValue | null>(null)

const ROLES: ExecutionRole[] = [
  'Operator',
  'LineSupervisor',
  'Quality',
  'Cutting',
  'Planning',
  'Warehouse',
  'FactoryManager',
  'CEO',
]

export function ExecutionWorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: contexts = [] } = useExecutionContextList()
  const [productionOrderNo, setPo] = useState(() => localStorage.getItem(PO_KEY) ?? '')
  const [role, setRoleState] = useState<ExecutionRole>(() => {
    const stored = localStorage.getItem(ROLE_KEY) as ExecutionRole | null
    return stored && ROLES.includes(stored) ? stored : 'LineSupervisor'
  })

  useEffect(() => {
    if (!productionOrderNo && contexts.length > 0) {
      setPo(contexts[0].productionOrderNo)
    }
  }, [contexts, productionOrderNo])

  useEffect(() => {
    if (productionOrderNo) localStorage.setItem(PO_KEY, productionOrderNo)
  }, [productionOrderNo])

  useEffect(() => {
    localStorage.setItem(ROLE_KEY, role)
  }, [role])

  const value = useMemo(
    () => ({
      productionOrderNo,
      setProductionOrderNo: setPo,
      role,
      setRole: setRoleState,
      actor: `user-${role.toLowerCase()}`,
    }),
    [productionOrderNo, role],
  )

  return (
    <ExecutionWorkspaceContext.Provider value={value}>{children}</ExecutionWorkspaceContext.Provider>
  )
}

export function useExecutionWorkspace() {
  const ctx = useContext(ExecutionWorkspaceContext)
  if (!ctx) throw new Error('useExecutionWorkspace requires ExecutionWorkspaceProvider')
  return ctx
}

export { ROLES as EXECUTION_ROLES }
