// Mesai saatleri varsayımı — gerçek fabrika vardiya takvimi bağlanana
// kadar sabit tutulur.
export const WORKDAY_START_HOUR = 8;
export const WORKDAY_END_HOUR = 18;
const WORKDAY_TOTAL_HOURS = WORKDAY_END_HOUR - WORKDAY_START_HOUR;

// Şu ana kadar üretilmiş olması beklenen miktarı, mesai içindeki geçen
// süre oranına göre hesaplar (mesai öncesi 0, mesai sonrası tam kapasite).
export function computeExpectedProgress(capacity: number, now: Date): number {
  const elapsedHours =
    now.getHours() + now.getMinutes() / 60 - WORKDAY_START_HOUR;

  if (elapsedHours <= 0) return 0;
  if (elapsedHours >= WORKDAY_TOTAL_HOURS) return capacity;

  return Math.round((elapsedHours / WORKDAY_TOTAL_HOURS) * capacity);
}

export function isWithinWorkday(now: Date): boolean {
  const hour = now.getHours();
  return hour >= WORKDAY_START_HOUR && hour < WORKDAY_END_HOUR;
}
