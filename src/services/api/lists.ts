import { apiRequest } from './api'

export type KanbanList = {
  id: number
  name: string
  status: boolean
  position: number
  color?: string
}

export function getLists(workspaceId: number, signal?: AbortSignal) {
  return apiRequest<KanbanList[]>(`/list/all/${workspaceId}`, { signal })
}

export function getList(id: number, signal?: AbortSignal) {
  return apiRequest<KanbanList>(`/list/${id}`, { signal })
}

type ListData = {
  name: string
  color: string
  status: boolean
  position: number
}

export function createList(workspaceId: number, data: ListData) {
  return apiRequest<KanbanList>(`/list/${workspaceId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateList(id: number, data: ListData) {
  return apiRequest<KanbanList>(`/list/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteList(id: number) {
  return apiRequest<void>(`/list/${id}`, { method: 'DELETE' })
}
