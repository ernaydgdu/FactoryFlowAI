/** Browser-native password hashing (PBKDF2-SHA256). */

const PBKDF2_ITERATIONS = 120_000

async function deriveKey(password: string, saltB64: string): Promise<string> {
  const enc = new TextEncoder()
  const saltBytes = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0))
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return btoa(String.fromCharCode(...new Uint8Array(bits)))
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = btoa(String.fromCharCode(...saltBytes))
  const hash = await deriveKey(password, salt)
  return { hash, salt }
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  const candidate = await deriveKey(password, salt)
  return candidate === hash
}
