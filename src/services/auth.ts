import { apiRequest } from './api'

const TOKEN_KEY = 'todo-list:token'

type LoginCredentials = {
  username: string
  password: string
}

type LoginResponse = {
  token?: string
}

export function login(credentials: LoginCredentials) {
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
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
