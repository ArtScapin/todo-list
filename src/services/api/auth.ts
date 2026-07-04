import { apiRequest } from './api'

type LoginCredentials = {
  username: string
  password: string
}

type LoginResponse = {
  token: string
  refreshToken: string
}

type RegisterData = {
  name: string
  username: string
  password: string
}

export function login(credentials: LoginCredentials) {
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function register(data: RegisterData) {
  return apiRequest<void>('/user', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
