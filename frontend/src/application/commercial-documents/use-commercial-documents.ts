import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'

import { commercialDocumentsApplicationService } from './commercial-documents.application-service'
import type {
  AttachDocumentCommand,
  CreateExportDocumentSetCommand,
  DocumentSetIdCommand,
  ReviseDocumentSetCommand,
  TransitionDocumentSetCommand,
} from './commercial-documents.dto'
import { CommercialDocumentsDomainError } from './commercial-documents-command.mapper'

export { CommercialDocumentsDomainError }

function invalidate(qc: ReturnType<typeof useQueryClient>, documentSetId?: string) {
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.commercialDocuments.dashboard() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.commercialDocuments.invoices() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.commercialDocuments.sets() })
  void qc.invalidateQueries({ queryKey: applicationQueryKeys.commercialDocuments.brain() })
  if (documentSetId) {
    void qc.invalidateQueries({
      queryKey: applicationQueryKeys.commercialDocuments.detail(documentSetId),
    })
    void qc.invalidateQueries({
      queryKey: applicationQueryKeys.commercialDocuments.aiValidation(documentSetId),
    })
  }
}

export function useCommercialDocumentsDashboard() {
  return useQuery({
    queryKey: applicationQueryKeys.commercialDocuments.dashboard(),
    queryFn: () => commercialDocumentsApplicationService.query.dashboard(),
  })
}

export function useCommercialInvoices() {
  return useQuery({
    queryKey: applicationQueryKeys.commercialDocuments.invoices(),
    queryFn: () => commercialDocumentsApplicationService.query.invoices(),
  })
}

export function useExportDocumentSetDetail(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.commercialDocuments.detail(id),
    queryFn: () => commercialDocumentsApplicationService.query.detail(id),
    enabled: !!id,
  })
}

export function useCommercialDocumentsAiValidation(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.commercialDocuments.aiValidation(id),
    queryFn: () => commercialDocumentsApplicationService.query.aiValidation(id),
    enabled: !!id,
  })
}

export function useCreateExportDocumentSetMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: CreateExportDocumentSetCommand) =>
      commercialDocumentsApplicationService.command.create(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useTransitionDocumentSetMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: TransitionDocumentSetCommand) =>
      commercialDocumentsApplicationService.command.transition(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useAttachDocumentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: AttachDocumentCommand) =>
      commercialDocumentsApplicationService.command.attach(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useReviseDocumentSetMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: ReviseDocumentSetCommand) =>
      commercialDocumentsApplicationService.command.revise(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function useValidateDocumentSetMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: DocumentSetIdCommand) =>
      commercialDocumentsApplicationService.command.validate(c),
    onSuccess: (s) => invalidate(qc, s.id),
  })
}

export function newCommercialDocumentsIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
