import { apiRequest } from './api'

export type User = {
  id: number
  username: string
  name: string
  permission: 'USER' | 'ADM'
}

export function getCurrentUser(signal?: AbortSignal) {
  return apiRequest<User>('/user/me', { signal })
}
