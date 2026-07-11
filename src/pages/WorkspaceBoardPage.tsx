import { useEffect, useState } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/AuthenticatedLayout'
import { ConfirmModal } from '../components/ConfirmModal'
import { ItemDetailsModal } from '../components/ItemDetailsModal'
import { ItemModal } from '../components/ItemModal'
import { KanbanSettingsModal } from '../components/KanbanSettingsModal'
import { PageLoader } from '../components/PageLoader'
import { useI18n } from '../i18n'
import { createItem, deleteItem, getItems, moveItem, updateItem, type Item, type Priority } from '../services/api/items'
import { createList, deleteList, getLists, updateList, type KanbanList } from '../services/api/lists'
import { deleteWorkspace, getWorkspace, updateWorkspace, type Workspace } from '../services/api/workspaces'
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

export function WorkspaceBoardPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
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
  const [columnPendingDeletion, setColumnPendingDeletion] = useState<BoardColumn | null>(null)
  const [isConfirmingWorkspaceDeletion, setIsConfirmingWorkspaceDeletion] = useState(false)
  const [itemListId, setItemListId] = useState<number | null>(null)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [itemError, setItemError] = useState<string | null>(null)
  const [isEditingWorkspaceName, setIsEditingWorkspaceName] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [isSavingWorkspaceName, setIsSavingWorkspaceName] = useState(false)
  const [workspaceNameError, setWorkspaceNameError] = useState<string | null>(null)
  const [isSavingViewMode, setIsSavingViewMode] = useState(false)
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
        setWorkspaceName(workspaceData.name)
        setColumns(withKanbanItemStatuses(boardColumns))
      } catch {
        if (!controller.signal.aborted) {
          setErrorMessage(t.board.loadError)
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadBoard()
    return () => controller.abort()
  }, [isValidWorkspaceId, parsedWorkspaceId, t.board.loadError])

  async function handleWorkspaceNameSave() {
    if (!workspace || isSavingWorkspaceName) return

    const normalizedName = workspaceName.trim()

    if (!normalizedName || normalizedName === workspace.name) {
      setWorkspaceName(workspace.name)
      setIsEditingWorkspaceName(false)
      return
    }

    setIsSavingWorkspaceName(true)
    setWorkspaceNameError(null)

    try {
      const updatedWorkspace = await updateWorkspace(workspace.id, {
        name: normalizedName,
        isKanbanViewMode: Boolean(workspace.isKanbanViewMode),
      })
      setWorkspace(updatedWorkspace)
      setWorkspaceName(updatedWorkspace.name)
    } catch {
      setWorkspaceName(workspace.name)
      setWorkspaceNameError(t.lists.renameError)
    } finally {
      setIsSavingWorkspaceName(false)
      setIsEditingWorkspaceName(false)
    }
  }

  async function handleViewModeChange() {
    if (!workspace || isSavingViewMode) return
    const isKanbanViewMode = !workspace.isKanbanViewMode
    setIsSavingViewMode(true)
    setWorkspaceNameError(null)

    try {
      const updatedWorkspace = await updateWorkspace(workspace.id, {
        name: workspace.name,
        isKanbanViewMode,
      })
      setWorkspace(updatedWorkspace)

      if (!updatedWorkspace.isKanbanViewMode) {
        navigate(`/workspaces/${workspace.id}/lists`)
      }
    } catch {
      setWorkspaceNameError(t.lists.toggleViewError)
    } finally {
      setIsSavingViewMode(false)
    }
  }

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
      setMoveError(t.board.moveError)
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
      setSettingsError(t.board.addColumnError)
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
      setSettingsError(t.board.updateColumnError)
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
      setSettingsError(t.board.reorderColumnError)
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function handleDeleteColumn() {
    if (!columnPendingDeletion) return

    setIsSavingSettings(true)
    setSettingsError(null)

    try {
      await deleteList(columnPendingDeletion.id)
      setColumns((current) => withKanbanItemStatuses(current.filter((column) => (
        column.id !== columnPendingDeletion.id
      ))))
      setSelectedItem((current) => (
        columnPendingDeletion.items.some((item) => item.id === current?.id) ? null : current
      ))
      setColumnPendingDeletion(null)
    } catch {
      setSettingsError(t.board.deleteColumnError)
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function handleDeleteWorkspace() {
    if (!workspace) return

    setIsSavingSettings(true)
    setSettingsError(null)

    try {
      await deleteWorkspace(workspace.id)
      setIsConfirmingWorkspaceDeletion(false)
      navigate('/workspaces', { replace: true })
    } catch {
      setSettingsError(t.kanbanSettings.deleteWorkspaceError)
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function handleCreateItem(data: {
    name: string
    description: string
    priority: Priority
    status: boolean
    listId?: number
  }) {
    const targetListId = data.listId ?? itemListId
    if (targetListId === null) return
    const column = columns.find((current) => current.id === targetListId)
    if (!column) return
    setIsSavingItem(true)
    setItemError(null)

    try {
      const item = await createItem(targetListId, {
        name: data.name,
        description: data.description,
        priority: data.priority,
        status: false,
        position: column.items.length,
      })
      setColumns((current) => withKanbanItemStatuses(current.map((currentColumn) => (
        currentColumn.id === targetListId
          ? { ...currentColumn, items: [...currentColumn.items, item] }
          : currentColumn
      ))))
      setItemListId(null)
    } catch {
      setItemError(t.board.addItemError)
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
      setItemError(t.itemDetails.saveError)
      throw new Error(t.itemDetails.saveError)
    } finally {
      setIsSavingItem(false)
    }
  }

  async function handleChangeSelectedItemStatus(columnId: number) {
    if (!selectedItem) return

    const sourceColumn = columns.find((column) => column.items.some((item) => item.id === selectedItem.id))
    const destinationColumn = columns.find((column) => column.id === columnId)

    if (!sourceColumn || !destinationColumn || sourceColumn.id === destinationColumn.id) {
      return
    }

    const previousColumns = columns
    const nextColumns = columns.map((column) => ({ ...column, items: [...column.items] }))
    const nextSourceColumn = nextColumns.find((column) => column.id === sourceColumn.id)
    const nextDestinationColumn = nextColumns.find((column) => column.id === destinationColumn.id)

    if (!nextSourceColumn || !nextDestinationColumn) return

    const sourceIndex = nextSourceColumn.items.findIndex((item) => item.id === selectedItem.id)
    if (sourceIndex < 0) return

    const [movedItem] = nextSourceColumn.items.splice(sourceIndex, 1)
    if (!movedItem) return

    nextDestinationColumn.items.push({ ...movedItem, position: nextDestinationColumn.items.length })
    nextSourceColumn.items = nextSourceColumn.items.map((item, position) => ({ ...item, position }))
    nextDestinationColumn.items = nextDestinationColumn.items.map((item, position) => ({ ...item, position }))
    setColumns(withKanbanItemStatuses(nextColumns))
    setMoveError(null)

    try {
      const updatedMovedItem = await moveItem(movedItem.id, columnId, nextDestinationColumn.items.length - 1)
      setColumns((current) => withKanbanItemStatuses(current.map((column) => ({
        ...column,
        items: column.items.map((item) => (
          item.id === updatedMovedItem.id ? updatedMovedItem : item
        )),
      }))))
      setSelectedItem(updatedMovedItem)
    } catch {
      setColumns(previousColumns)
      setSelectedItem(selectedItem)
      setMoveError(t.board.moveStatusError)
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
      setItemError(t.itemDetails.deleteError)
    } finally {
      setIsSavingItem(false)
    }
  }

  function openCreateItemModal(listId?: number) {
    if (listId !== undefined) {
      setItemError(null)
      setItemListId(listId)
      return
    }

    const firstColumnId = [...columns]
      .sort((first, second) => first.position - second.position)
      .at(0)?.id

    if (firstColumnId === undefined) return

    setItemError(null)
    setItemListId(firstColumnId)
  }

  if (isLoading && isValidWorkspaceId) {
    return (
      <AuthenticatedLayout>
        <PageLoader label={t.board.loading} />
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <main className="board-page">
        <header className="board-heading">
          <div className="board-heading-content">
            <Link className="workspace-back" to="/workspaces">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t.common.workspace}
            </Link>
            {workspace && isEditingWorkspaceName ? (
              <input
                className="workspace-title-input"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                onBlur={() => void handleWorkspaceNameSave()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                }}
                aria-label={t.common.name}
                disabled={isSavingWorkspaceName}
                autoFocus
              />
            ) : workspace ? (
              <button
                className="workspace-title"
                type="button"
                onClick={() => setIsEditingWorkspaceName(true)}
              >
                <h1>{workspace.name}</h1>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </button>
            ) : (
              <h1>{t.board.title}</h1>
            )}
            <p>{t.board.subtitle}</p>
            {workspaceNameError ? <span className="workspace-name-error" role="alert">{workspaceNameError}</span> : null}
          </div>
          <div className="board-heading-actions">
            <button
              className="primary-button board-create-button"
              type="button"
              disabled={columns.length === 0}
              onClick={() => openCreateItemModal()}
            >
              {t.common.createItem}
            </button>
            <button
              className="board-settings-button"
              type="button"
              aria-label={t.common.configureColumns}
              title={t.common.configureColumns}
              onClick={() => setIsSettingsOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.55 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.55a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.45 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.12.37.33.71.6 1 .3.28.7.43 1.1.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
              </svg>
            </button>
          </div>
        </header>

        {(!isValidWorkspaceId || errorMessage) ? (
          <div className="state-card error-state">
            <p>{errorMessage ?? t.board.invalidWorkspace}</p>
          </div>
        ) : null}

        {moveError ? <div className="inline-error" role="alert">{moveError}</div> : null}

        {!errorMessage && columns.length === 0 ? (
          <div className="state-card empty-state">
            <h2>{t.board.emptyTitle}</h2>
            <p>{t.board.emptyDescription}</p>
          </div>
        ) : null}

        {!errorMessage && columns.length > 0 ? (
          <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
            <section className="kanban-board" aria-label={t.board.boardLabel}>
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
                          <p className="kanban-column-error">{t.board.columnLoadError}</p>
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
                                  {t.priorities[item.priority]}
                                </span>
                              </article>
                            )}
                          </Draggable>
                        ))}
                        <button
                          className={`kanban-add-item ${column.items.length === 0 ? 'always-visible' : ''}`}
                          type="button"
                          onClick={() => openCreateItemModal(column.id)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          {t.board.addItem}
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

      {isSettingsOpen && workspace ? (
        <KanbanSettingsModal
          workspace={workspace}
          columns={columns}
          errorMessage={settingsError}
          isSaving={isSavingSettings}
          isSavingWorkspace={isSavingSettings || isSavingViewMode}
          onClose={() => {
            setIsSettingsOpen(false)
            setSettingsError(null)
          }}
          onToggleKanbanMode={handleViewModeChange}
          onDeleteWorkspace={() => setIsConfirmingWorkspaceDeletion(true)}
          onCreate={handleCreateColumn}
          onUpdate={handleUpdateColumn}
          onDelete={(column) => {
            const boardColumn = columns.find((current) => current.id === column.id)
            if (boardColumn) setColumnPendingDeletion(boardColumn)
          }}
          onReorder={handleReorderColumns}
        />
      ) : null}

      {workspace && isConfirmingWorkspaceDeletion ? (
        <ConfirmModal
          title={t.kanbanSettings.deleteWorkspaceTitle}
          message={t.kanbanSettings.deleteWorkspaceMessage(workspace.name)}
          isConfirming={isSavingSettings}
          onCancel={() => {
            if (!isSavingSettings) setIsConfirmingWorkspaceDeletion(false)
          }}
          onConfirm={() => void handleDeleteWorkspace()}
        />
      ) : null}

      {columnPendingDeletion ? (
        <ConfirmModal
          title={t.kanbanSettings.deleteTitle}
          message={t.kanbanSettings.deleteMessage(columnPendingDeletion.name)}
          isConfirming={isSavingSettings}
          onCancel={() => {
            if (!isSavingSettings) setColumnPendingDeletion(null)
          }}
          onConfirm={() => void handleDeleteColumn()}
        />
      ) : null}

      {itemListId !== null ? (
        <ItemModal
          isSaving={isSavingItem}
          errorMessage={itemError}
          allowStatusEdit={false}
          lists={columns.map((column) => ({
            id: column.id,
            name: column.name,
            color: column.color,
          }))}
          selectedListId={itemListId}
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
          columns={columns.map((column) => ({
            id: column.id,
            name: column.name,
            color: column.color,
          }))}
          currentColumnId={selectedItemColumn?.id ?? -1}
          isSaving={isSavingItem}
          errorMessage={itemError}
          onClose={() => {
            setSelectedItem(null)
            setItemError(null)
          }}
          onSave={handleUpdateItem}
          onStatusChange={handleChangeSelectedItemStatus}
          onDelete={handleDeleteSelectedItem}
        />
      ) : null}
    </AuthenticatedLayout>
  )
}
