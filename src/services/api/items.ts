import { apiRequest } from './api'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type Item = {
  id: number
  name: string
  description?: string
  priority: Priority
  status: boolean
  position: number
  user_id?: number
  createdAt?: string
  updatedAt?: string
}

export function getItems(listId: number, signal?: AbortSignal) {
  return apiRequest<Item[]>(`/item/all/${listId}`, { signal })
}

export type ItemData = {
  name: string
  description?: string
  priority: Priority
  status: boolean
  position: number
}

export function createItem(listId: number, data: ItemData) {
  return apiRequest<Item>(`/item/${listId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateItem(id: number, data: ItemData) {
  return apiRequest<Item>(`/item/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function changeItemStatus(id: number) {
  return apiRequest<Item>(`/item/change-status/${id}`, { method: 'PUT' })
}

export function deleteItem(id: number) {
  return apiRequest<void>(`/item/${id}`, { method: 'DELETE' })
}

export function moveItem(id: number, listId: number, position: number) {
  return apiRequest<Item>(`/item/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ list_id: listId, position }),
  })
}
