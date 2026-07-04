import { apiRequest } from './api'

export type Workspace = {
  id: number
  name: string
}

export function getWorkspaces(signal?: AbortSignal) {
  return apiRequest<Workspace[]>('/workspace', { signal })
}

export function getWorkspace(id: number, signal?: AbortSignal) {
  return apiRequest<Workspace>(`/workspace/${id}`, { signal })
}

export function createWorkspace(name: string) {
  return apiRequest<Workspace>('/workspace', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function updateWorkspace(id: number, name: string) {
  return apiRequest<Workspace>(`/workspace/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}
