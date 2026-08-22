// === 1. KUMAŞ SARFİYAT VE İHTİYAÇ HESAPLAMA ===

export type ConsumptionRate = {
  min: number;
  max: number;
  avg: number;
  // Bazı ürün tipleri için aralık yerine fabrikaya özel sabit bir değer kullanılır.
  sabit?: number;
};

export const STANDARD_CONSUMPTION_RATES: Record<string, ConsumptionRate> = {
  TISORT: { min: 1.2, max: 1.5, avg: 1.35 },
  // Fabrikaya özel sabit değer: 1.5 m/adet
  GOMLEK: { min: 1.5, max: 1.5, avg: 1.5, sabit: 1.5 },
  PANTOLON: { min: 1.3, max: 1.6, avg: 1.45 },
  CEKET: { min: 2.0, max: 2.5, avg: 2.25 },
  ELBISE: { min: 1.6, max: 2.0, avg: 1.8 },
  ETEK: { min: 1.0, max: 1.3, avg: 1.15 },
};

const PRODUCT_NAME_KEYWORDS: Array<{
  keyword: string;
  type: keyof typeof STANDARD_CONSUMPTION_RATES;
  label: string;
}> = [
  { keyword: 'tişört', type: 'TISORT', label: 'Tişört' },
  { keyword: 'tisort', type: 'TISORT', label: 'Tişört' },
  { keyword: 't-shirt', type: 'TISORT', label: 'Tişört' },
  { keyword: 'tshirt', type: 'TISORT', label: 'Tişört' },
  { keyword: 'gömlek', type: 'GOMLEK', label: 'Gömlek' },
  { keyword: 'gomlek', type: 'GOMLEK', label: 'Gömlek' },
  { keyword: 'pantolon', type: 'PANTOLON', label: 'Pantolon' },
  { keyword: 'ceket', type: 'CEKET', label: 'Ceket' },
  { keyword: 'elbise', type: 'ELBISE', label: 'Elbise' },
  { keyword: 'etek', type: 'ETEK', label: 'Etek' },
];

// Ortalama fire oranı: %3
export const WASTE_RATE_MULTIPLIER = 1.03;

// Türkçe İ/I/ı harflerinin tr-TR locale'de düz ASCII "i" ile tutarsız
// eşleşmesini önler (örn. "T-SHIRT" → tr-TR'de "t-shırt" olur ve "t-shirt"
// anahtar kelimesiyle eşleşmez). Karşılaştırmadan önce tüm İ/I/ı varyantları
// düz "i"ye indirgenir, ardından tr-TR ile küçük harfe çevrilir.
function normalizeText(text: string): string {
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLocaleLowerCase('tr-TR');
}

export function findConsumptionRate(
  productName: string,
): ConsumptionRate | null {
  const normalized = normalizeText(productName);
  const match = PRODUCT_NAME_KEYWORDS.find(({ keyword }) =>
    normalized.includes(normalizeText(keyword)),
  );
  return match ? STANDARD_CONSUMPTION_RATES[match.type] : null;
}

export type ProductTypeMatch = {
  label: string;
  rate: ConsumptionRate;
};

// Serbest metin içinde ürün tipi kelimesi arar (sipariş bağlamı olmadan)
export function findProductType(text: string): ProductTypeMatch | null {
  const normalized = normalizeText(text);
  const match = PRODUCT_NAME_KEYWORDS.find(({ keyword }) =>
    normalized.includes(normalizeText(keyword)),
  );
  return match
    ? { label: match.label, rate: STANDARD_CONSUMPTION_RATES[match.type] }
    : null;
}

// Sabit değeri varsa onu, yoksa aralık + ortalamayı okunabilir metne çevirir.
export function formatConsumptionRate(rate: ConsumptionRate): string {
  if (rate.sabit !== undefined) {
    return `sabit ${rate.sabit.toFixed(1)} m/adet`;
  }
  return `${rate.min.toFixed(1)}-${rate.max.toFixed(1)} m/adet, ortalama ${rate.avg.toFixed(1)} m/adet`;
}

export function calculateFabricNeed(
  orderQuantity: number,
  consumptionRate: number,
): number {
  return orderQuantity * consumptionRate * WASTE_RATE_MULTIPLIER;
}

