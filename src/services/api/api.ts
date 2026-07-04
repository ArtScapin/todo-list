import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  removeTokens,
  saveTokens,
  type TokenPair,
} from '../auth-storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let refreshRequest: Promise<TokenPair> | null = null

function discardSession() {
  removeTokens()
  window.location.replace('/login')
}

function isPublicPath(path: string) {
  return path === '/login' || path === '/user'
}

async function refreshSession() {
  if (refreshRequest) {
    return refreshRequest
  }

  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new ApiError('Refresh token não encontrado.', 400)
  }

  refreshRequest = fetch(`${API_BASE_URL}/login/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiError('Não foi possível renovar a sessão.', response.status)
      }

      const tokens = (await response.json()) as Partial<TokenPair>

      if (!tokens.token || !tokens.refreshToken) {
        throw new ApiError('A API retornou tokens inválidos.', 400)
      }

      const tokenPair: TokenPair = {
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      }
      saveTokens(tokenPair)
      return tokenPair
    })
    .finally(() => {
      refreshRequest = null
    })

  return refreshRequest
}

async function renewAccessToken() {
  try {
    return (await refreshSession()).token
  } catch (error) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
      discardSession()
    }

    throw error
  }
}

async function sendRequest(path: string, options: RequestInit | undefined, accessToken: string | null) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
  })
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const isPublicRequest = isPublicPath(path)
    let accessToken = isPublicRequest ? null : getAccessToken()

    if (!isPublicRequest && (!accessToken || isTokenExpired(accessToken))) {
      accessToken = await renewAccessToken()
    }

    let response = await sendRequest(path, options, accessToken)

    if (!isPublicRequest && response.status === 401) {
      const currentAccessToken = getAccessToken()
      accessToken = currentAccessToken && currentAccessToken !== accessToken
        ? currentAccessToken
        : await renewAccessToken()
      response = await sendRequest(path, options, accessToken)

      if (response.status === 401) {
        discardSession()
        throw new ApiError('Sessão inválida.', response.status)
      }
    }

    if (!response.ok) {
      throw new ApiError('A API recusou a requisição.', response.status)
    }

    const content = await response.text()
    return content ? (JSON.parse(content) as T) : (undefined as T)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError('Não foi possível conectar à API.')
  }
}
