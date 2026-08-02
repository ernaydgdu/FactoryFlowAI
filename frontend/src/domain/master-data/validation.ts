import type { BaseMasterEntity, ValidationResult } from './types'

export function validationOk(): ValidationResult {
  return { valid: true, errors: [] }
}

export function validationFail(errors: string[]): ValidationResult {
  return { valid: false, errors }
}

export function validateBase(entity: Partial<BaseMasterEntity>): ValidationResult {
  const errors: string[] = []
  if (!entity.code?.trim()) errors.push('Kod zorunludur')
  if (!entity.name?.trim()) errors.push('Ad zorunludur')
  if (entity.code && !/^[A-Z0-9_-]{2,20}$/.test(entity.code)) {
    errors.push('Kod 2-20 karakter, büyük harf/rakam olmalı')
  }
  return errors.length === 0 ? validationOk() : validationFail(errors)
}

export function validateRequiredId(value: string | undefined, field: string): string | null {
  if (!value?.trim()) return `${field} zorunludur`
  return null
}

export function validatePositiveNumber(value: number | undefined, field: string): string | null {
  if (value === undefined || value < 0) return `${field} sıfır veya pozitif olmalı`
  return null
}

export function validateEmail(email: string | undefined): string | null {
  if (!email?.trim()) return 'E-posta zorunludur'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Geçersiz e-posta'
  return null
}

export function validateNonEmptyArray<T>(arr: T[] | undefined, field: string): string | null {
  if (!arr || arr.length === 0) return `${field} en az bir öğe içermeli`
  return null
}

export function mergeValidation(...results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((r) => r.errors)
  return errors.length === 0 ? validationOk() : validationFail(errors)
}

export function validateUniqueCode<T extends BaseMasterEntity>(
  entities: T[],
  code: string,
  excludeId?: string,
): ValidationResult {
  const exists = entities.some((e) => e.code === code && e.id !== excludeId)
  return exists ? validationFail(['Kod zaten kullanılıyor']) : validationOk()
}
