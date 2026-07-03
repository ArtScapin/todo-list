const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

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
