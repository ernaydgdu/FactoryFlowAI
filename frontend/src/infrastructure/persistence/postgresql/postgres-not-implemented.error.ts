export class PostgresAdapterNotReadyError extends Error {
  constructor(moduleId: string) {
    super(
      `PostgreSQL adapter module "${moduleId}" is not wired yet — Sprint 7 skeleton only. ` +
        'Set PERSISTENCE_BACKEND=memory (default) until PG cutover.',
    )
    this.name = 'PostgresAdapterNotReadyError'
  }
}
