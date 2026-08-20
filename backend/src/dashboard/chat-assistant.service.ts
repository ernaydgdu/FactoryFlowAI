import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';
import { AnalyticsService } from './analytics.service';
import {
  calculateBreakEven,
  calculateDyeRecipe,
  calculateFabricEfficiency,
  calculateFabricNeed,
  calculateOEE,
  calculateProfitMargin,
  calculateTopUsage,
  convertYarnCount,
  FABRIC_WIDTH_ADVICE,
  findConsumptionRate,
  findProductType,
  formatConsumptionRate,
  GOOD_EFFICIENCY_THRESHOLD,
  recommendCuttingOrderType,
  recommendWarehouseMethod,
  WORLD_CLASS_OEE_THRESHOLD,
  type TeslimSekli,
  type YarnCountUnit,
} from '../knowledge/textile-knowledge';
import { searchKnowledgeLibrary } from '../knowledge/textile-library';
import { computeCompletionForecast } from '../orders/forecast.util';
import {
  computeExpectedProgress,
  isWithinWorkday,
} from '../common/line-pace.util';
import { computeFasonFireStats } from '../common/fason.util';
import { isFabricMaterialType } from '../common/material-type.util';
import { normalizeTr } from '../common/text-match.util';
import { pickBestIntent, type IntentDefinition } from './intent-matcher.util';
import {
  APPROVAL_STAGE_LABEL,
  APPROVAL_STAGE_ORDER_LIST,
  dateOnlyUTC,
  daysBetweenUTC,
  extractNumbers,
  formatDateTR,
  todayRangeUTC,
  type OrderWithMaterials,
} from './dashboard-shared';

type OrderLookup = {
  order: OrderWithMaterials | null;
  clarification: string | null;
};

const YARN_UNIT_NAMES: Record<YarnCountUnit, string> = {
  NE: 'Ne',
  NM: 'Nm',
  TEX: 'Tex',
  DENYE: 'Denye',
};

type YarnConversionQuery = {
  value: number;
  fromUnit: YarnCountUnit;
  toUnit: YarnCountUnit;
};

// "30 Ne kaç Tex" gibi sorulardan değer + kaynak birim + hedef birimi
// çıkarır. Kaynak birim, sayının HEMEN ardından (sadece boşlukla ayrılmış)
// gelen bir birim kısaltmasıdır — bu katılık, "1040 ne durumda" gibi
// alakasız sorularda "ne" kelimesinin yanlışlıkla birim sanılmasını önler
// (böyle durumlarda ikinci bir birim kelimesi bulunamayacağı için sonuç
// zaten null döner).
function extractYarnConversionQuery(
  question: string,
): YarnConversionQuery | null {
  const sourceMatch = question.match(
    /(\d+(?:[.,]\d+)?)\s*(ne|nm|tex|denye)\b/i,
  );
  if (!sourceMatch || sourceMatch.index === undefined) return null;

  const value = parseFloat(sourceMatch[1].replace(',', '.'));
  const fromUnit = sourceMatch[2].toUpperCase() as YarnCountUnit;

  const afterText = question.slice(sourceMatch.index + sourceMatch[0].length);
  const targetMatch = afterText.match(/\b(ne|nm|tex|denye)\b/i);
  if (!targetMatch) return null;

  const toUnit = targetMatch[1].toUpperCase() as YarnCountUnit;
  return { value, fromUnit, toUnit };
}

// Hesaplama intent'lerinin (OEE, başabaş noktası, kâr marjı, boya reçetesi)
// salt tanım sorularıyla ("OEE nedir?") çakışmaması için: soru açıkça
// "hesapla" içermiyorsa, en az beklenen sayıda değer geçmesi gerekir.
// Aksi halde soru bilgi kütüphanesindeki tanım kartına düşer.
function hasCalculationTrigger(
  question: string,
  requiredNumberCount: number,
): boolean {
  if (/hesapla/i.test(question)) return true;
  return extractNumbers(question).length >= requiredNumberCount;
}

