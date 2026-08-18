export type CartonBreakdown = {
  color: string;
  size: string;
  totalQty: number;
  unitsPerCarton: number | null;
  fullCartons: number | null;
  lottedQty: number | null;
  looseQty: number;
  totalCartons: number | null;
};

export function computeCartonBreakdown(cs: {
  color: string;
  size: string;
  quantity: number;
  unitsPerCarton: number | null;
}): CartonBreakdown {
  if (!cs.unitsPerCarton || cs.unitsPerCarton <= 0) {
    return {
      color: cs.color,
      size: cs.size,
      totalQty: cs.quantity,
      unitsPerCarton: null,
      fullCartons: null,
      lottedQty: null,
      looseQty: cs.quantity,
      totalCartons: null,
    };
  }

  const fullCartons = Math.floor(cs.quantity / cs.unitsPerCarton);
  const lottedQty = fullCartons * cs.unitsPerCarton;
  const looseQty = cs.quantity - lottedQty;
  const totalCartons = fullCartons + (looseQty > 0 ? 1 : 0);

  return {
    color: cs.color,
    size: cs.size,
    totalQty: cs.quantity,
    unitsPerCarton: cs.unitsPerCarton,
    fullCartons,
    lottedQty,
    looseQty,
    totalCartons,
  };
}
