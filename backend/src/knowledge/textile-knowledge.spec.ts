import { calculateMaxUnitsFromFabric } from './textile-knowledge';

describe('calculateMaxUnitsFromFabric', () => {
  it('fire oranı olmadan (sohbet asistanının kullandığı varsayılan) doğru adet ve kalanı hesaplar', () => {
    // "95645 mt kumaş var sarfiyatta 1,35 mt kaç tane gömlek çıkar" örneği.
    const result = calculateMaxUnitsFromFabric(95645, 1.35);

    expect(result.effectiveConsumption).toBe(1.35);
    expect(result.maxUnits).toBe(70848);
    expect(result.remainingFabric).toBeCloseTo(0.2, 5);
  });

  it('%3 fire oranıyla efektif sarfiyatı artırır ve buna göre daha az adet döner', () => {
    const result = calculateMaxUnitsFromFabric(1000, 2, 3);

    // effectiveConsumption = 2 * 1.03 = 2.06
    expect(result.effectiveConsumption).toBeCloseTo(2.06, 5);
    // maxUnits = floor(1000 / 2.06) = 485
    expect(result.maxUnits).toBe(485);
    expect(result.remainingFabric).toBeCloseTo(0.9, 5);
  });
});
