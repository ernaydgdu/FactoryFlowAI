/**
 * Persistence runtime feature flags — domain-safe (no infrastructure imports).
 */

/** When true, WIP read model rebuilds synchronously on query path (legacy fallback). */
export const PERSISTENCE_WIP_SYNC_FALLBACK =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_PERSISTENCE_WIP_SYNC_FALLBACK === 'true'
