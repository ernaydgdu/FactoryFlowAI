import type { StatusBadgeDto, StatusTone } from '@/application/core/types'
import type {
  BundleStatus,
  ExecutionContextStatus,
  OperationExecutionStatus,
  OperationWorkSessionStatus,
  QualityGateDisposition,
  WipState,
} from '@/domain/execution-platform/execution-types'

function badge(label: string, tone: StatusTone): StatusBadgeDto {
  return { label, tone }
}

export function mapBundleStatusBadge(status: BundleStatus): StatusBadgeDto {
  const map: Record<BundleStatus, StatusBadgeDto> = {
    Created: badge('Oluşturuldu', 'muted'),
    Labeled: badge('Etiketli', 'default'),
    Issued: badge('Floor', 'warning'),
    InTransit: badge('Transit', 'warning'),
    AtOperation: badge('Operasyonda', 'success'),
    OnHold: badge('Hold', 'warning'),
    Completed: badge('Tamamlandı', 'success'),
    Scrapped: badge('Hurda', 'danger'),
    Cancelled: badge('İptal', 'danger'),
    Lost: badge('Kayıp', 'danger'),
    Damaged: badge('Hasarlı', 'danger'),
  }
  return map[status]
}

export function mapOperationStatusBadge(status: OperationExecutionStatus): StatusBadgeDto {
  const map: Record<OperationExecutionStatus, StatusBadgeDto> = {
    Pending: badge('Bekliyor', 'muted'),
    Ready: badge('Hazır', 'default'),
    Waiting: badge('Waiting', 'warning'),
    InProgress: badge('Devam', 'success'),
    Paused: badge('Duraklatıldı', 'warning'),
    Completed: badge('Tamamlandı', 'success'),
    Blocked: badge('Bloklu', 'danger'),
  }
  return map[status]
}

export function mapWorkSessionStatusBadge(status: OperationWorkSessionStatus): StatusBadgeDto {
  const map: Record<OperationWorkSessionStatus, StatusBadgeDto> = {
    Scheduled: badge('Planlı', 'muted'),
    InProgress: badge('Devam', 'success'),
    Paused: badge('Duraklatıldı', 'warning'),
    Completed: badge('Tamamlandı', 'success'),
    Cancelled: badge('İptal', 'danger'),
  }
  return map[status]
}

export function mapQualityDispositionBadge(disposition: QualityGateDisposition): StatusBadgeDto {
  const map: Record<QualityGateDisposition, StatusBadgeDto> = {
    Pending: badge('Bekliyor', 'muted'),
    Pass: badge('Pass', 'success'),
    PassWithCondition: badge('Şartlı Pass', 'warning'),
    Hold: badge('Hold', 'warning'),
    Rework: badge('Rework', 'warning'),
    Reject: badge('Reject', 'danger'),
    Scrap: badge('Scrap', 'danger'),
    SecondQuality: badge('2. Kalite', 'default'),
  }
  return map[disposition]
}

export function mapWipStateBadge(state: WipState): StatusBadgeDto {
  const map: Record<WipState, StatusBadgeDto> = {
    Queued: badge('Kuyruk', 'muted'),
    InProcess: badge('İşlemde', 'success'),
    WaitingQC: badge('QC Bekliyor', 'warning'),
    Blocked: badge('Bloklu', 'danger'),
    Completed: badge('Tamamlandı', 'success'),
  }
  return map[state]
}

export function mapExecutionContextStatusBadge(status: ExecutionContextStatus): StatusBadgeDto {
  const map: Record<ExecutionContextStatus, StatusBadgeDto> = {
    NotStarted: badge('Başlamadı', 'muted'),
    Active: badge('Aktif', 'success'),
    Paused: badge('Duraklatıldı', 'warning'),
    Completed: badge('Tamamlandı', 'success'),
  }
  return map[status]
}
