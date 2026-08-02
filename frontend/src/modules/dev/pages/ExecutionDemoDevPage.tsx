import { useState } from 'react'

import { useInitializeDemoExecutionData } from '@/application/dev-tools/use-execution-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Developer Tool — production navigasyonunda görünmez.
 * Route: /dev/execution-demo
 */
export function ExecutionDemoDevPage() {
  const initDemo = useInitializeDemoExecutionData()
  const [lastResult, setLastResult] = useState<{ contextsSynced: number; bundlesProvisioned: number } | null>(
    null,
  )

  return (
    <div className="mx-auto max-w-lg space-y-6 p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Developer Tool</p>
        <h1 className="text-2xl font-semibold">Execution Demo Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Demo ortamında lifecycle UE kayıtları için execution context, bundle ve WIP kayıtlarını yeniden üretir.
          Production UI&apos;da görünmez.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Initialize Demo Data</CardTitle>
          <CardDescription>
            Tüm aktif üretim emirlerini execution platform ile senkronize eder ve eksik shop-floor bundle&apos;larını
            oluşturur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            disabled={initDemo.isPending}
            onClick={() => {
              initDemo.mutate(
                { actor: 'dev-tools', role: 'FactoryManager' },
                {
                  onSuccess: (result) => setLastResult(result),
                },
              )
            }}
          >
            {initDemo.isPending ? 'Çalışıyor…' : 'Initialize Demo Data'}
          </Button>

          {lastResult ? (
            <p className="text-sm text-muted-foreground">
              {lastResult.contextsSynced} UE senkronize edildi, {lastResult.bundlesProvisioned} UE için bundle
              oluşturuldu.
            </p>
          ) : null}

          {initDemo.isError ? (
            <p className="text-sm text-destructive">
              {initDemo.error instanceof Error ? initDemo.error.message : 'İşlem başarısız'}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
