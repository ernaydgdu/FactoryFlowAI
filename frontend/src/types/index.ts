// Shared application types

export type UserSession = {
  userId: string
  email: string
  displayName: string
  organizationId: string
  roles: string[]
  factoryIds: string[]
}
