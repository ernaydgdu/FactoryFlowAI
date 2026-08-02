import type { FieldValidationContext, MasterDataValidationRule } from './types'
import { MASTER_DATA_VALIDATION_RULES } from './enterprise-seed'
import type { ValidationResult } from '../types'
import { validationFail, validationOk } from '../validation'

export function getValidationRules(entityType: string, fieldCode?: string): MasterDataValidationRule[] {
  return MASTER_DATA_VALIDATION_RULES.filter(
    (r) => r.entityType === entityType && (!fieldCode || r.fieldCode === fieldCode),
  )
}

export function validateField(context: FieldValidationContext): ValidationResult {
  const rules = getValidationRules(context.entityType, context.fieldCode)
  const errors: string[] = []

  for (const rule of rules) {
    switch (rule.rule) {
      case 'required':
        if (context.value === undefined || context.value === null || context.value === '') {
          errors.push(rule.message)
        }
        break
      case 'min':
        if (typeof context.value === 'number' && typeof rule.value === 'number' && context.value < rule.value) {
          errors.push(rule.message)
        }
        break
      case 'max':
        if (typeof context.value === 'number' && typeof rule.value === 'number' && context.value > rule.value) {
          errors.push(rule.message)
        }
        break
      case 'regex':
        if (typeof context.value === 'string' && typeof rule.value === 'string') {
          if (!new RegExp(rule.value).test(context.value)) errors.push(rule.message)
        }
        break
      case 'unique':
      case 'default':
      case 'precision':
        break
    }
  }

  return errors.length ? validationFail(errors) : validationOk()
}

export function getDefaultValue(entityType: string, fieldCode: string): unknown {
  const rule = MASTER_DATA_VALIDATION_RULES.find(
    (r) => r.entityType === entityType && r.fieldCode === fieldCode && r.rule === 'default',
  )
  return rule?.value
}

export function countValidationCoverage(): { rules: number; entityTypes: number; ruleKinds: number } {
  const entityTypes = new Set(MASTER_DATA_VALIDATION_RULES.map((r) => r.entityType))
  const ruleKinds = new Set(MASTER_DATA_VALIDATION_RULES.map((r) => r.rule))
  return { rules: MASTER_DATA_VALIDATION_RULES.length, entityTypes: entityTypes.size, ruleKinds: ruleKinds.size }
}