// Orijinal if-else zincirindeki sıra korunur — eşit (skor 1) çakışmalar bu
// sıraya göre sessizce çözülür (bkz. intent-matcher.util.ts).
const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    id: 'capabilities',
    label: 'yeteneklerim hakkında bilgi',
    clauses: [
      [
        [
          'neler sorabilirim',
          'ne yapabilirsin',
          'yardım',
          'komutların',
          'yapabileceklerin',
        ],
      ],
    ],
  },
  {
    id: 'genericConsumptionRate',
    label: 'standart kumaş sarfiyat oranı',
    clauses: [
      [
        ['sarfiyat', 'sarfiyatı', 'sarfiyat oranı'],
        [
          'ne kadar',
          'kaç',
          'ne miktar',
          'gerekir',
          'gerekiyor',
          'lazım',
          'ihtiyaç',
        ],
      ],
    ],
  },
  {
    id: 'fabricQuantity',
    label: 'sipariş için kumaş ihtiyacı hesaplama',
    clauses: [
      [
        ['kumaş'],
        [
          'kaç metre',
          'ne kadar',
          'ne miktar',
          'gerekir',
          'gerekiyor',
          'lazım',
          'ihtiyaç var',
          'ihtiyaç',
        ],
      ],
    ],
  },
  {
    id: 'unitCost',
    label: 'sipariş birim maliyeti hesaplama',
    clauses: [[['birim maliyet', 'maliyet hesapla', 'maliyeti hesapla']]],
    gate: (q) => /\d{2,}/.test(q),
  },
  {
    id: 'topUsage',
    label: 'top/pastal hesaplama',
    clauses: [
      [
        ['top', 'topu', 'topundan'],
        ['pastal', 'pastalı'],
      ],
      [['kaç pastal']],
    ],
  },
  {
    id: 'fabricEfficiency',
    label: 'kumaş/pastal verimliliği hesaplama',
    clauses: [[['verimlilik', 'verim', 'faydalanma', 'pastal verimi']]],
  },
  {
    id: 'cuttingCostHelp',
    label: 'kesim işçilik maliyeti hesaplama',
    clauses: [[['kesim maliyeti', 'işçilik maliyeti']]],
  },
  {
    id: 'warehouseMethod',
    label: 'depo yönetim yöntemi önerisi (FIFO/LIFO)',
    clauses: [
      [['depo'], ['fifo']],
      [['depo'], ['lifo']],
      [['depo'], ['hangi'], ['yöntem', 'yontem']],
    ],
  },
  {
    id: 'cuttingOrderType',
    label: 'kesim emri türü önerisi',
    clauses: [[['kesim emri'], ['nasıl', 'kaç beden']]],
  },
  {
    id: 'supplierPerformance',
    label: 'tedarikçi güvenilirlik/performans bilgisi',
    clauses: [[['güvenilir', 'güvenilirlik', 'performans']]],
  },
  {
    id: 'orderApprovalStatus',
    label: 'sipariş onay/aşama durumu',
    clauses: [[['onay', 'onaylı', 'onaylandı', 'aşama', 'hangi aşamada']]],
    gate: (q) => /\d{2,}/.test(q),
  },
  {
    id: 'approvalOverview',
    label: 'onay bekleyen / kesime hazır sipariş listesi',
    clauses: [[['kesime hazır']], [['onay'], ['bekliyor', 'bekleyen']]],
  },
  {
    id: 'completionForecast',
    label: 'sipariş tamamlanma tahmini',
    clauses: [
      [
        [
          'ne zaman biter',
          'ne zaman bitecek',
          'tahmini bitiş',
          'bitme tarihi',
          'tamamlanma tahmini',
        ],
      ],
    ],
  },
  {
    id: 'terminStatus',
    label: 'sipariş termin durumu',
    clauses: [[['termin', 'gecikme']]],
  },
  {
    id: 'productionStatus',
    label: 'sipariş üretim durumu',
    clauses: [[['durum', 'ne durumda', 'vaziyet', 'ne aşamada']]],
  },
  {
    id: 'yarnConversion',
    label: 'iplik numaralandırma birim çevrimi',
    clauses: [[['ne', 'nm', 'tex', 'denye']]],
    gate: (q) => extractYarnConversionQuery(q) !== null,
  },
  {
    // İkinci (tek gruplu) kloz, sayı bazlı tetiklemeyi (gate) kapsar; birinci
    // kloz "hesapla" kelimesi de geçtiğinde daha yüksek skorla eşleşerek bu
    // intent'in, gevşek/kelime-sırasız eşleşen 'unitCost' gibi diğer
    // intent'lerle (ör. "... maliyet ... hesapla" içeren sorularla) skor
    // çakışmasında öne çıkmasını sağlar.
    id: 'oeeCalculation',
    label: 'OEE (genel ekipman verimliliği) hesaplama',
    clauses: [
      [
        ['oee', 'genel ekipman verimliliği', 'ekipman verimliliği'],
        ['hesapla', 'hesaplama'],
      ],
      [['oee', 'genel ekipman verimliliği', 'ekipman verimliliği']],
    ],
    gate: (q) => hasCalculationTrigger(q, 6),
  },
  {
    id: 'breakEvenCalculation',
    label: 'başabaş noktası hesaplama',
    clauses: [
      [
        ['başabaş', 'basabas', 'break even', 'break-even'],
        ['hesapla', 'hesaplama'],
      ],
      [['başabaş', 'basabas', 'break even', 'break-even']],
    ],
    gate: (q) => hasCalculationTrigger(q, 3),
  },
  {
    id: 'profitMarginCalculation',
    label: 'kâr marjı / kârlılık hesaplama',
    clauses: [
      [
        ['kar marjı', 'kâr marjı', 'karlılık', 'kârlılık'],
        ['hesapla', 'hesaplama'],
      ],
      [['kar marjı', 'kâr marjı', 'karlılık', 'kârlılık']],
    ],
    gate: (q) => hasCalculationTrigger(q, 2),
  },
  {
    id: 'dyeRecipeCalculation',
    label: 'boya reçetesi / boya miktarı hesaplama',
    clauses: [
      [
        ['boya reçetesi', 'boya recetesi', 'boya miktarı'],
        ['hesapla', 'hesaplama'],
      ],
      [['boya reçetesi', 'boya recetesi', 'boya miktarı']],
    ],
    gate: (q) => hasCalculationTrigger(q, 2),
  },
  {
    id: 'leanProductionAdvice',
    label: 'yalın üretim önerisi / israf analizi',
    clauses: [
      [
        ['yalın üretim', 'yalin uretim'],
        ['öneri', 'önerisi', 'analiz', 'analizi'],
      ],
      [['israf'], ['analiz', 'analizi']],
    ],
    gate: (q) => /\d{2,}/.test(q),
  },
];

