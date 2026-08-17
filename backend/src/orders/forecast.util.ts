import { dateOnlyUTC, daysBetweenUTC } from '../dashboard/dashboard-shared';

const STAGE_ORDER = ['CUTTING', 'SEWING', 'IRONING', 'PACKING', 'SHIPPING'];
const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 7;

export type ForecastProductionEntry = {
  stage: string;
  quantity: number;
  date: Date;
};

export type CompletionForecast = {
  hasEnoughData: boolean;
  dailyAverageRate: number | null;
  estimatedCompletionDate: string | null;
  daysRemaining: number | null;
  willMeetDeadline: boolean | null;
  delayDays: number | null;
};

const NO_FORECAST: CompletionForecast = {
  hasEnoughData: false,
  dailyAverageRate: null,
  estimatedCompletionDate: null,
  daysRemaining: null,
  willMeetDeadline: null,
  delayDays: null,
};

// En ileri (pipeline'da en son konumdaki) aşamayı bulur — o aşamadaki
// üretim hızı, siparişin bitişine en yakın darboğazı temsil eder.
function findLastStage(entries: ForecastProductionEntry[]): string | null {
  let lastStage: string | null = null;
  let lastStageIndex = -1;
  for (const entry of entries) {
    const idx = STAGE_ORDER.indexOf(entry.stage);
    if (idx > lastStageIndex) {
      lastStageIndex = idx;
      lastStage = entry.stage;
    }
  }
  return lastStage;
}

export function computeCompletionForecast(
  entries: ForecastProductionEntry[],
  totalQuantity: number,
  shipmentDate: Date,
  now: Date = new Date(),
): CompletionForecast {
  if (entries.length === 0) {
    return NO_FORECAST;
  }

  const lastStage = findLastStage(entries);
  if (!lastStage) {
    return NO_FORECAST;
  }

  const stageEntries = entries.filter((entry) => entry.stage === lastStage);
  const producedInStage = stageEntries.reduce(
    (sum, entry) => sum + entry.quantity,
    0,
  );

  const lookbackStartMs = now.getTime() - LOOKBACK_DAYS * DAY_MS;
  const recentEntries = stageEntries.filter(
    (entry) => entry.date.getTime() >= lookbackStartMs,
  );

  if (recentEntries.length === 0) {
    return NO_FORECAST;
  }

  const recentTotal = recentEntries.reduce(
    (sum, entry) => sum + entry.quantity,
    0,
  );
  const distinctDays = new Set(
    recentEntries.map((entry) => dateOnlyUTC(entry.date)),
  ).size;
  const dailyAverageRate = recentTotal / distinctDays;

  if (dailyAverageRate <= 0) {
    return NO_FORECAST;
  }

  const remainingQty = Math.max(0, totalQuantity - producedInStage);
  const daysRemaining = Math.ceil(remainingQty / dailyAverageRate);

  const todayMs = dateOnlyUTC(now);
  const estimatedCompletionMs = todayMs + daysRemaining * DAY_MS;
  const shipmentMs = dateOnlyUTC(shipmentDate);

  const willMeetDeadline = estimatedCompletionMs <= shipmentMs;
  const delayDays = willMeetDeadline
    ? 0
    : daysBetweenUTC(shipmentMs, estimatedCompletionMs);

  return {
    hasEnoughData: true,
    dailyAverageRate: Math.round(dailyAverageRate * 100) / 100,
    estimatedCompletionDate: new Date(estimatedCompletionMs).toISOString(),
    daysRemaining,
    willMeetDeadline,
    delayDays,
  };
}
