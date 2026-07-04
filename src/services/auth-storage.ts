const ACCESS_TOKEN_KEY = 'todo-list:access-token'
const REFRESH_TOKEN_KEY = 'todo-list:refresh-token'
const LEGACY_TOKEN_KEY = 'todo-list:token'

export type TokenPair = {
  token: string
  refreshToken: string
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function hasStoredSession() {
  return Boolean(getAccessToken() || getRefreshToken())
}

export function saveTokens({ token, refreshToken }: TokenPair) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export function removeTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export function isTokenExpired(token: string) {
  try {
    const payloadPart = token.split('.')[1]

    if (!payloadPart) {
      return true
    }

    const normalizedPayload = payloadPart
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, '=')
    const payload = JSON.parse(atob(normalizedPayload)) as { exp?: number }

    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}