// Ters yön: elde belli miktarda kumaş varken, verilen sarfiyat oranıyla
// (kullanıcının kendi belirttiği oran — bilgi kütüphanesindeki sabit değer
// DEĞİL) en fazla kaç adet üretilebileceğini hesaplar.
export type MaxUnitsFromFabricResult = {
  maxUnits: number;
  effectiveConsumption: number;
  remainingFabric: number;
};

export function calculateMaxUnitsFromFabric(
  availableFabricMeters: number,
  consumptionPerUnit: number,
  wastagePercent = 0,
): MaxUnitsFromFabricResult {
  const effectiveConsumption = consumptionPerUnit * (1 + wastagePercent / 100);
  const maxUnits =
    effectiveConsumption > 0
      ? Math.floor(availableFabricMeters / effectiveConsumption)
      : 0;
  const remainingFabric =
    availableFabricMeters - maxUnits * effectiveConsumption;

  return { maxUnits, effectiveConsumption, remainingFabric };
}

// === 2. TOP/PASTAL HESAPLAMA ===

export type TopUsageResult = {
  pastalAdedi: number;
  kalanMetre: number;
  kullanılanKumaş: number;
};

export function calculateTopUsage(
  topBoyu: number,
  pastalBoyu: number,
): TopUsageResult {
  if (pastalBoyu <= 0) {
    return { pastalAdedi: 0, kalanMetre: topBoyu, kullanılanKumaş: 0 };
  }

  const pastalAdedi = Math.floor(topBoyu / pastalBoyu);
  const kullanılanKumaş = pastalAdedi * pastalBoyu;
  const kalanMetre = topBoyu - kullanılanKumaş;

  return { pastalAdedi, kalanMetre, kullanılanKumaş };
}

// === 3. KUMAŞTAN FAYDALANMA YÜZDESİ (PASTAL VERİMİ) ===

// İyi bir pastal verimi genelde %80-90 arasıdır, bunun altı verimsiz kabul edilir
export const GOOD_EFFICIENCY_THRESHOLD = 80;

export type FabricEfficiencyResult = {
  verimlilikYuzdesi: number;
  dokuntuYuzdesi: number;
  degerlendirme: string;
};

export function calculateFabricEfficiency(
  toplamSablonAlaniM2: number,
  kumasEniM: number,
  kumasBoyuM: number,
): FabricEfficiencyResult {
  const toplamKumasAlani = kumasEniM * kumasBoyuM;
  const verimlilikYuzdesi =
    toplamKumasAlani > 0 ? (toplamSablonAlaniM2 / toplamKumasAlani) * 100 : 0;
  const dokuntuYuzdesi = 100 - verimlilikYuzdesi;
  const degerlendirme =
    verimlilikYuzdesi >= GOOD_EFFICIENCY_THRESHOLD
      ? 'İyi pastal verimi (%80-90 aralığı ve üzeri hedeflenir).'
      : 'Verimsiz pastal — %80 altı yüksek döküntü/fire riski taşır.';

  return { verimlilikYuzdesi, dokuntuYuzdesi, degerlendirme };
}

// === 4. KESİM İŞÇİLİK MALİYETİ ===

const WORKDAY_MINUTES = 480; // 8 saatlik gün

export type CuttingCostByProportionResult = {
  toplamSure: number;
  toplamMaliyet: number;
};

// Yöntem 1 - süre bileşenlerinin oranı ile
export function calculateCuttingCostByProportion(
  serimBoyu: number,
  masaBoyu: number,
  serimZamaniDk: number,
  katAdedi: number,
  pastalHazirlamaDk: number,
  kabaKesimDk: number,
  inceKesimDk: number,
  masaTemizlemeDk: number,
  gunlukIscilikUcreti: number,
): CuttingCostByProportionResult {
  const toplamSure =
    serimZamaniDk +
    pastalHazirlamaDk +
    kabaKesimDk +
    inceKesimDk +
    masaTemizlemeDk;
  const toplamMaliyet = (toplamSure / WORKDAY_MINUTES) * gunlukIscilikUcreti;

  return { toplamSure, toplamMaliyet };
}

export type CuttingCostByFormulaResult = {
  kesilebilecekBedenSayisi: number;
  toplamSure: number;
  toplamMaliyet: number;
  birimMaliyet: number;
};

