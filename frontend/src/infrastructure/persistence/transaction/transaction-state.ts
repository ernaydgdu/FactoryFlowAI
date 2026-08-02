let transactionDepth = 0

export function isTransactionActive(): boolean {
  return transactionDepth > 0
}

export function incrementTransactionDepth(): number {
  transactionDepth += 1
  return transactionDepth
}

export function decrementTransactionDepth(): number {
  transactionDepth -= 1
  return transactionDepth
}

export function getTransactionDepth(): number {
  return transactionDepth
}

export function resetTransactionStateForTests(): void {
  transactionDepth = 0
}
