import { usePlatformCommandMutation, usePlatformHealth, useRegisteredCommands } from '@/application/platform/api/use-platform-api'
import { StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getApiRuntimeMode } from '@/infrastructure/api/api-runtime.config'

export function PlatformApiStatusCard() {
  const runtime = getApiRuntimeMode()
  const health = usePlatformHealth()
  const commands = useRegisteredCommands()
  const pingMutation = usePlatformCommandMutation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">API & Tenant Context</CardTitle>
        <CardDescription>Phase 1 platform command gateway durumu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={`Runtime: ${runtime}`} tone="default" />
          <StatusBadge
            label={`API: ${health.data?.apiReachable ? 'reachable' : 'offline'}`}
            tone={health.data?.apiReachable ? 'success' : 'warning'}
          />
          <StatusBadge label={`Persistence: ${health.data?.persistence ?? '—'}`} tone="default" />
        </div>
        <p className="text-muted-foreground">
          Kayıtlı komutlar: {commands.data?.length ?? 0}
          {commands.data?.length ? ` (${commands.data.slice(0, 3).join(', ')}…)` : ''}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={pingMutation.isPending}
          onClick={() => pingMutation.mutate({ commandKey: 'platform.ping' })}
        >
          platform.ping
        </Button>
        {pingMutation.data ? (
          <pre className="overflow-x-auto rounded-md bg-muted/40 p-2 text-xs">
            {JSON.stringify(pingMutation.data, null, 2)}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  )
}
