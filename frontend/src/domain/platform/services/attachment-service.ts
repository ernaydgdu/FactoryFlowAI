import { attachmentsRepo, DEFAULT_TENANT_ID } from '../platform-persistence-access'
import type { Attachment, AttachmentEntityType, AttachmentFileType } from '../types'

export type AddAttachmentInput = {
  entityType: AttachmentEntityType
  entityId: string
  fileName: string
  fileType: AttachmentFileType
  mimeType: string
  sizeKb: number
  uploadedBy: string
  description?: string
}

export function addAttachment(input: AddAttachmentInput): Attachment {
  const repo = attachmentsRepo()
  const counter = repo.nextCounter(DEFAULT_TENANT_ID)
  const attachment: Attachment = {
    id: `att-${counter}`,
    ...input,
    uploadedAt: new Date().toISOString(),
  }
  repo.save(DEFAULT_TENANT_ID, attachment)
  return attachment
}

export function getAttachments(entityType: AttachmentEntityType, entityId: string): Attachment[] {
  return attachmentsRepo().findByEntity(DEFAULT_TENANT_ID, entityType, entityId)
}

export function getAttachmentsByType(
  entityType: AttachmentEntityType,
  entityId: string,
  fileType: AttachmentFileType,
): Attachment[] {
  return getAttachments(entityType, entityId).filter((a) => a.fileType === fileType)
}

export function removeAttachment(id: string): boolean {
  return attachmentsRepo().remove(DEFAULT_TENANT_ID, id)
}

export function seedAttachments(attachments: Attachment[]): void {
  const repo = attachmentsRepo()
  repo.seedFromLegacy(DEFAULT_TENANT_ID, attachments)
  repo.setCounter(DEFAULT_TENANT_ID, attachments.length)
}

export function getAllAttachments(): Attachment[] {
  return attachmentsRepo().findAll(DEFAULT_TENANT_ID)
}

export const PRODUCT_ATTACHMENT_TYPES: AttachmentFileType[] = [
  'Teknik Föy',
  'Ölçü Tablosu',
  'Kalıp PDF',
  'Resim',
  'Müşteri PO',
  'Test Raporu',
]