@Injectable()
export class ChatAssistantService {
  constructor(
    private prisma: PrismaService,
    private alertsService: AlertsService,
    private analyticsService: AnalyticsService,
  ) {}

  async answerQuestion(question: string, tenantId?: string): Promise<string> {
    const { intentId, clarification } = pickBestIntent(
      question,
      INTENT_DEFINITIONS,
    );

    if (clarification) {
      return clarification;
    }

    switch (intentId) {
      case 'capabilities':
        return this.answerCapabilities();

      case 'genericConsumptionRate':
        return this.answerGenericConsumptionRate(question);

      case 'fabricQuantity': {
        const lookup = await this.findOrderFromQuestion(question, tenantId);
        if (lookup.clarification) return lookup.clarification;
        return this.answerFabricQuantity(lookup.order);
      }

      case 'unitCost': {
        const lookup = await this.findOrderFromQuestion(question, tenantId);
        if (lookup.clarification) return lookup.clarification;
        return this.answerUnitCost(lookup.order);
      }

      case 'topUsage':
        return this.answerTopUsage(question);

      case 'fabricEfficiency':
        return this.answerFabricEfficiency(question);

      case 'cuttingCostHelp':
        return this.answerCuttingCostHelp();

      case 'warehouseMethod':
        return this.answerWarehouseMethod(question);

      case 'cuttingOrderType':
        return this.answerCuttingOrderType(question);

      case 'supplierPerformance':
        return this.answerSupplierPerformance(question, tenantId);

      case 'orderApprovalStatus': {
        const lookup = await this.findOrderFromQuestion(question, tenantId);
        if (lookup.clarification) return lookup.clarification;
        return this.answerOrderApprovalStatus(lookup.order);
      }

      case 'approvalOverview':
        return this.answerApprovalOverview(question, tenantId);

      case 'completionForecast': {
        const lookup = await this.findOrderFromQuestion(question, tenantId);
        if (lookup.clarification) return lookup.clarification;
        return this.answerCompletionForecast(lookup.order);
      }

      case 'terminStatus': {
        const lookup = await this.findOrderFromQuestion(question, tenantId);
        if (lookup.clarification) return lookup.clarification;
        return this.answerTerminStatus(lookup.order);
      }

      case 'productionStatus': {
        const lookup = await this.findOrderFromQuestion(question, tenantId);
        if (lookup.clarification) return lookup.clarification;
        return this.answerProductionStatus(lookup.order);
      }

      case 'yarnConversion':
        return this.answerYarnConversion(question);

      case 'oeeCalculation':
        return this.answerOEECalculation(question);

      case 'breakEvenCalculation':
        return this.answerBreakEvenCalculation(question);

      case 'profitMarginCalculation':
        return this.answerProfitMarginCalculation(question);

      case 'dyeRecipeCalculation':
        return this.answerDyeRecipeCalculation(question);

      case 'leanProductionAdvice': {
        const lookup = await this.findOrderFromQuestion(question, tenantId);
        if (lookup.clarification) return lookup.clarification;
        return this.answerLeanProductionAdvice(lookup.order);
      }

      default: {
        const libraryMatch = searchKnowledgeLibrary(question);
        if (libraryMatch) {
          return `📚 ${libraryMatch.card.baslik}\n\n${libraryMatch.card.icerik}`;
        }

        return 'Bu soruyu şu an anlayamadım. Şunları sorabilirsin: kumaş miktarı, termin durumu, üretim durumu. Tüm yeteneklerimi görmek için "neler sorabilirim?" diye sorabilirsiniz.';
      }
    }
  }

  private answerCapabilities(): string {
    return [
      'Şu konularda yardımcı olabilirim:',
      '• Kumaş ihtiyacı hesaplama — örn: "1040 için kumaş ne kadar gerekir?"',
      '• Tahmini hammadde birim maliyeti — örn: "1040 için birim maliyet hesapla"',
      '• Top/pastal hesaplama — örn: "35 metre topdan 5.1 metre pastal ile kaç pastal çıkar?"',
      '• Kumaş verimliliği / pastal verimi — örn: "12 m² şablon, 1.5 en, 10 boy ile verimlilik nedir?"',
      '• Kesim işçilik maliyeti hesaplama — örn: "kesim maliyeti nasıl hesaplanır?"',
      '• Depo yönetimi (FIFO/LIFO) önerisi — örn: "3 renk 4 beden parçalı teslimat, hangi depo yöntemi?"',
      '• Kesim emri türü önerisi — örn: "2 beden 1 renk için nasıl kesim emri açmalıyım?"',
      '• Tedarikçi güvenilirliği — örn: "ÖZEGE güvenilir mi?"',
      '• Sipariş termin durumu — örn: "1040 termin durumu nedir?"',
      '• Sipariş tamamlanma tahmini — örn: "1040 ne zaman biter?"',
      '• Sipariş üretim durumu — örn: "1040 ne durumda?"',
      '• Sipariş onay durumu — örn: "1040 onay durumu" veya "1040 hangi aşamada?"',
      '• Onay bekleyen / kesime hazır siparişler — örn: "hangi siparişler onay bekliyor?" veya "kesime hazır siparişler"',
      '• İplik numarası çevirme (Ne/Nm/Tex/Denye) — örn: "30 Ne kaç Tex eder?"',
      '• OEE (genel ekipman verimliliği) hesaplama — örn: "480 30 5 2000 2100 2000 için OEE hesapla"',
      '• Başabaş noktası hesaplama — örn: "10000 sabit gider, 15 satış fiyatı, 9 değişken gider için başabaş noktası hesapla"',
      '• Kâr marjı hesaplama — örn: "10.76 satış fiyatı, 8.97 toplam maliyet için kâr marjı hesapla"',
      '• Boya reçetesi hesaplama — örn: "50 kg kumaş, %2 owf için boya miktarı hesapla"',
      '• Yalın üretim önerisi / israf analizi — örn: "1040 için yalın üretim önerisi"',
    ].join('\n');
  }

