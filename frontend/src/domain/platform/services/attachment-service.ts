import type { Attachment, AttachmentEntityType, AttachmentFileType } from '../types'

const attachmentStore: Attachment[] = []
let counter = 0

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
  counter += 1
  const attachment: Attachment = {
    id: `att-${counter}`,
    ...input,
    uploadedAt: new Date().toISOString(),
  }
  attachmentStore.push(attachment)
  return attachment
}

export function getAttachments(entityType: AttachmentEntityType, entityId: string): Attachment[] {
  return attachmentStore.filter(
    (a) => a.entityType === entityType && a.entityId === entityId,
  )
}

export function getAttachmentsByType(
  entityType: AttachmentEntityType,
  entityId: string,
  fileType: AttachmentFileType,
): Attachment[] {
  return getAttachments(entityType, entityId).filter((a) => a.fileType === fileType)
}

export function removeAttachment(id: string): boolean {
  const idx = attachmentStore.findIndex((a) => a.id === id)
  if (idx === -1) return false
  attachmentStore.splice(idx, 1)
  return true
}

export function seedAttachments(attachments: Attachment[]): void {
  attachmentStore.length = 0
  attachmentStore.push(...attachments)
  counter = attachments.length
}

export function getAllAttachments(): Attachment[] {
  return [...attachmentStore]
}

export const PRODUCT_ATTACHMENT_TYPES: AttachmentFileType[] = [
  'Teknik Föy',
  'Ölçü Tablosu',
  'Kalıp PDF',
  'Resim',
  'Müşteri PO',
  'Test Raporu',
]
