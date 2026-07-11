import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  removeTokens,
  saveTokens,
  type TokenPair,
} from '../auth-storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
})

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

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {}
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }

  return headers
}

async function refreshSession() {
  if (refreshRequest) {
    return refreshRequest
  }

  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new ApiError('Refresh token não encontrado.', 400)
  }

  refreshRequest = apiClient
    .post<Partial<TokenPair>>('/login/refresh', { refreshToken })
    .then((response) => {
      if (response.status < 200 || response.status >= 300) {
        throw new ApiError('Não foi possível renovar a sessão.', response.status)
      }

      const tokens = response.data

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

async function sendRequest<T>(
  path: string,
  options: RequestInit | undefined,
  accessToken: string | null,
): Promise<AxiosResponse<T>> {
  const config: AxiosRequestConfig = {
    method: options?.method,
    url: path,
    data: options?.body,
    signal: options?.signal ?? undefined,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...normalizeHeaders(options?.headers),
    },
  }

  return apiClient.request<T>(config)
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const isPublicRequest = isPublicPath(path)
    let accessToken = isPublicRequest ? null : getAccessToken()

    if (!isPublicRequest && (!accessToken || isTokenExpired(accessToken))) {
      accessToken = await renewAccessToken()
    }

    let response = await sendRequest<T>(path, options, accessToken)

    if (!isPublicRequest && response.status === 401) {
      const currentAccessToken = getAccessToken()
      accessToken = currentAccessToken && currentAccessToken !== accessToken
        ? currentAccessToken
        : await renewAccessToken()
      response = await sendRequest<T>(path, options, accessToken)

      if (response.status === 401) {
        discardSession()
        throw new ApiError('Sessão inválida.', response.status)
      }
    }

    if (response.status < 200 || response.status >= 300) {
      throw new ApiError('A API recusou a requisição.', response.status)
    }

    return response.data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError('Não foi possível conectar à API.')
  }
}
