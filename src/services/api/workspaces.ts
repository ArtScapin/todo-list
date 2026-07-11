import { apiRequest } from './api'

export type Workspace = {
  id: number
  name: string
  isKanbanViewMode: boolean
}

type WorkspaceData = {
  name: string
  isKanbanViewMode: boolean
}

export function getWorkspaces(signal?: AbortSignal) {
  return apiRequest<Workspace[]>('/workspace', { signal })
}

export function getWorkspace(id: number, signal?: AbortSignal) {
  return apiRequest<Workspace>(`/workspace/${id}`, { signal })
}

export function createWorkspace(data: WorkspaceData) {
  return apiRequest<Workspace>('/workspace', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateWorkspace(id: number, data: WorkspaceData) {
  return apiRequest<Workspace>(`/workspace/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteWorkspace(id: number) {
  return apiRequest<void>(`/workspace/${id}`, { method: 'DELETE' })
}
