import { Component, type ErrorInfo, type ReactNode } from 'react'

import { keplerLogger } from '@/performance/logger'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    keplerLogger.error('React Error Boundary yakaladı', {
      message: error.message,
      componentStack: info.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
            <h2 className="text-lg font-semibold">Bir hata oluştu</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Sayfa yüklenirken beklenmeyen bir sorun oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
            </p>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Sayfayı Yenile
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
