/** Sprint 7.6 — platform collection PG adapter skeleton. */
import { PostgresAdapterNotReadyError } from '../postgres-not-implemented.error'

export abstract class PostgresCollectionRepositoryStub {
  protected notReady(moduleId: string): never {
    throw new PostgresAdapterNotReadyError(moduleId)
  }
}

export class PostgresCommentCollectionStub extends PostgresCollectionRepositoryStub {}
export class PostgresWatcherCollectionStub extends PostgresCollectionRepositoryStub {}
export class PostgresAiMemoryCollectionStub extends PostgresCollectionRepositoryStub {}

export const postgresCommentCollectionStub = new PostgresCommentCollectionStub()
export const postgresWatcherCollectionStub = new PostgresWatcherCollectionStub()
export const postgresAiMemoryCollectionStub = new PostgresAiMemoryCollectionStub()
