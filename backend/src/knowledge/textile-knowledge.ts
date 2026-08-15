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

export function findConsumptionRate(
  productName: string,
): ConsumptionRate | null {
  const normalized = productName.toLocaleLowerCase('tr-TR');
  const match = PRODUCT_NAME_KEYWORDS.find(({ keyword }) =>
    normalized.includes(keyword),
  );
  return match ? STANDARD_CONSUMPTION_RATES[match.type] : null;
}

export type ProductTypeMatch = {
  label: string;
  rate: ConsumptionRate;
};

// Serbest metin içinde ürün tipi kelimesi arar (sipariş bağlamı olmadan)
export function findProductType(text: string): ProductTypeMatch | null {
  const normalized = text.toLocaleLowerCase('tr-TR');
  const match = PRODUCT_NAME_KEYWORDS.find(({ keyword }) =>
    normalized.includes(keyword),
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
