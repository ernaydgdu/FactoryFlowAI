import { Copy, Minus, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

// Sadece Electron içinde (frame: false ile açılan pencerede) render edilir -
// normal tarayıcıda window.electronAPI tanımsız olduğu için hiçbir şey
// göstermez.
export function WindowControls() {
  const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return

    window.electronAPI.isWindowMaximized().then(setIsMaximized)
    const unsubscribe = window.electronAPI.onWindowMaximizedChange(setIsMaximized)
    return unsubscribe
  }, [isElectron])

  if (!isElectron) return null

  return (
    <div className="flex items-stretch [-webkit-app-region:no-drag]">
      <button
        type="button"
        onClick={() => window.electronAPI?.minimizeWindow()}
        title="Küçült"
        className="flex w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => window.electronAPI?.toggleMaximizeWindow()}
        title={isMaximized ? 'Geri Yükle' : 'Büyüt'}
        className="flex w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {isMaximized ? <Copy className="size-3.5" /> : <Square className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => window.electronAPI?.closeWindow()}
        title="Kapat"
        className={cn(
          'flex w-11 items-center justify-center text-muted-foreground transition-colors',
          'hover:bg-destructive hover:text-white',
        )}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
