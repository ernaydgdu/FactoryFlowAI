import type { MaterialModel, OrderModel } from '../../generated/prisma/models';

export function dateOnlyUTC(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function todayRangeUTC(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function daysBetweenUTC(fromMs: number, toMs: number): number {
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}

export function formatDateTR(d: Date): string {
  return new Date(d).toLocaleDateString('tr-TR');
}

export function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(?:[.,]\d+)?/g);
  if (!matches) return [];
  return matches.map((match) => parseFloat(match.replace(',', '.')));
}

export type OrderWithMaterials = OrderModel & { materials: MaterialModel[] };

export type DashboardAlertType =
  | 'MATERIAL_DELAY'
  | 'MATERIAL_PENDING'
  | 'NO_PRODUCTION'
  | 'FIRE_RATE_HIGH'
  | 'SECOND_QUALITY_HIGH'
  | 'STOCK_CRITICAL'
  | 'APPROVAL_STALLED';

export const APPROVAL_STAGE_LABEL: Record<string, string> = {
  PP_NUMUNE: 'PP Numune',
  PASTAL_ONAY: 'Pastal Onayı',
  SARFIYAT_ONAY: 'Sarfiyat Onayı',
  KESIM_ONAY: 'Kesim Onayı',
};

export const APPROVAL_STAGE_ORDER_LIST = [
  'PP_NUMUNE',
  'PASTAL_ONAY',
  'SARFIYAT_ONAY',
  'KESIM_ONAY',
] as const;

export type DashboardAlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type DashboardAlert = {
  id: string;
  type: DashboardAlertType;
  severity: DashboardAlertSeverity;
  message: string;
  orderId?: number;
  orderNo?: string;
};

export const SEVERITY_RANK: Record<DashboardAlertSeverity, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export type QualitySummary = {
  totalChecked: number;
  totalFirstQuality: number;
  totalSecondQuality: number;
  totalRejected: number;
  secondQualityRate: number;
  rejectionRate: number;
};

export type SupplierPerformance = {
  supplierName: string;
  totalOrders: number;
  onTimeCount: number;
  lateCount: number;
  pendingCount: number;
  avgDelayDays: number;
  reliabilityScore: number;
};
