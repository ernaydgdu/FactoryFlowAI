export class UserAccountDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserAccountDomainError'
  }
}
