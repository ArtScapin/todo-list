import { useEffect, useState } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { Link, useParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/AuthenticatedLayout'
import { ItemDetailsModal } from '../components/ItemDetailsModal'
import { ItemModal } from '../components/ItemModal'
import { KanbanSettingsModal } from '../components/KanbanSettingsModal'
import { PageLoader } from '../components/PageLoader'
import { createItem, deleteItem, getItems, moveItem, updateItem, type Item, type Priority } from '../services/api/items'
import { createList, getLists, updateList, type KanbanList } from '../services/api/lists'
import { getWorkspace, type Workspace } from '../services/api/workspaces'
import '../styles/board.css'

type BoardColumn = KanbanList & {
  items: Item[]
  hasError?: boolean
}

function withKanbanItemStatuses(columns: BoardColumn[]) {
  const lastColumnId = [...columns].sort((first, second) => first.position - second.position).at(-1)?.id

  return columns.map((column) => ({
    ...column,
    items: column.items.map((item) => ({
      ...item,
      status: column.id === lastColumnId,
    })),
  }))
}

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export function WorkspaceBoardPage() {
  const { workspaceId } = useParams()
  const parsedWorkspaceId = Number(workspaceId)
  const isValidWorkspaceId = Number.isInteger(parsedWorkspaceId) && parsedWorkspaceId > 0
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [columns, setColumns] = useState<BoardColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [itemListId, setItemListId] = useState<number | null>(null)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [itemError, setItemError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const selectedItemColumn = selectedItem
    ? columns.find((column) => column.items.some((item) => item.id === selectedItem.id))
    : undefined

  useEffect(() => {
    if (!isValidWorkspaceId) return
    const controller = new AbortController()

    async function loadBoard() {
      try {
        const [workspaceData, listsData] = await Promise.all([
          getWorkspace(parsedWorkspaceId, controller.signal),
          getLists(parsedWorkspaceId, controller.signal),
        ])
        const sortedLists = [...listsData].sort((first, second) => first.position - second.position)
        const itemResults = await Promise.allSettled(
          sortedLists.map((list) => getItems(list.id, controller.signal)),
        )
        const boardColumns = sortedLists.map((list, index) => {
          const result = itemResults[index]
          return {
            ...list,
            items: result.status === 'fulfilled'
              ? [...result.value].sort((first, second) => first.position - second.position)
              : [],
            hasError: result.status === 'rejected',
          }
        })

        setWorkspace(workspaceData)
        setColumns(withKanbanItemStatuses(boardColumns))
      } catch {
        if (!controller.signal.aborted) {
          setErrorMessage('NÃ£o foi possÃ­vel carregar o quadro Kanban.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadBoard()
    return () => controller.abort()
  }, [isValidWorkspaceId, parsedWorkspaceId])

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return

    const sourceListId = Number(result.source.droppableId)
    const destinationListId = Number(result.destination.droppableId)

    if (
      sourceListId === destinationListId
      && result.source.index === result.destination.index
    ) return

    const previousColumns = columns
    const nextColumns = columns.map((column) => ({ ...column, items: [...column.items] }))
    const sourceColumn = nextColumns.find((column) => column.id === sourceListId)
    const destinationColumn = nextColumns.find((column) => column.id === destinationListId)

    if (!sourceColumn || !destinationColumn) return

    const [movedItem] = sourceColumn.items.splice(result.source.index, 1)
    if (!movedItem) return

    destinationColumn.items.splice(result.destination.index, 0, movedItem)
    sourceColumn.items = sourceColumn.items.map((item, position) => ({ ...item, position }))
    destinationColumn.items = destinationColumn.items.map((item, position) => ({ ...item, position }))
    setColumns(withKanbanItemStatuses(nextColumns))
    setMoveError(null)

    try {
      const updatedMovedItem = await moveItem(movedItem.id, destinationListId, result.destination.index)
      setColumns((current) => withKanbanItemStatuses(current.map((column) => ({
        ...column,
        items: column.items.map((item) => (
          item.id === updatedMovedItem.id ? updatedMovedItem : item
        )),
      }))))
    } catch {
      setColumns(previousColumns)
      setMoveError('Não foi possível mover o card. A alteração foi desfeita.')
    }
  }

  async function handleCreateColumn(name: string) {
    setIsSavingSettings(true)
    setSettingsError(null)

    try {
      const position = columns.length
      const column = await createList(parsedWorkspaceId, {
        name,
        color: '#2563eb',
        status: false,
        position,
      })
      setColumns((current) => withKanbanItemStatuses([...current, { ...column, items: [] }]))
    } catch {
      setSettingsError('NÃ£o foi possÃ­vel adicionar a coluna.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function handleUpdateColumn(column: KanbanList, name: string, color: string) {
    setIsSavingSettings(true)
    setSettingsError(null)

    try {
      const updatedColumn = await updateList(column.id, {
        name,
        color,
        status: column.status,
        position: column.position,
      })
      setColumns((current) => withKanbanItemStatuses(current.map((currentColumn) => (
        currentColumn.id === column.id
          ? { ...currentColumn, ...updatedColumn }
          : currentColumn
      ))))
    } catch {
      setSettingsError('NÃ£o foi possÃ­vel atualizar a coluna.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function handleReorderColumns(reorderedColumns: KanbanList[]) {
    const previousColumns = columns
    const nextColumns = reorderedColumns.map((column, position) => ({
      ...columns.find((current) => current.id === column.id)!,
      position,
    }))
    setColumns(withKanbanItemStatuses(nextColumns))
    setIsSavingSettings(true)
    setSettingsError(null)

    try {
      await Promise.all(nextColumns.map((column) => updateList(column.id, {
        name: column.name,
        color: column.color || '#2563eb',
        status: column.status,
        position: column.position,
      })))
    } catch {
      setColumns(previousColumns)
      setSettingsError('NÃ£o foi possÃ­vel salvar a nova ordem.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function handleCreateItem(data: {
    name: string
    description: string
    priority: Priority
  }) {
    if (itemListId === null) return
    const column = columns.find((current) => current.id === itemListId)
    if (!column) return
    setIsSavingItem(true)
    setItemError(null)

    try {
      const item = await createItem(itemListId, {
        ...data,
        status: false,
        position: column.items.length,
      })
      setColumns((current) => withKanbanItemStatuses(current.map((currentColumn) => (
        currentColumn.id === itemListId
          ? { ...currentColumn, items: [...currentColumn.items, item] }
          : currentColumn
      ))))
      setItemListId(null)
    } catch {
      setItemError('NÃ£o foi possÃ­vel adicionar o item.')
    } finally {
      setIsSavingItem(false)
    }
  }

  async function handleUpdateItem(data: {
    name: string
    description: string
    priority: Priority
  }) {
    if (!selectedItem) return

    setIsSavingItem(true)
    setItemError(null)

    try {
      const updatedItem = await updateItem(selectedItem.id, {
        name: data.name,
        description: data.description,
        priority: data.priority,
        status: selectedItem.status,
        position: selectedItem.position,
      })
      setColumns((current) => withKanbanItemStatuses(current.map((column) => ({
        ...column,
        items: column.items.map((item) => (
          item.id === updatedItem.id ? updatedItem : item
        )),
      }))))
      setSelectedItem(updatedItem)
    } catch {
      setItemError('Não foi possível salvar as alterações do item.')
      throw new Error('Não foi possível salvar as alterações do item.')
    } finally {
      setIsSavingItem(false)
    }
  }

  async function handleDeleteSelectedItem() {
    if (!selectedItem) return

    setIsSavingItem(true)
    setItemError(null)

    try {
      await deleteItem(selectedItem.id)
      setColumns((current) => withKanbanItemStatuses(current.map((column) => ({
        ...column,
        items: column.items.filter((item) => item.id !== selectedItem.id),
      }))))
      setSelectedItem(null)
    } catch {
      setItemError('Não foi possível apagar o item.')
    } finally {
      setIsSavingItem(false)
    }
  }

  if (isLoading && isValidWorkspaceId) {
    return (
      <AuthenticatedLayout>
        <PageLoader label="Carregando quadro..." />
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <main className="board-page">
        <header className="board-heading">
          <div>
            <Link className="workspace-back" to="/workspaces">Workspace</Link>
            <h1>{workspace?.name ?? 'Quadro Kanban'}</h1>
            <p>Arraste os cards para organizar o fluxo de trabalho.</p>
          </div>
          <button
            className="board-settings-button"
            type="button"
            aria-label="Configurar colunas"
            title="Configurar colunas"
            onClick={() => setIsSettingsOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.55 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.55a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.45 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.12.37.33.71.6 1 .3.28.7.43 1.1.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
            </svg>
          </button>
        </header>

        {(!isValidWorkspaceId || errorMessage) ? (
          <div className="state-card error-state">
            <p>{errorMessage ?? 'Workspace invÃ¡lido.'}</p>
          </div>
        ) : null}

        {moveError ? <div className="inline-error" role="alert">{moveError}</div> : null}

        {!errorMessage && columns.length === 0 ? (
          <div className="state-card empty-state">
            <h2>Nenhuma coluna ainda</h2>
            <p>Crie listas para comeÃ§ar a usar o quadro.</p>
          </div>
        ) : null}

        {!errorMessage && columns.length > 0 ? (
          <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
            <section className="kanban-board" aria-label="Quadro Kanban">
              {columns.map((column) => (
                <article className="kanban-column" key={column.id}>
                  <header className="kanban-column-header">
                    <span style={{ backgroundColor: column.color || '#2563eb' }} aria-hidden="true" />
                    <h2>{column.name}</h2>
                    <strong>{column.items.length}</strong>
                  </header>

                  <Droppable droppableId={String(column.id)}>
                    {(provided, snapshot) => (
                      <div
                        className={`kanban-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {column.hasError ? (
                          <p className="kanban-column-error">Falha ao carregar os cards.</p>
                        ) : null}

                        {column.items.map((item, index) => (
                          <Draggable draggableId={String(item.id)} index={index} key={item.id}>
                            {(dragProvided, dragSnapshot) => (
                              <article
                                className={`kanban-card ${item.status ? 'completed' : ''} ${dragSnapshot.isDragging ? 'dragging' : ''}`}
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => setSelectedItem(item)}
                              >
                                <h3>{item.name}</h3>
                                <span className={`priority priority-${item.priority.toLocaleLowerCase()}`}>
                                  {PRIORITY_LABELS[item.priority]}
                                </span>
                              </article>
                            )}
                          </Draggable>
                        ))}
                        <button
                          className={`kanban-add-item ${column.items.length === 0 ? 'always-visible' : ''}`}
                          type="button"
                          onClick={() => {
                            setItemError(null)
                            setItemListId(column.id)
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Adicionar item
                        </button>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </article>
              ))}
            </section>
          </DragDropContext>
        ) : null}
      </main>

      {isSettingsOpen ? (
        <KanbanSettingsModal
          columns={columns}
          errorMessage={settingsError}
          isSaving={isSavingSettings}
          onClose={() => {
            setIsSettingsOpen(false)
            setSettingsError(null)
          }}
          onCreate={handleCreateColumn}
          onUpdate={handleUpdateColumn}
          onReorder={handleReorderColumns}
        />
      ) : null}

      {itemListId !== null ? (
        <ItemModal
          isSaving={isSavingItem}
          errorMessage={itemError}
          onClose={() => {
            setItemListId(null)
            setItemError(null)
          }}
          onSubmit={handleCreateItem}
        />
      ) : null}

      {selectedItem ? (
        <ItemDetailsModal
          item={selectedItem}
          columnName={selectedItemColumn?.name ?? 'Coluna atual'}
          columnColor={selectedItemColumn?.color ?? '#2563eb'}
          isSaving={isSavingItem}
          errorMessage={itemError}
          onClose={() => {
            setSelectedItem(null)
            setItemError(null)
          }}
          onSave={handleUpdateItem}
          onDelete={handleDeleteSelectedItem}
        />
      ) : null}
    </AuthenticatedLayout>
  )
}

