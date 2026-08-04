/**
 * Constraint Engine — plan üzerindeki kısıt ihlallerini değerlendirir.
 * Danışman (advisory) niteliktedir: ihlalleri raporlar, planı değiştirmez.
 */
import type { ProductionOrderLifecycleRecord } from '@/domain/production-order/lifecycle-types'

import type { ConstraintViolation, ScheduledOrder, WorkCenterLoadBucket } from './planning.types'

export function evaluateConstraints(input: {
  entries: ScheduledOrder[]
  buckets: WorkCenterLoadBucket[]
  records: ProductionOrderLifecycleRecord[]
}): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []
  let seq = 0
  const nextId = () => `cv-${(seq += 1)}`

  for (const bucket of input.buckets) {
    if (bucket.overloaded) {
      violations.push({
        id: nextId(),
        type: 'CAPACITY_OVERLOAD',
        severity: 'error',
        lineCode: bucket.lineCode,
        date: bucket.date,
        message: `${bucket.lineCode} hattı ${bucket.date} günü kapasite üstünde: ${bucket.loadQty} / ${bucket.capacityQty}`,
      })
    }
  }

  for (const entry of input.entries) {
    if (entry.scheduledFinish && entry.scheduledFinish > entry.requestedFinish) {
      violations.push({
        id: nextId(),
        type: 'TERMIN_RISK',
        severity: 'warning',
        productionOrderNo: entry.productionOrderNo,
        lineCode: entry.lineCode,
        date: entry.scheduledFinish,
        message: `${entry.productionOrderNo} termin riski: plan bitişi ${entry.scheduledFinish}, termin ${entry.requestedFinish}`,
      })
    }
  }

  for (const record of input.records) {
    const plannedStart = record.snapshots.planning.plannedStart
    if (plannedStart && record.plannedFinish && plannedStart > record.plannedFinish) {
      violations.push({
        id: nextId(),
        type: 'PRECEDENCE',
        severity: 'error',
        productionOrderNo: record.productionOrderNo,
        message: `${record.productionOrderNo} tarih tutarsızlığı: başlangıç (${plannedStart}) bitişten (${record.plannedFinish}) sonra`,
      })
    }
    if ((record.status === 'Released' || record.status === 'In Production') && !record.reservationApplied) {
      violations.push({
        id: nextId(),
        type: 'MATERIAL_SHORTAGE',
        severity: 'warning',
        productionOrderNo: record.productionOrderNo,
        message: `${record.productionOrderNo} için malzeme rezervasyonu uygulanmamış (BR-03)`,
      })
    }
  }

  return violations
}
