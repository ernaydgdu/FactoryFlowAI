/** Lazy module-level catalog init — defers repository access until first read (post-bootstrap). */

export function lazyArray<T>(compute: () => T[]): T[] {
  let cache: T[] | undefined
  return new Proxy([] as T[], {
    get(_target, prop) {
      if (cache === undefined) cache = compute()
      const value = Reflect.get(cache, prop, cache)
      return typeof value === 'function' ? value.bind(cache) : value
    },
  })
}

export function lazyObject<T>(compute: () => T): T {
  let cache: T | undefined
  return new Proxy({} as object, {
    get(_target, prop) {
      if (cache === undefined) cache = compute()
      if (cache === null || typeof cache !== 'object') {
        return cache
      }
      const value = Reflect.get(cache, prop, cache)
      return typeof value === 'function' ? value.bind(cache) : value
    },
  }) as T
}

export function lazyValue<T>(compute: () => T): () => T {
  let cache: T | undefined
  return () => {
    if (cache === undefined) cache = compute()
    return cache
  }
}
