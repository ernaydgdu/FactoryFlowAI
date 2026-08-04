/**
 * Rule Engine — evaluates Manufacturing Knowledge business rules against facts.
 * Returns PASS | WARNING | CRITICAL | BLOCKED. No ERP mutation.
 */
import {
  queryBusinessRules,
  type BusinessRuleAction,
  type BusinessRuleCondition,
  type BusinessRuleDefinition,
} from '@/domain/brain/manufacturing-knowledge'

import type { FactContext, RuleEvaluationResult, RuleVerdict } from './types'

function resolveField(ctx: FactContext, field: string): number | boolean | string | undefined {
  return ctx[field]
}

function coerceNumber(v: number | boolean | string | undefined): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return null
}

function resolveCompareValue(
  ctx: FactContext,
  raw: string | number | boolean | undefined,
): number | boolean | string | undefined {
  if (raw === undefined) return undefined
  if (typeof raw === 'string' && raw in ctx) return ctx[raw]
  return raw
}

function evaluateCondition(cond: BusinessRuleCondition, ctx: FactContext): boolean | null {
  const left = resolveField(ctx, cond.field)
  if (left === undefined) return null

  switch (cond.operator) {
    case 'IS_TRUE':
      return left === true || left === 1 || left === 'true'
    case 'IS_FALSE':
      return left === false || left === 0 || left === 'false'
    case 'EQ':
      return left === resolveCompareValue(ctx, cond.value)
    case 'NE':
      return left !== resolveCompareValue(ctx, cond.value)
    case 'LT':
    case 'LTE':
    case 'GT':
    case 'GTE': {
      const l = coerceNumber(left)
      const r = coerceNumber(resolveCompareValue(ctx, cond.value))
      if (l === null || r === null) return null
      if (cond.operator === 'LT') return l < r
      if (cond.operator === 'LTE') return l <= r
      if (cond.operator === 'GT') return l > r
      return l >= r
    }
    default:
      return null
  }
}

function verdictFromMatch(rule: BusinessRuleDefinition, actions: BusinessRuleAction[]): RuleVerdict {
  const types = new Set(actions.map((a) => a.type))
  if (
    types.has('REJECT') ||
    types.has('BLOCK_MACHINE') ||
    types.has('BLOCK_SHIPMENT')
  ) {
    return 'BLOCKED'
  }
  if (rule.severity === 'CRITICAL') return 'CRITICAL'
  if (rule.severity === 'WARNING' || types.has('ALERT') || types.has('REQUIRE_LOT_FIFO') || types.has('SUGGEST')) {
    return 'WARNING'
  }
  return 'PASS'
}

function evaluateOne(rule: BusinessRuleDefinition, ctx: FactContext): RuleEvaluationResult {
  const results = rule.when.map((c) => ({ cond: c, result: evaluateCondition(c, ctx) }))
  const missing = results.filter((r) => r.result === null)
  if (missing.length > 0) {
    return {
      ruleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      verdict: 'PASS',
      applicable: false,
      matched: false,
      message: `Insufficient facts for fields: ${missing.map((m) => m.cond.field).join(', ')}`,
      evidence: missing.map((m) => `Missing fact field '${m.cond.field}'`),
      actions: [],
      relatedConcepts: rule.relatedConcepts,
      severity: rule.severity,
    }
  }

  const matched = results.every((r) => r.result === true)
  if (!matched) {
    return {
      ruleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      verdict: 'PASS',
      applicable: true,
      matched: false,
      message: 'Rule conditions not met — no action.',
      evidence: rule.when.map((c) => `${c.field}=${String(ctx[c.field])}`),
      actions: [],
      relatedConcepts: rule.relatedConcepts,
      severity: rule.severity,
    }
  }

  const verdict = verdictFromMatch(rule, rule.then)
  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    ruleName: rule.name,
    verdict,
    applicable: true,
    matched: true,
    message: rule.then.map((a) => a.message).join(' '),
    evidence: rule.when.map((c) => `${c.field}=${String(ctx[c.field])} (${c.operator})`),
    actions: rule.then.map((a) => `${a.type}: ${a.message}`),
    relatedConcepts: rule.relatedConcepts,
    severity: rule.severity,
  }
}

export function evaluateBusinessRules(ctx: FactContext): RuleEvaluationResult[] {
  return queryBusinessRules().map((rule) => evaluateOne(rule, ctx))
}
