import {
  commandCreateUser,
  commandLogin,
  commandUpdateUser,
  queryCurrentUser,
  queryUserList,
} from './iam.mapper'

export const iamApplicationService = {
  query: {
    getCurrentUser: queryCurrentUser,
    listUsers: queryUserList,
  },
  command: {
    login: commandLogin,
    createUser: commandCreateUser,
    updateUser: commandUpdateUser,
  },
}