  private async answerApprovalOverview(
    question: string,
    tenantId?: string,
  ): Promise<string> {
    const q = question.toLocaleLowerCase('tr-TR');
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { approvalStages: true },
    });

    if (q.includes('kesime hazır')) {
      const ready = orders.filter((order) =>
        order.approvalStages.some(
          (stage) =>
            stage.stageType === 'KESIM_ONAY' && stage.status === 'APPROVED',
        ),
      );
      if (ready.length === 0) {
        return 'Şu an kesime hazır sipariş yok.';
      }
      return `${ready.length} sipariş kesime hazır: ${ready
        .map((order) => `${order.orderNo} (${order.buyerName})`)
        .join(', ')}`;
    }

    const waiting = orders.filter((order) =>
      order.approvalStages.some((stage) => stage.status === 'PENDING'),
    );
    if (waiting.length === 0) {
      return 'Şu an onay bekleyen sipariş yok.';
    }
    return `${waiting.length} sipariş onay bekliyor: ${waiting
      .map((order) => `${order.orderNo} (${order.buyerName})`)
      .join(', ')}`;
  }

  private async answerOrderApprovalStatus(
    order: OrderWithMaterials | null,
  ): Promise<string> {
    if (!order) {
      return 'Hangi sipariş için sorduğunuzu anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 onay durumu").';
    }

    const stages = await this.prisma.approvalStage.findMany({
      where: { orderId: order.id },
    });
    if (stages.length === 0) {
      return `${order.orderNo} siparişi için henüz onay süreci başlatılmamış.`;
    }

    const parts = APPROVAL_STAGE_ORDER_LIST.map((stageType) => {
      const stage = stages.find((s) => s.stageType === stageType);
      const label = APPROVAL_STAGE_LABEL[stageType] ?? stageType;
      if (!stage) return `${label} ⏳ (bekliyor)`;
      if (stage.status === 'APPROVED') return `${label} ✅`;
      if (stage.status === 'REJECTED') return `${label} ❌ (reddedildi)`;
      return `${label} ⏳ (bekliyor)`;
    });

    return `${order.orderNo} siparişi: ${parts.join(', ')}`;
  }

  private answerTopUsage(question: string): string {
    const numbers = extractNumbers(question);
    if (numbers.length < 2) {
      return 'Top uzunluğu ve pastal uzunluğunu birlikte belirtir misiniz? Örn: "35 metre topdan 5.1 metre pastal ile kaç pastal çıkar?"';
    }

    const [topBoyu, pastalBoyu] = numbers;
    const result = calculateTopUsage(topBoyu, pastalBoyu);

    return `${topBoyu}m topdan ${pastalBoyu}m'lik pastal ile ${result.pastalAdedi} adet pastal çıkar (${topBoyu}/${pastalBoyu}=${(topBoyu / pastalBoyu).toFixed(2)}, tam sayıya yuvarlanır — kalan kısım kullanılamaz). ${result.kullanılanKumaş.toFixed(1)}m kumaş kullanılır, ${result.kalanMetre.toFixed(1)}m artar.`;
  }

  private answerFabricEfficiency(question: string): string {
    const numbers = extractNumbers(question);
    if (numbers.length < 3) {
      return 'Verimlilik hesaplamak için toplam şablon alanını (m²), kumaş enini (m) ve kumaş boyunu (m) belirtir misiniz? Örn: "12 m² şablon, 1.5 en, 10 boy ile pastal verimi nedir?"';
    }

    const [sablonAlani, kumasEni, kumasBoyu] = numbers;
    const result = calculateFabricEfficiency(sablonAlani, kumasEni, kumasBoyu);
    const widthTip =
      result.verimlilikYuzdesi < GOOD_EFFICIENCY_THRESHOLD
        ? ` İpucu: ${FABRIC_WIDTH_ADVICE}`
        : '';

    return `Pastal verimi %${result.verimlilikYuzdesi.toFixed(1)} (${sablonAlani}m² şablon / (${kumasEni}m × ${kumasBoyu}m kumaş) × 100). Döküntü oranı %${result.dokuntuYuzdesi.toFixed(1)}. ${result.degerlendirme}${widthTip}`;
  }

  private answerCuttingCostHelp(): string {
    return 'Kesim işçilik maliyetini iki yöntemle hesaplayabilirim: 1) Oran yöntemi — serim, pastal hazırlama, kaba/ince kesim ve masa temizleme sürelerini (dk) ve günlük işçilik ücretini paylaşın; toplamSüre/480 × günlükÜcret ile hesaplanır. 2) Formül yöntemi — masa boyu, birim kumaş gideri, kat/beden sayısı, süre bileşenleri ve ek zaman yüzdesini paylaşın; bu yöntem birim başı maliyeti de verir. Hangi yöntemle devam etmek istersiniz?';
  }

  private answerWarehouseMethod(question: string): string {
    const renkMatch = question.match(/(\d+)\s*renk/i);
    const bedenMatch = question.match(/(\d+)\s*beden/i);
    const parcaliTeslimat = /parçalı|parçali|kısmi|kismi/i.test(question);

    if (!renkMatch || !bedenMatch) {
      return 'Depo yöntemi önerebilmem için renk sayısını ve beden sayısını belirtir misiniz (teslimatın parçalı mı, tam mı olduğunu da ekleyin)? Örn: "3 renk 4 beden, parçalı teslimat, hangi depo yöntemini kullanmalıyım?"';
    }

    const renkSayisi = parseInt(renkMatch[1], 10);
    const bedenSayisi = parseInt(bedenMatch[1], 10);
    const teslimSekli: TeslimSekli = parcaliTeslimat ? 'PARCALI' : 'TAM';

    const recommendation = recommendWarehouseMethod(
      renkSayisi,
      bedenSayisi,
      teslimSekli,
    );

    return `${renkSayisi} renk, ${bedenSayisi} beden, ${teslimSekli === 'PARCALI' ? 'parçalı' : 'tam'} teslimat için önerilen yöntem: ${recommendation.yontem}. ${recommendation.aciklama}`;
  }

  private answerCuttingOrderType(question: string): string {
    const renkMatch = question.match(/(\d+)\s*renk/i);
    const bedenMatch = question.match(/(\d+)\s*beden/i);

    if (!bedenMatch) {
      return 'Kesim emri türünü önerebilmem için beden sayısını (ve varsa renk sayısını) belirtir misiniz? Örn: "2 beden 1 renk için nasıl kesim emri açmalıyım?"';
    }

    const bedenSayisi = parseInt(bedenMatch[1], 10);
    const renkSayisi = renkMatch ? parseInt(renkMatch[1], 10) : 1;

    const recommendation = recommendCuttingOrderType(bedenSayisi, renkSayisi);

    return `${bedenSayisi} beden, ${renkSayisi} renk için önerilen kesim emri türü: ${recommendation.tur}. ${recommendation.aciklama}`;
  }

  // Sipariş numarası (herhangi bir yazımda: "1040", "1040 nolu", "#1040",
  // "SIP-1040" — hepsinden yalnızca rakamlar süzülür) ya da müşteri adıyla
  // ("ZARA siparişi ne durumda") sipariş bulmaya çalışır. Müşteri adına
  // birden fazla sipariş sahipse netleştirme mesajı döner.
  private async findOrderFromQuestion(
    question: string,
    tenantId?: string,
  ): Promise<OrderLookup> {
    const numberMatches = question.match(/\d{2,}/g);
    if (numberMatches) {
      for (const num of numberMatches) {
        const order = await this.prisma.order.findFirst({
          where: {
            orderNo: { contains: num },
            ...(tenantId ? { tenantId } : {}),
          },
          include: { materials: true },
        });
        if (order) return { order, clarification: null };
      }
    }

    const allOrders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { materials: true },
    });

    const normalizedQuestion = normalizeTr(question);
    const buyerNames = [...new Set(allOrders.map((o) => o.buyerName))].filter(
      (name) => name.trim().length > 0,
    );
    // En uzun (en spesifik) müşteri adı önce denenir — kısa bir ad başka
    // bir müşteri adının alt dizesi olabilir (ör. "Zara" / "Zara Home").
    const matchedBuyer = [...buyerNames]
      .sort((a, b) => b.length - a.length)
      .find((name) => normalizedQuestion.includes(normalizeTr(name)));

    if (!matchedBuyer) {
      return { order: null, clarification: null };
    }

    const matches = allOrders
      .filter((o) => o.buyerName === matchedBuyer)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (matches.length === 1) {
      return { order: matches[0], clarification: null };
    }

    const orderNumbers = matches.map((o) => o.orderNo).join(', ');
    return {
      order: null,
      clarification: `Birden fazla ${matchedBuyer} siparişi var: ${orderNumbers}. Hangisini kastediyorsunuz?`,
    };
  }

  private answerFabricQuantity(order: OrderWithMaterials | null): string {
    if (!order) {
      return 'Hangi sipariş için sorduğunuzu anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 için kumaş ne kadar gerekir?").';
    }

    const rate = findConsumptionRate(order.productName);
    if (!rate) {
      return `${order.orderNo} siparişindeki "${order.productName}" ürünü için standart sarfiyat oranı bilgi tabanında bulunamadı.`;
    }

    const totalNeed = calculateFabricNeed(order.totalQuantity, rate.avg);

    return `${order.orderNo} siparişi (${order.productName}, ${order.totalQuantity} adet) için tahmini kumaş ihtiyacı ${totalNeed.toFixed(1)} metre. (Sarfiyat oranı: ${formatConsumptionRate(rate)} + %3 fire dahil.)`;
  }

  private answerUnitCost(order: OrderWithMaterials | null): string {
    if (!order) {
      return 'Hangi sipariş için birim maliyet hesaplamak istediğinizi anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 için birim maliyet hesapla").';
    }

    const rate = findConsumptionRate(order.productName);
    if (!rate) {
      return `${order.orderNo} siparişindeki "${order.productName}" ürünü için standart sarfiyat oranı bilgi tabanında bulunamadı, maliyet hesaplanamadı.`;
    }

    const fabricMaterials = order.materials.filter(
      (material) =>
        isFabricMaterialType(material.materialType) &&
        material.unitPrice != null,
    );

    if (fabricMaterials.length === 0) {
      return `${order.orderNo} siparişi için kumaş fiyatı girilmemiş, tahmini hammadde maliyeti hesaplanamıyor. (Sarfiyat: ${formatConsumptionRate(rate)})`;
    }

    const avgUnitPrice =
      fabricMaterials.reduce(
        (sum, material) => sum + (material.unitPrice ?? 0),
        0,
      ) / fabricMaterials.length;
    const currency = fabricMaterials[0].currency ?? 'USD';
    const fabricCost = order.totalQuantity * rate.avg * avgUnitPrice;

    return `${order.orderNo} siparişi (${order.productName}, ${order.totalQuantity} adet) için tahmini hammadde (kumaş) maliyeti: ${fabricCost.toFixed(2)} ${currency} (${order.totalQuantity} adet × ${rate.avg.toFixed(2)} m/adet sarfiyat × ${avgUnitPrice.toFixed(2)} ${currency} ortalama kumaş fiyatı). Not: Bu sadece hammadde maliyetidir; işçilik ve genel gider dahil değildir.`;
  }

  private answerGenericConsumptionRate(question: string): string {
    const productType = findProductType(question);
    if (!productType) {
      return 'Hangi ürün tipi için sorduğunuzu belirtir misiniz? (tişört, gömlek, pantolon, ceket, elbise, etek)';
    }

    const { label, rate } = productType;
    return `${label} için standart sarfiyat ${formatConsumptionRate(rate)} kullanılır.`;
  }

  private async answerSupplierPerformance(
    question: string,
    tenantId?: string,
  ): Promise<string> {
    const performance =
      await this.analyticsService.getSupplierPerformance(tenantId);
    if (performance.length === 0) {
      return 'Henüz değerlendirilecek tedarikçi verisi bulunmuyor.';
    }

    const normalizedQuestion = question.toLocaleLowerCase('tr-TR');
    const match = [...performance]
      .sort((a, b) => b.supplierName.length - a.supplierName.length)
      .find((supplier) =>
        normalizedQuestion.includes(
          supplier.supplierName.toLocaleLowerCase('tr-TR'),
        ),
      );

    if (!match) {
      return 'Hangi tedarikçiyi kastettiğinizi anlayamadım. Tedarikçi adını tam olarak belirtir misiniz? (örn: "ÖZEGE güvenilir mi?")';
    }

    const reliabilityLabel =
      match.reliabilityScore >= 80
        ? 'güvenilir'
        : match.reliabilityScore >= 50
          ? 'orta düzeyde güvenilir'
          : 'düşük güvenilirlikte';

    const lateInfo =
      match.lateCount > 0
        ? ` (ortalama ${match.avgDelayDays.toFixed(1)} gün gecikme)`
        : '';

    return `${match.supplierName} tedarikçisi ${reliabilityLabel} (%${match.reliabilityScore.toFixed(1)} güvenilirlik skoru). Toplam ${match.totalOrders} malzeme siparişinden ${match.onTimeCount} tanesi zamanında geldi, ${match.lateCount} tanesi geç geldi${lateInfo}, ${match.pendingCount} tanesi hâlâ bekliyor.`;
  }

  private answerTerminStatus(order: OrderWithMaterials | null): string {
    if (!order) {
      return 'Hangi sipariş için sorduğunuzu anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 termin durumu nedir?").';
    }

    const exfMs = dateOnlyUTC(order.shipmentDate);
    const delayedMaterials = order.materials.filter(
      (material) =>
        material.expectedArrival &&
        dateOnlyUTC(material.expectedArrival) > exfMs,
    );
    const pendingMaterials = order.materials.filter(
      (material) => material.status === 'PENDING',
    );

    if (delayedMaterials.length === 0 && pendingMaterials.length === 0) {
      return `${order.orderNo} siparişinde termin riski görünmüyor. Tüm malzemeler EXF tarihinden (${formatDateTR(order.shipmentDate)}) önce planlanmış durumda.`;
    }

    const parts: string[] = [];
    for (const material of delayedMaterials) {
      const daysLate = daysBetweenUTC(
        exfMs,
        dateOnlyUTC(material.expectedArrival as Date),
      );
      parts.push(
        `${material.materialName} malzemesi EXF'den ${daysLate} gün geç geliyor (Tedarikçi: ${material.supplierName}).`,
      );
    }
    for (const material of pendingMaterials) {
      const daysUntilExf = daysBetweenUTC(dateOnlyUTC(new Date()), exfMs);
      parts.push(
        `${material.materialName} malzemesi henüz gelmedi, EXF'ye ${daysUntilExf} gün kaldı.`,
      );
    }

    return `${order.orderNo} siparişi (EXF: ${formatDateTR(order.shipmentDate)}) için termin riski var: ${parts.join(' ')}`;
  }

  private async answerCompletionForecast(
    order: OrderWithMaterials | null,
  ): Promise<string> {
    if (!order) {
      return 'Hangi sipariş için sorduğunuzu anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 ne zaman biter?").';
    }

    const entries = await this.prisma.productionEntry.findMany({
      where: { orderId: order.id },
    });

    const forecast = computeCompletionForecast(
      entries,
      order.totalQuantity,
      order.shipmentDate,
    );

    if (!forecast.hasEnoughData) {
      return `${order.orderNo} siparişi için tahmin yapabilecek yeterli üretim verisi yok (son 7 günde üretim girişi gerekli).`;
    }

    const completionDate = formatDateTR(
      new Date(forecast.estimatedCompletionDate as string),
    );
    const exfDate = formatDateTR(order.shipmentDate);
    const statusText = forecast.willMeetDeadline
      ? 'termine yetişecek'
      : `${forecast.delayDays} gün gecikme riski var`;

    return `${order.orderNo} siparişi mevcut üretim hızıyla (günde ${forecast.dailyAverageRate} adet) tahminen ${completionDate} tarihinde bitecek. EXF tarihiniz ${exfDate} - ${statusText}.`;
  }

  private async answerProductionStatus(
    order: OrderWithMaterials | null,
  ): Promise<string> {
    if (!order) {
      return 'Hangi sipariş için sorduğunuzu anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 ne durumda?").';
    }

    const entries = await this.prisma.productionEntry.findMany({
      where: { orderId: order.id },
    });

    if (entries.length === 0) {
      return `${order.orderNo} siparişi için henüz üretim girişi yapılmamış. Sipariş durumu: ${order.status}.`;
    }

    const totalsByStage = new Map<string, number>();
    for (const entry of entries) {
      totalsByStage.set(
        entry.stage,
        (totalsByStage.get(entry.stage) ?? 0) + entry.quantity,
      );
    }

    const stageSummary = Array.from(totalsByStage.entries())
      .map(([stage, qty]) => `${stage}: ${qty} adet`)
      .join(', ');

    return `${order.orderNo} siparişi (${order.totalQuantity} adet, durum: ${order.status}) üretim özeti — ${stageSummary}.`;
  }

  private answerYarnConversion(question: string): string {
    const parsed = extractYarnConversionQuery(question);
    if (!parsed) {
      return 'İplik numarası çevirmek için değer ve birimleri belirtir misiniz? Örn: "30 Ne kaç Tex eder?" (desteklenen birimler: Ne, Nm, Tex, Denye)';
    }

    const { value, fromUnit, toUnit } = parsed;
    const result = convertYarnCount(value, fromUnit, toUnit);

    return `${value} ${YARN_UNIT_NAMES[fromUnit]} = ${result.toFixed(2)} ${YARN_UNIT_NAMES[toUnit]}.`;
  }

  private answerOEECalculation(question: string): string {
    const numbers = extractNumbers(question);
    if (numbers.length < 6) {
      return 'OEE hesaplamak için şu 6 değeri sırayla belirtir misiniz: planlanan süre (dk), duruş süresi (dk), ideal hız (adet/dk), gerçekleşen üretim (adet), toplam üretim (adet), iyi üretim (adet). Örn: "480 30 5 2000 2100 2000 için OEE hesapla"';
    }

    const [
      plannedMinutes,
      downtimeMinutes,
      idealRatePerMinute,
      actualOutput,
      totalOutput,
      goodOutput,
    ] = numbers;
    const result = calculateOEE(
      plannedMinutes,
      downtimeMinutes,
      idealRatePerMinute,
      actualOutput,
      totalOutput,
      goodOutput,
    );

    const assessment =
      result.oeePercent >= WORLD_CLASS_OEE_THRESHOLD
        ? `dünya standardı "iyi" seviyenin (%${WORLD_CLASS_OEE_THRESHOLD}) üzerinde.`
        : 'tekstilde tipik aralık olan %60-75 civarında veya altında.';

    return `OEE: %${result.oeePercent.toFixed(1)} (Kullanılabilirlik: %${result.availabilityPercent.toFixed(1)} × Performans: %${result.performancePercent.toFixed(1)} × Kalite: %${result.qualityPercent.toFixed(1)}). Bu değer ${assessment}`;
  }

  private answerBreakEvenCalculation(question: string): string {
    const numbers = extractNumbers(question);
    if (numbers.length < 3) {
      return 'Başabaş noktasını hesaplamak için şu 3 değeri sırayla belirtir misiniz: sabit giderler, birim satış fiyatı, birim değişken gider. Örn: "10000 sabit gider, 15 satış fiyatı, 9 değişken gider için başabaş noktası hesapla"';
    }

    const [fixedCosts, sellingPricePerUnit, variableCostPerUnit] = numbers;
    const result = calculateBreakEven(
      fixedCosts,
      sellingPricePerUnit,
      variableCostPerUnit,
    );

    if (!result.ok) {
      return result.message;
    }

    return `Başabaş noktası: ${result.breakEvenUnits.toFixed(1)} adet. (Sabit giderler: ${fixedCosts} / (Satış fiyatı: ${sellingPricePerUnit} − Değişken gider: ${variableCostPerUnit})). Bu adedin altında zarar, üzerinde kâr edilir.`;
  }

  private answerProfitMarginCalculation(question: string): string {
    const numbers = extractNumbers(question);
    if (numbers.length < 2) {
      return 'Kâr marjını hesaplamak için satış fiyatını ve toplam maliyeti belirtir misiniz? Örn: "10.76 satış fiyatı, 8.97 toplam maliyet için kâr marjı hesapla"';
    }

    const [sellingPrice, totalCost] = numbers;
    const result = calculateProfitMargin(sellingPrice, totalCost);

    return `Kâr: ${result.profit.toFixed(2)}, kâr marjı: %${result.marginPercent.toFixed(1)} (Satış fiyatı: ${sellingPrice} − Toplam maliyet: ${totalCost}, marj = kâr / satış fiyatı × 100).`;
  }

  private answerDyeRecipeCalculation(question: string): string {
    const numbers = extractNumbers(question);
    if (numbers.length < 2) {
      return 'Boya reçetesi hesaplamak için kumaş ağırlığını (kg) ve hedeflenen %owf oranını belirtir misiniz? Örn: "50 kg kumaş, %2 owf için boya miktarı hesapla"';
    }

    const [fabricWeightKg, dyePercentOWF] = numbers;
    const result = calculateDyeRecipe(fabricWeightKg, dyePercentOWF);

    return `${fabricWeightKg} kg kumaş için %${dyePercentOWF} owf oranında gereken boya miktarı: ${result.dyeAmountGrams.toFixed(1)} gram (${(result.dyeAmountGrams / 1000).toFixed(3)} kg).`;
  }

  private async answerLeanProductionAdvice(
    order: OrderWithMaterials | null,
  ): Promise<string> {
    if (!order) {
      return 'Hangi sipariş için yalın üretim analizi yapmamı istediğinizi anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 için yalın üretim önerisi").';
    }

    const issues: string[] = [];

    const qualityEntries = await this.prisma.qualityEntry.findMany({
      where: { orderId: order.id },
    });
    const totalChecked = qualityEntries.reduce(
      (sum, entry) => sum + entry.checkedQty,
      0,
    );
    if (totalChecked > 0) {
      const totalRejected = qualityEntries.reduce(
        (sum, entry) => sum + entry.rejected,
        0,
      );
      const totalSecondQuality = qualityEntries.reduce(
        (sum, entry) => sum + entry.secondQuality,
        0,
      );
      const rejectionRate = (totalRejected / totalChecked) * 100;
      const secondQualityRate = (totalSecondQuality / totalChecked) * 100;

      if (rejectionRate > 5) {
        issues.push(
          `⚠️ Hatalı Üretim/Fire (Defects): Kalite kontrolde fire oranı %${rejectionRate.toFixed(1)} - kabul edilebilir sınırın (%5) üzerinde.`,
        );
      }
      if (secondQualityRate > 5) {
        issues.push(
          `⚠️ Hatalı Üretim/Fire (Defects): 2. kalite oranı %${secondQualityRate.toFixed(1)} - normalin (%5) üzerinde, üretim sürecini kontrol edin.`,
        );
      }
    }

    const pendingStages = await this.prisma.approvalStage.findMany({
      where: { orderId: order.id, status: 'PENDING' },
    });
    const todayStartMs = dateOnlyUTC(new Date());
    const APPROVAL_STALLED_DAYS = 3;
    for (const stage of pendingStages) {
      const daysPending = daysBetweenUTC(
        dateOnlyUTC(stage.createdAt),
        todayStartMs,
      );
      if (daysPending > APPROVAL_STALLED_DAYS) {
        const stageLabel =
          APPROVAL_STAGE_LABEL[stage.stageType] ?? stage.stageType;
        issues.push(
          `⚠️ Bekleme (Waiting): ${stageLabel} onayı ${daysPending} gündür bekliyor - süreç tıkanmış olabilir.`,
        );
      }
    }

    const now = new Date();
    if (isWithinWorkday(now)) {
      const productionEntries = await this.prisma.productionEntry.findMany({
        where: { orderId: order.id },
      });
      const lineNames = [
        ...new Set(
          productionEntries
            .map((entry) => entry.lineNo)
            .filter((lineNo): lineNo is string => !!lineNo),
        ),
      ];

      if (lineNames.length > 0) {
        const { start, end } = todayRangeUTC();
        const lines = await this.prisma.productionLine.findMany({
          where: { name: { in: lineNames } },
        });
        const todayLineEntries = await this.prisma.productionEntry.findMany({
          where: { lineNo: { in: lineNames }, date: { gte: start, lt: end } },
        });

        for (const line of lines) {
          const entries = todayLineEntries.filter(
            (entry) => entry.lineNo === line.name,
          );
          if (entries.length === 0) continue;

          const todayProduction = entries.reduce(
            (sum, entry) => sum + entry.quantity,
            0,
          );
          const expectedProgressByNow = computeExpectedProgress(
            line.capacity,
            now,
          );
          const onPace = todayProduction >= expectedProgressByNow;

          if (!onPace) {
            issues.push(
              `⚠️ Bekleme (Waiting): ${line.name} hattı bugünkü hedefin gerisinde - beklenen ${expectedProgressByNow} adet, gerçekleşen ${todayProduction} adet.`,
            );
          }
        }
      }
    }

    const fasonShipments = await this.prisma.fasonShipment.findMany({
      where: { orderId: order.id },
    });
    for (const shipment of fasonShipments) {
      const { fireRate } = computeFasonFireStats(
        shipment.sentQuantity,
        shipment.receivedQuantity,
      );
      if (fireRate != null && fireRate > 5) {
        issues.push(
          `⚠️ Hatalı Üretim/Fire (Defects): ${shipment.subcontractorName} atölyesinden dönen fason işçilikte fire oranı %${fireRate.toFixed(1)} - kabul edilebilir sınırın (%5) üzerinde.`,
        );
      }
    }

    const body =
      issues.length > 0
        ? issues.join('\n\n')
        : '✓ Şu an belirgin bir israf tespit edilmedi.';

    return `📊 ${order.orderNo} Yalın Üretim Analizi:\n\n${body}`;
  }
}
