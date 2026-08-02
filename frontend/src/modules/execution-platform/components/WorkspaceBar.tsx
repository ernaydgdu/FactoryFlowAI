import { useExecutionContextList } from '@/application/execution-platform'
import { EXECUTION_ROLES, useExecutionWorkspace } from '../context/ExecutionWorkspaceContext'
import { ThemeToggle } from './ThemeToggle'

export function WorkspaceBar() {
  const { data: contexts = [] } = useExecutionContextList()
  const { productionOrderNo, setProductionOrderNo, role, setRole } = useExecutionWorkspace()

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
      <div className="flex min-w-[220px] flex-1 items-center gap-2">
        <label htmlFor="exec-po" className="shrink-0 text-xs font-medium uppercase text-muted-foreground">
          UE
        </label>
        <select
          id="exec-po"
          className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
          value={productionOrderNo}
          onChange={(e) => setProductionOrderNo(e.target.value)}
        >
          <option value="">Üretim emri seçin</option>
          {contexts.map((c) => (
            <option key={c.productionOrderNo} value={c.productionOrderNo}>
              {c.productionOrderNo} — {c.salesOrderNo}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="exec-role" className="text-xs font-medium uppercase text-muted-foreground">
          Rol
        </label>
        <select
          id="exec-role"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
        >
          {EXECUTION_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <ThemeToggle />
    </div>
  )
}
