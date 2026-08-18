export type CartonBreakdown = {
  totalQty: number
  unitsPerCarton: number | null
  fullCartons: number | null
  lottedQty: number | null
  looseQty: number
  totalCartons: number | null
}

export function computeCartonBreakdown(quantity: number, unitsPerCarton: number | null): CartonBreakdown {
  if (!unitsPerCarton || unitsPerCarton <= 0) {
    return {
      totalQty: quantity,
      unitsPerCarton: null,
      fullCartons: null,
      lottedQty: null,
      looseQty: quantity,
      totalCartons: null,
    }
  }

  const fullCartons = Math.floor(quantity / unitsPerCarton)
  const lottedQty = fullCartons * unitsPerCarton
  const looseQty = quantity - lottedQty
  const totalCartons = fullCartons + (looseQty > 0 ? 1 : 0)

  return {
    totalQty: quantity,
    unitsPerCarton,
    fullCartons,
    lottedQty,
    looseQty,
    totalCartons,
  }
}