// Yöntem 2 - masa boyu ve birim kumaş miktarına göre formülle
export function calculateCuttingCostByFormula(
  kesilecekMiktar: number,
  gunlukIscilikUcreti: number,
  masaBoyu: number,
  birimKumasGideri: number,
  serimBirimSuresiDk: number,
  kesimSuresiDk: number,
  pastalHazirlamaSuresiDk: number,
  masaTemizlemeSuresiDk: number,
  katSayisi: number,
  bedenSayisi: number,
  ekZamanYuzdesi: number,
): CuttingCostByFormulaResult {
  const kesilebilecekBedenSayisi = Math.floor(masaBoyu / birimKumasGideri);
  const serimZamani = katSayisi * serimBirimSuresiDk * bedenSayisi;
  const pastalHazirlama = pastalHazirlamaSuresiDk * bedenSayisi;
  const kesimZamani = kesimSuresiDk * bedenSayisi;
  const masaTemizleme = masaTemizlemeSuresiDk * bedenSayisi;
  const toplamSure =
    (serimZamani + pastalHazirlama + kesimZamani + masaTemizleme) *
    (1 + ekZamanYuzdesi / 100);
  const toplamMaliyet = (toplamSure / WORKDAY_MINUTES) * gunlukIscilikUcreti;
  const birimMaliyet =
    kesilecekMiktar > 0 ? toplamMaliyet / kesilecekMiktar : 0;

  return { kesilebilecekBedenSayisi, toplamSure, toplamMaliyet, birimMaliyet };
}

// === 5. HAMMADDE DEPOSU YÖNETİMİ (FIFO/LIFO ÖNERİSİ) ===

export type TeslimSekli = 'TAM' | 'PARCALI';
export type WarehouseMethod = 'FIFO' | 'LIFO';

export type WarehouseRecommendation = {
  yontem: WarehouseMethod;
  aciklama: string;
};

export function recommendWarehouseMethod(
  renkSayisi: number,
  bedenSayisi: number,
  teslimSekli: TeslimSekli,
): WarehouseRecommendation {
  const cokRenkCokBeden = renkSayisi > 1 && bedenSayisi > 1;
  const parcaliTeslimat = teslimSekli === 'PARCALI';

  if (cokRenkCokBeden || parcaliTeslimat) {
    return {
      yontem: 'LIFO',
      aciklama:
        'LIFO (son giren önce çıkar): fiyat garantisi sağlar; çok renk/çok beden çeşitliliği veya parçalı teslimat durumunda tercih edilir.',
    };
  }

  return {
    yontem: 'FIFO',
    aciklama:
      'FIFO (önce giren önce çıkar): fiyat garantisi yoktur ama stok devri düzenlidir; tek renk ve düzenli teslimatlarda tercih edilir.',
  };
}

// === 6. KESİM EMRİ TÜRÜ ÖNERİSİ ===

export type CuttingOrderRecommendation = {
  tur: string;
  aciklama: string;
};

export function recommendCuttingOrderType(
  bedenSayisi: number,
  renkSayisi: number,
): CuttingOrderRecommendation {
  if (bedenSayisi <= 1 && renkSayisi <= 1) {
    return {
      tur: 'Tek bedenli kesim emri',
      aciklama: 'Tek beden, tek renk — en basit kesim emri türü.',
    };
  }

  if (bedenSayisi <= 1 && renkSayisi > 1) {
    return {
      tur: 'Tek bedenli çok renkli kesim emri',
      aciklama:
        'Tek beden, birden fazla renk — her renk ayrı pastalda kesilmelidir.',
    };
  }

  if (bedenSayisi === 2) {
    return {
      tur: 'İki bedenli kesim emri',
      aciklama:
        'En büyük ve en küçük bedenleri aynı pastalda birlikte yerleştirmeyi öner — zıt bedenler bir arada kumaş tasarrufu sağlar.',
    };
  }

  return {
    tur: 'Çok bedenli kesim emri',
    aciklama:
      'Masa boyu ve birim kumaş giderine göre aynı pastalda kesilecek beden sayısına karar ver (bkz. kesilebilecekBedenSayisi hesaplaması).',
  };
}

// === 7. KUMAŞ ENİ SEÇİMİ TAVSİYESİ ===

export const FABRIC_WIDTH_ADVICE =
  'Geniş kumaş enleri genelde daha verimli pastal imkânı sağlar çünkü küçük parçalar aralardan alınabilir.';

// === 8. İPLİK NUMARALANDIRMA SİSTEMLERİ ARASI ÇEVRİM ===

