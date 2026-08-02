/** Deterministic UUID v4-style id — mock/seed stabilitesi için */

export function masterDataId(namespace: string, code: string): string {
  const seed = `${namespace}:${code}`
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193)
    h2 = Math.imul(h2 ^ c, 0x01000193)
  }
  const a = (h1 >>> 0).toString(16).padStart(8, '0')
  const b = (h2 >>> 0).toString(16).padStart(8, '0')
  const c = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0')
  return `${a.slice(0, 8)}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${c.slice(0, 3)}-${c.slice(3, 8)}${a.slice(0, 7)}`
}

export function localizationKey(entityType: string, code: string): string {
  return `md.${entityType.toLowerCase()}.${code.toLowerCase()}`
}
