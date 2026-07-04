import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/AuthenticatedLayout'
import { ConfirmModal } from '../components/ConfirmModal'
import { ItemModal } from '../components/ItemModal'
import { ApiError } from '../services/api/api'
import {
  changeItemStatus,
  createItem,
  deleteItem,
  getItems,
  updateItem,
  type Item,
  type Priority,
} from '../services/api/items'
import { getList, updateList, type KanbanList } from '../services/api/lists'
import { getWorkspace, type Workspace } from '../services/api/workspaces'
import '../styles/items.css'

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export function ItemsPage() {
  const { workspaceId, listId } = useParams()
  const parsedWorkspaceId = Number(workspaceId)
  const parsedListId = Number(listId)
  const hasValidIds = Number.isInteger(parsedWorkspaceId)
    && parsedWorkspaceId > 0
    && Number.isInteger(parsedListId)
    && parsedListId > 0
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [list, setList] = useState<KanbanList | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyItemIds, setBusyItemIds] = useState<Set<number>>(new Set())
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [isEditingListName, setIsEditingListName] = useState(false)
  const [listName, setListName] = useState('')
  const [isSavingListName, setIsSavingListName] = useState(false)
  const [listNameError, setListNameError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasValidIds) {
      return
    }

    const controller = new AbortController()

    async function loadPage() {
      try {
        const [workspaceData, listData, itemsData] = await Promise.all([
          getWorkspace(parsedWorkspaceId, controller.signal),
          getList(parsedListId, controller.signal),
          getItems(parsedListId, controller.signal),
        ])
        setWorkspace(workspaceData)
        setList(listData)
        setListName(listData.name)
        setItems(itemsData.sort((first, second) => first.position - second.position))
      } catch {
        if (!controller.signal.aborted) {
          setLoadError('Não foi possível carregar esta lista.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadPage()
    return () => controller.abort()
  }, [hasValidIds, parsedListId, parsedWorkspaceId])

  const filteredItems = items.filter((item) => {
    const search = searchValue.trim().toLocaleLowerCase()
    return item.name.toLocaleLowerCase().includes(search)
      || item.description?.toLocaleLowerCase().includes(search)
  })
  const pendingItemsCount = items.filter((item) => !item.status).length
  const pageError = hasValidIds ? loadError : 'Lista inválida.'

  function closeModal() {
    setIsModalOpen(false)
    setEditingItem(null)
    setSaveError(null)
  }

  function openCreateModal() {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  function openEditModal(item: Item) {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  async function handleSaveItem(data: {
    name: string
    description: string
    priority: Priority
  }) {
    setIsSaving(true)
    setSaveError(null)

    try {
      if (editingItem) {
        const updatedItem = await updateItem(editingItem.id, {
          ...data,
          status: editingItem.status,
          position: editingItem.position,
        })
        setItems((current) => current.map((item) => (
          item.id === updatedItem.id ? updatedItem : item
        )))
      } else {
        const nextPosition = items.length === 0
          ? 0
          : Math.max(...items.map((item) => item.position)) + 1
        const createdItem = await createItem(parsedListId, {
          ...data,
          status: false,
          position: nextPosition,
        })
        setItems((current) => [...current, createdItem])
      }

      closeModal()
    } catch (error) {
      const hasApiResponse = error instanceof ApiError && error.status !== undefined
      setSaveError(
        hasApiResponse
          ? 'Não foi possível salvar o item. Verifique os dados informados.'
          : 'Não conseguimos conectar à API. Tente novamente em instantes.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleChangeStatus(item: Item) {
    setActionError(null)
    setBusyItemIds((current) => new Set(current).add(item.id))

    try {
      await changeItemStatus(item.id)
      setItems((current) => current.map((currentItem) => (
        currentItem.id === item.id
          ? { ...currentItem, status: !currentItem.status }
          : currentItem
      )))
    } catch {
      setActionError('Não foi possível alterar o estado do item.')
    } finally {
      setBusyItemIds((current) => {
        const next = new Set(current)
        next.delete(item.id)
        return next
      })
    }
  }

  async function handleDeleteItem(item: Item) {
    setActionError(null)
    setBusyItemIds((current) => new Set(current).add(item.id))

    try {
      await deleteItem(item.id)
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
      setItemToDelete(null)
    } catch {
      setActionError('Não foi possível excluir o item.')
    } finally {
      setBusyItemIds((current) => {
        const next = new Set(current)
        next.delete(item.id)
        return next
      })
    }
  }

  async function handleListNameSave() {
    if (!list || isSavingListName) return

    const normalizedName = listName.trim()

    if (!normalizedName || normalizedName === list.name) {
      setListName(list.name)
      setIsEditingListName(false)
      return
    }

    setIsSavingListName(true)
    setListNameError(null)

    try {
      const updatedList = await updateList(list.id, {
        name: normalizedName,
        color: list.color ?? '#2563eb',
        status: list.status,
        position: list.position,
      })
      setList(updatedList)
      setListName(updatedList.name)
    } catch {
      setListName(list.name)
      setListNameError('Não foi possível atualizar o nome da lista.')
    } finally {
      setIsSavingListName(false)
      setIsEditingListName(false)
    }
  }

  return (
    <AuthenticatedLayout
      searchValue={searchValue}
      searchLabel="Buscar itens"
      searchPlaceholder="Buscar item..."
      onSearchChange={setSearchValue}
    >
      <main className="workspaces-content">
        <div className="item-page-heading">
          <div className="item-heading-context">
            <span
              className="list-color-accent"
              style={{ backgroundColor: list?.color || '#2563eb' }}
              aria-hidden="true"
            />
            <Link className="list-back" to={`/workspaces/${parsedWorkspaceId}/lists`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {workspace?.name ?? 'Listas'}
            </Link>
            {isEditingListName ? (
              <input
                className="list-title-input"
                value={listName}
                onChange={(event) => setListName(event.target.value)}
                onBlur={() => void handleListNameSave()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                }}
                aria-label="Nome da lista"
                disabled={isSavingListName}
                autoFocus
              />
            ) : (
              <button
                className="list-title"
                type="button"
                disabled={!list}
                onClick={() => setIsEditingListName(true)}
              >
                <h1>{list?.name ?? 'Lista'}</h1>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </button>
            )}
            <p>
              {pendingItemsCount} {pendingItemsCount === 1 ? 'item pendente' : 'itens pendentes'}
            </p>
            {listNameError ? <span className="list-name-error" role="alert">{listNameError}</span> : null}
          </div>
          <button className="primary-button" type="button" disabled={!list} onClick={openCreateModal}>
            + Novo item
          </button>
        </div>

        {isLoading && hasValidIds ? <div className="state-card">Carregando itens...</div> : null}

        {(!isLoading || !hasValidIds) && pageError ? (
          <div className="state-card error-state"><p>{pageError}</p></div>
        ) : null}

        {actionError ? <div className="inline-error" role="alert">{actionError}</div> : null}

        {!isLoading && !pageError && items.length === 0 ? (
          <div className="state-card empty-state">
            <h2>Nenhum item ainda</h2>
            <p>Adicione o primeiro item desta lista.</p>
          </div>
        ) : null}

        {!isLoading && !pageError && items.length > 0 && filteredItems.length === 0 ? (
          <div className="state-card empty-state">
            <h2>Nenhum resultado</h2>
            <p>Não encontramos um item com esse texto.</p>
          </div>
        ) : null}

        {!isLoading && !pageError && filteredItems.length > 0 ? (
          <section className="todo-list" aria-label="Itens da lista">
            {filteredItems.map((item) => {
              const isBusy = busyItemIds.has(item.id)

              return (
                <article className={`todo-item ${item.status ? 'completed' : ''}`} key={item.id}>
                  <button
                    className="status-button"
                    type="button"
                    aria-label={item.status ? `Reabrir ${item.name}` : `Concluir ${item.name}`}
                    disabled={isBusy}
                    onClick={() => void handleChangeStatus(item)}
                  >
                    {item.status ? '✓' : ''}
                  </button>
                  <div className="todo-item-content">
                    <h2>{item.name}</h2>
                    {item.description ? <p>{item.description}</p> : null}
                    <span className={`priority priority-${item.priority.toLocaleLowerCase()}`}>
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                  </div>
                  <div className="todo-item-actions">
                    <button
                      type="button"
                      aria-label={`Editar ${item.name}`}
                      title="Editar"
                      disabled={isBusy}
                      onClick={() => openEditModal(item)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      className="delete-action"
                      type="button"
                      aria-label={`Excluir ${item.name}`}
                      title="Excluir"
                      disabled={isBusy}
                      onClick={() => setItemToDelete(item)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
                      </svg>
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        ) : null}
      </main>

      {isModalOpen ? (
        <ItemModal
          item={editingItem}
          isSaving={isSaving}
          errorMessage={saveError}
          onClose={closeModal}
          onSubmit={handleSaveItem}
        />
      ) : null}

      {itemToDelete ? (
        <ConfirmModal
          title="Excluir item"
          message={`Tem certeza que deseja excluir “${itemToDelete.name}”? Esta ação não pode ser desfeita.`}
          isConfirming={busyItemIds.has(itemToDelete.id)}
          onCancel={() => setItemToDelete(null)}
          onConfirm={() => void handleDeleteItem(itemToDelete)}
        />
      ) : null}
    </AuthenticatedLayout>
  )
}