export type YarnCountUnit = 'NE' | 'NM' | 'TEX' | 'DENYE';

function yarnUnitToTex(value: number, unit: YarnCountUnit): number {
  switch (unit) {
    case 'NE':
      return 590.5 / value;
    case 'NM':
      return 1000 / value;
    case 'DENYE':
      return value / 9;
    case 'TEX':
      return value;
  }
}

function texToYarnUnit(tex: number, unit: YarnCountUnit): number {
  switch (unit) {
    case 'NE':
      return 590.5 / tex;
    case 'NM':
      return 1000 / tex;
    case 'DENYE':
      return tex * 9;
    case 'TEX':
      return tex;
  }
}

// Önce Tex'e, sonra Tex'ten hedef birime çevirir. Ne/Nm sistemlerinde
// sayı büyüdükçe iplik incelir; Tex/Denye'de sayı büyüdükçe iplik
// kalınlaşır — bu yüzden ara birim olarak sabit (doğrusal) Tex kullanılır.
export function convertYarnCount(
  value: number,
  fromUnit: YarnCountUnit,
  toUnit: YarnCountUnit,
): number {
  if (fromUnit === toUnit) return value;
  const tex = yarnUnitToTex(value, fromUnit);
  return texToYarnUnit(tex, toUnit);
}

// === 9. OEE (GENEL EKİPMAN VERİMLİLİĞİ) ===

// Dünya standardında "iyi" kabul edilen OEE değeri; tekstilde tipik
// değerler genelde %60-75 aralığındadır.
export const WORLD_CLASS_OEE_THRESHOLD = 85;

export type OEEResult = {
  availabilityPercent: number;
  performancePercent: number;
  qualityPercent: number;
  oeePercent: number;
};

export function calculateOEE(
  plannedMinutes: number,
  downtimeMinutes: number,
  idealRatePerMinute: number,
  actualOutput: number,
  totalOutput: number,
  goodOutput: number,
): OEEResult {
  const operatingMinutes = plannedMinutes - downtimeMinutes;
  const availability =
    plannedMinutes > 0 ? operatingMinutes / plannedMinutes : 0;
  const performanceRaw =
    operatingMinutes > 0 && idealRatePerMinute > 0
      ? actualOutput / (operatingMinutes * idealRatePerMinute)
      : 0;
  const performance = Math.min(1, performanceRaw);
  const quality = totalOutput > 0 ? goodOutput / totalOutput : 0;
  const oee = availability * performance * quality;

  return {
    availabilityPercent: availability * 100,
    performancePercent: performance * 100,
    qualityPercent: quality * 100,
    oeePercent: oee * 100,
  };
}

// === 10. BAŞABAŞ NOKTASI ANALİZİ ===

export type BreakEvenResult =
  { ok: true; breakEvenUnits: number } | { ok: false; message: string };

export function calculateBreakEven(
  fixedCosts: number,
  sellingPricePerUnit: number,
  variableCostPerUnit: number,
): BreakEvenResult {
  if (sellingPricePerUnit <= variableCostPerUnit) {
    return {
      ok: false,
      message:
        'Satış fiyatı birim değişken maliyetin üzerinde olmadığı için asla başabaşa ulaşılamaz.',
    };
  }

  const breakEvenUnits =
    fixedCosts / (sellingPricePerUnit - variableCostPerUnit);
  return { ok: true, breakEvenUnits };
}

// === 11. KÂR MARJI ===

export type ProfitMarginResult = {
  profit: number;
  marginPercent: number;
};

export function calculateProfitMargin(
  sellingPrice: number,
  totalCost: number,
): ProfitMarginResult {
  const profit = sellingPrice - totalCost;
  const marginPercent = sellingPrice !== 0 ? (profit / sellingPrice) * 100 : 0;
  return { profit, marginPercent };
}

// === 12. BOYA REÇETESİ (%OWF YÖNTEMİ) ===

export type DyeRecipeResult = {
  dyeAmountGrams: number;
};

// %owf ("on weight of fabric") — boyanacak kumaş ağırlığının yüzdesi
// üzerinden hesaplanan basit reçete yöntemi.
export function calculateDyeRecipe(
  fabricWeightKg: number,
  dyePercentOWF: number,
): DyeRecipeResult {
  return { dyeAmountGrams: fabricWeightKg * 10 * dyePercentOWF };
}
