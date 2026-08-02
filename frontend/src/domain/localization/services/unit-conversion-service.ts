import { LENGTH_TO_METERS, WEIGHT_TO_KG } from '../constants'
import type {
  AreaUnitCode,
  LengthUnitCode,
  UnitConversionRequest,
  UnitConversionResult,
  WeightUnitCode,
} from '../types'

const AREA_TO_M2: Record<AreaUnitCode, number> = {
  M2: 1,
  YARD2: 0.836127,
}

function isLengthUnit(unit: string): unit is LengthUnitCode {
  return unit in LENGTH_TO_METERS
}

function isWeightUnit(unit: string): unit is WeightUnitCode {
  return unit in WEIGHT_TO_KG
}

function isAreaUnit(unit: string): unit is AreaUnitCode {
  return unit in AREA_TO_M2
}

function assertSameCategory(from: string, to: string): void {
  const fromLength = isLengthUnit(from)
  const toLength = isLengthUnit(to)
  const fromWeight = isWeightUnit(from)
  const toWeight = isWeightUnit(to)
  const fromArea = isAreaUnit(from)
  const toArea = isAreaUnit(to)

  if (fromLength !== toLength || fromWeight !== toWeight || fromArea !== toArea) {
    throw new Error(`UNIT_CATEGORY_MISMATCH: ${from} → ${to}`)
  }
}

export function convertLength(value: number, from: LengthUnitCode, to: LengthUnitCode): number {
  const meters = value * LENGTH_TO_METERS[from]
  return meters / LENGTH_TO_METERS[to]
}

export function convertWeight(value: number, from: WeightUnitCode, to: WeightUnitCode): number {
  const kg = value * WEIGHT_TO_KG[from]
  return kg / WEIGHT_TO_KG[to]
}

export function convertArea(value: number, from: AreaUnitCode, to: AreaUnitCode): number {
  const m2 = value * AREA_TO_M2[from]
  return m2 / AREA_TO_M2[to]
}

export function convertUnit(request: UnitConversionRequest): UnitConversionResult {
  const { value, fromUnit, toUnit } = request
  assertSameCategory(fromUnit, toUnit)

  let converted: number
  if (isLengthUnit(fromUnit) && isLengthUnit(toUnit)) {
    converted = convertLength(value, fromUnit, toUnit)
  } else if (isWeightUnit(fromUnit) && isWeightUnit(toUnit)) {
    converted = convertWeight(value, fromUnit, toUnit)
  } else {
    converted = convertArea(value, fromUnit as AreaUnitCode, toUnit as AreaUnitCode)
  }

  const factor = value !== 0 ? converted / value : 1
  return {
    value: round(converted, 4),
    fromUnit,
    toUnit,
    factor: round(factor, 6),
  }
}

export function metersToYards(meters: number): number {
  return convertLength(meters, 'M', 'YARD')
}

export function yardsToMeters(yards: number): number {
  return convertLength(yards, 'YARD', 'M')
}

export function kgToLbs(kg: number): number {
  return convertWeight(kg, 'KG', 'LB')
}

export function lbsToKg(lbs: number): number {
  return convertWeight(lbs, 'LB', 'KG')
}

export function cmToInch(cm: number): number {
  return convertLength(cm, 'CM', 'INCH')
}

export function inchToCm(inch: number): number {
  return convertLength(inch, 'INCH', 'CM')
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
