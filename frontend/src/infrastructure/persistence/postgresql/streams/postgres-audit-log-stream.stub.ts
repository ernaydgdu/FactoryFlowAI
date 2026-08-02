/** Sprint 7.7 — audit + order timeline stream PG adapter skeleton. */
import { PostgresAdapterNotReadyError } from '../postgres-not-implemented.error'

export class PostgresAuditLogStreamStub {
  private notReady(): never {
    throw new PostgresAdapterNotReadyError('postgres-audit-log-stream')
  }

  append() {
    return this.notReady()
  }
}

export class PostgresOrderTimelineStreamStub {
  private notReady(): never {
    throw new PostgresAdapterNotReadyError('postgres-order-timeline-stream')
  }

  append() {
    return this.notReady()
  }
}

export const postgresAuditLogStreamStub = new PostgresAuditLogStreamStub()
export const postgresOrderTimelineStreamStub = new PostgresOrderTimelineStreamStub()
