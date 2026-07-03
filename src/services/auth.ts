import { apiRequest } from './api'

const TOKEN_KEY = 'todo-list:token'

type LoginCredentials = {
  username: string
  password: string
}

type LoginResponse = {
  token?: string
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

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}
