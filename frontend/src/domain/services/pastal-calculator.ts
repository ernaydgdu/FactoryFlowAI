import type { PastalPlan } from '../types/workflows'

export type PastalInput = {
  fabricWidth: number
  plyCount: number
  pastalLength: number
  markerEfficiency: number
  wastePercent: number
  consumptionPerPiece: number
  orderQty: number
}

export type PastalResult = {
  yieldPercent: number
  wastePercent: number
  fabricConsumption: number
  piecesPerPastal: number
  pastalsNeeded: number
}

export function calculatePastal(input: PastalInput): PastalResult {
  const usableWidth = input.fabricWidth * (input.markerEfficiency / 100)
  const piecesPerPastal = Math.floor(
    (usableWidth * input.pastalLength * input.plyCount) /
      (input.consumptionPerPiece * 100),
  )
  const safePieces = Math.max(piecesPerPastal, 1)
  const fabricPerPastal =
    (input.pastalLength * input.plyCount * input.fabricWidth) / 100
  const wasteFabric = fabricPerPastal * (input.wastePercent / 100)
  const totalConsumption =
    Math.round((fabricPerPastal + wasteFabric) * (input.orderQty / safePieces) * 100) / 100

  return {
    yieldPercent: input.markerEfficiency,
    wastePercent: input.wastePercent,
    fabricConsumption: totalConsumption,
    piecesPerPastal: safePieces,
    pastalsNeeded: Math.ceil(input.orderQty / safePieces),
  }
}

export function pastalSummary(plan: PastalPlan): string {
  return `Pastal ${plan.pastalNo}: ${plan.fabricWidth}cm en × ${plan.plyCount} kat × ${plan.pastalLength}m = ${plan.fabricConsumption}m kumaş (%${plan.yieldPercent} verim, %${plan.wastePercent} fire)`
}
