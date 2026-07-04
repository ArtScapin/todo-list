import { apiRequest } from './api'

export type User = {
  id: number
  username: string
  name: string
  permission: 'USER' | 'ADM'
}

let currentUser: User | null = null
let currentUserRequest: Promise<User> | null = null
let cacheGeneration = 0

export function getCurrentUser() {
  if (currentUser) {
    return Promise.resolve(currentUser)
  }

  if (!currentUserRequest) {
    const requestGeneration = cacheGeneration
    currentUserRequest = apiRequest<User>('/user/me')
      .then((user) => {
        if (requestGeneration === cacheGeneration) {
          currentUser = user
        }
        return user
      })
      .finally(() => {
        currentUserRequest = null
      })
  }

  return currentUserRequest
}

export function clearCurrentUserCache() {
  cacheGeneration += 1
  currentUser = null
  currentUserRequest = null
}
