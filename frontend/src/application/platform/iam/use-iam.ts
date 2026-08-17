import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import type { CreateUserDto, LoginDto, UpdateUserDto } from './iam.dto'
import { iamApplicationService } from './iam.application-service'
import { UserAccountDomainError } from './iam.mapper'

export { UserAccountDomainError }

export function useUserList(factoryId?: string) {
  return useQuery({
    queryKey: applicationQueryKeys.iam.list(factoryId),
    queryFn: () => iamApplicationService.query.listUsers(factoryId),
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: LoginDto) => iamApplicationService.command.login(credentials),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.iam.all })
    },
  })
}

export function useCreateUserMutation(actorUserId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserDto) =>
      iamApplicationService.command.createUser(input, actorUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.iam.all })
    },
  })
}

export function useUpdateUserMutation(actorUserId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserDto }) =>
      iamApplicationService.command.updateUser(userId, input, actorUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.iam.all })
    },
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      iamApplicationService.command.changePassword(currentPassword, newPassword),
  })
}
