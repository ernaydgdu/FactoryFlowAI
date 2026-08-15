export type ConsumptionRate = {
  min: number;
  max: number;
  avg: number;
};

export const STANDARD_CONSUMPTION_RATES: Record<string, ConsumptionRate> = {
  TISORT: { min: 1.2, max: 1.5, avg: 1.35 },
  GOMLEK: { min: 1.8, max: 2.2, avg: 2.0 },
  PANTOLON: { min: 1.3, max: 1.6, avg: 1.45 },
  CEKET: { min: 2.0, max: 2.5, avg: 2.25 },
};

const PRODUCT_NAME_KEYWORDS: Array<{ keyword: string; type: keyof typeof STANDARD_CONSUMPTION_RATES }> = [
  { keyword: 'tişört', type: 'TISORT' },
  { keyword: 'tisort', type: 'TISORT' },
  { keyword: 't-shirt', type: 'TISORT' },
  { keyword: 'tshirt', type: 'TISORT' },
  { keyword: 'gömlek', type: 'GOMLEK' },
  { keyword: 'gomlek', type: 'GOMLEK' },
  { keyword: 'pantolon', type: 'PANTOLON' },
  { keyword: 'ceket', type: 'CEKET' },
];

// Ortalama fire oranı: %3
export const WASTE_RATE_MULTIPLIER = 1.03;

export function findConsumptionRate(productName: string): ConsumptionRate | null {
  const normalized = productName.toLocaleLowerCase('tr-TR');
  const match = PRODUCT_NAME_KEYWORDS.find(({ keyword }) => normalized.includes(keyword));
  return match ? STANDARD_CONSUMPTION_RATES[match.type] : null;
}

export function calculateFabricNeed(orderQuantity: number, consumptionRate: number): number {
  return orderQuantity * consumptionRate * WASTE_RATE_MULTIPLIER;
}

export function calculatePastalCount(topBoyuMetre: number, pastalBoyuMetre: number): number {
  if (pastalBoyuMetre <= 0) return 0;
  return Math.round(topBoyuMetre / pastalBoyuMetre);
}
