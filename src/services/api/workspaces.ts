import { apiRequest } from './api'

export type Workspace = {
  id: number
  name: string
}

export function getWorkspaces(signal?: AbortSignal) {
  return apiRequest<Workspace[]>('/workspace', { signal })
}

export function createWorkspace(name: string) {
  return apiRequest<Workspace>('/workspace', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}
