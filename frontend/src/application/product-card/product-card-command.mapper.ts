import { runProductCardWriteCommand } from './product-card-permission.guard'
import {
  persistApproveProductCard,
  persistArchiveProductCard,
  persistActivateProductCard,
  persistCreateProductCard,
  persistCreateProductCardRevision,
  persistDeactivateProductCard,
  persistSubmitProductCardForReview,
  persistUpdateProductCard,
  ProductCardDomainError,
  queryAllProductCards,
  queryProductCardById,
  queryProductCardVersion,
} from '@/domain/product-card/product-card-crud.service'
import type { TextileProductCard } from '@/domain/types/textile-erp'

import type {
  CreateProductCardCommand,
  CreateRevisionCommand,
  ProductCardCommandResult,
  ProductCardLifecycleCommand,
  UpdateProductCardCommand,
} from './product-card.dto'

export { ProductCardDomainError }

function toCommandResult(card: TextileProductCard, version: number): ProductCardCommandResult {
  return {
    id: card.id,
    productCode: card.productCode,
    status: card.status,
    version,
  }
}

export function executeCreateProductCard(command: CreateProductCardCommand): ProductCardCommandResult {
  return runProductCardWriteCommand(() => {
    const saved = persistCreateProductCard(command, command.actorUserId)
    return toCommandResult(saved, 1)
  })
}

export function executeUpdateProductCard(command: UpdateProductCardCommand): ProductCardCommandResult {
  return runProductCardWriteCommand(() => {
    const saved = persistUpdateProductCard(
      command.id,
      command,
      command.expectedVersion,
      command.actorUserId,
    )
    return toCommandResult(saved, queryProductCardVersion(saved.id))
  })
}

export function executeCreateRevision(command: CreateRevisionCommand): ProductCardCommandResult {
  return runProductCardWriteCommand(() => {
    const saved = persistCreateProductCardRevision(
      command.id,
      command.reason,
      command.expectedVersion,
      command.actorUserId,
    )
    return toCommandResult(saved, queryProductCardVersion(saved.id))
  })
}

export function executeApproveProductCard(command: ProductCardLifecycleCommand): ProductCardCommandResult {
  return runProductCardWriteCommand(() => {
    const saved = persistApproveProductCard(
      command.id,
      command.expectedVersion,
      command.actorUserId,
      command.comment,
    )
    return toCommandResult(saved, queryProductCardVersion(saved.id))
  })
}

export function executeSubmitProductCardForReview(
  command: ProductCardLifecycleCommand,
): ProductCardCommandResult {
  return runProductCardWriteCommand(() => {
    const saved = persistSubmitProductCardForReview(
      command.id,
      command.expectedVersion,
      command.actorUserId,
    )
    return toCommandResult(saved, queryProductCardVersion(saved.id))
  })
}

export function executeActivateProductCard(command: ProductCardLifecycleCommand): ProductCardCommandResult {
  return runProductCardWriteCommand(() => {
    const saved = persistActivateProductCard(
      command.id,
      command.expectedVersion,
      command.actorUserId,
    )
    return toCommandResult(saved, queryProductCardVersion(saved.id))
  })
}

export function executeDeactivateProductCard(command: ProductCardLifecycleCommand): ProductCardCommandResult {
  return runProductCardWriteCommand(() => {
    const saved = persistDeactivateProductCard(
      command.id,
      command.expectedVersion,
      command.actorUserId,
      command.reason,
    )
    return toCommandResult(saved, queryProductCardVersion(saved.id))
  })
}

export function executeArchiveProductCard(command: ProductCardLifecycleCommand): ProductCardCommandResult {
  return runProductCardWriteCommand(() => {
    const saved = persistArchiveProductCard(
      command.id,
      command.expectedVersion,
      command.actorUserId,
    )
    return toCommandResult(saved, queryProductCardVersion(saved.id))
  })
}

export function queryProductCards(): TextileProductCard[] {
  return queryAllProductCards()
}

export function queryProductCard(id: string): TextileProductCard | null {
  return queryProductCardById(id)
}

export function queryProductCardAggregateVersion(id: string): number {
  return queryProductCardVersion(id)
}
