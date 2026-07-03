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

type CreateListData = {
  name: string
  color: string
  status: boolean
  position: number
}

export function createList(workspaceId: number, data: CreateListData) {
  return apiRequest<KanbanList>(`/list/${workspaceId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
