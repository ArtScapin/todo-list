import { useState, type FormEvent } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { useI18n } from '../i18n'
import type { KanbanList } from '../services/api/lists'
import type { Workspace } from '../services/api/workspaces'
import './KanbanSettingsModal.css'

const COLUMN_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
]

type KanbanSettingsModalProps = {
  workspace: Workspace
  columns: KanbanList[]
  errorMessage: string | null
  isSaving: boolean
  isSavingWorkspace: boolean
  onClose: () => void
  onToggleKanbanMode: () => Promise<void>
  onDeleteWorkspace: () => void
  onCreate: (name: string) => Promise<void>
  onUpdate: (column: KanbanList, name: string, color: string) => Promise<void>
  onDelete: (column: KanbanList) => void
  onReorder: (columns: KanbanList[]) => Promise<void>
}

export function KanbanSettingsModal({
  workspace,
  columns,
  errorMessage,
  isSaving,
  isSavingWorkspace,
  onClose,
  onToggleKanbanMode,
  onDeleteWorkspace,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: KanbanSettingsModalProps) {
  const { t } = useI18n()
  const [newColumnName, setNewColumnName] = useState('')
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('#2563eb')

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newColumnName.trim()
    if (!name) return
    await onCreate(name)
    setNewColumnName('')
  }

  function startEditing(column: KanbanList) {
    setEditingColumnId(column.id)
    setEditingName(column.name)
    setEditingColor(column.color || '#2563eb')
  }

  async function saveEditing(column: KanbanList) {
    if (!editingName.trim()) return
    await onUpdate(column, editingName.trim(), editingColor)
    setEditingColumnId(null)
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination || result.source.index === result.destination.index) return
    const reordered = [...columns]
    const [movedColumn] = reordered.splice(result.source.index, 1)
    if (!movedColumn) return
    reordered.splice(result.destination.index, 0, movedColumn)
    await onReorder(reordered)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !isSaving && onClose()}>
      <section
        className="workspace-modal kanban-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="kanban-settings-title">{t.kanbanSettings.title}</h2>
            <p>{t.kanbanSettings.subtitle}</p>
          </div>
          <button type="button" aria-label={t.common.close} disabled={isSaving} onClick={onClose}>&times;</button>
        </div>

        <section className="settings-section workspace-settings-section" aria-labelledby="workspace-settings-title">
          <div className="settings-section-header">
            <div>
              <h3 id="workspace-settings-title">{t.kanbanSettings.workspaceTitle}</h3>
              <p>{t.kanbanSettings.workspaceSubtitle(workspace.name)}</p>
            </div>
          </div>

          <div className="workspace-mode-option settings-mode-option">
            <div>
              <strong>{t.workspaceModal.kanbanTitle}</strong>
              <span>{t.workspaceModal.kanbanDescription}</span>
            </div>
            <button
              className={`theme-switch mode-switch ${workspace.isKanbanViewMode ? 'active' : ''}`}
              type="button"
              role="switch"
              aria-checked={workspace.isKanbanViewMode}
              aria-label={t.workspaceModal.toggleKanban}
              disabled={isSavingWorkspace}
              onClick={() => void onToggleKanbanMode()}
            >
              <span className="theme-switch-thumb" aria-hidden="true" />
            </button>
          </div>

          <button
            className="workspace-delete-button"
            type="button"
            disabled={isSavingWorkspace}
            onClick={onDeleteWorkspace}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
            </svg>
            {t.kanbanSettings.deleteWorkspace}
          </button>
        </section>

        <section className="settings-section" aria-labelledby="column-settings-title">
          <div className="settings-section-header">
            <div>
              <h3 id="column-settings-title">{t.kanbanSettings.columnsTitle}</h3>
              <p>{t.kanbanSettings.columnsSubtitle}</p>
            </div>
          </div>

        <form className="new-column-form" onSubmit={handleCreate}>
          <input
            aria-label={t.kanbanSettings.newColumnName}
            placeholder={t.kanbanSettings.newColumnName}
            value={newColumnName}
            onChange={(event) => setNewColumnName(event.target.value)}
          />
          <button className="primary-button" type="submit" disabled={isSaving || !newColumnName.trim()}>
            {t.kanbanSettings.add}
          </button>
        </form>

        {errorMessage ? <div className="feedback error" role="alert">{errorMessage}</div> : null}

        <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
          <Droppable droppableId="column-settings">
            {(provided) => (
              <div className="column-settings-list" ref={provided.innerRef} {...provided.droppableProps}>
                {columns.map((column, index) => (
                  <Draggable draggableId={`column-${column.id}`} index={index} key={column.id}>
                    {(dragProvided, snapshot) => (
                      <div
                        className={`column-settings-row ${snapshot.isDragging ? 'dragging' : ''}`}
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                      >
                        <span className="column-drag-handle" {...dragProvided.dragHandleProps} aria-label={t.kanbanSettings.moveColumn(column.name)}>
                          {'\u22ee\u22ee'}
                        </span>

                        {editingColumnId === column.id ? (
                          <div className="column-edit-fields">
                            <input
                              aria-label={t.kanbanSettings.columnName(column.name)}
                              value={editingName}
                              onChange={(event) => setEditingName(event.target.value)}
                              autoFocus
                            />
                            <div className="column-color-options" aria-label={t.kanbanSettings.columnColor}>
                              {COLUMN_COLORS.map((color) => (
                                <button
                                  className={editingColor === color ? 'selected' : ''}
                                  type="button"
                                  key={color}
                                  aria-label={t.listModal.selectColor(color)}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setEditingColor(color)}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="column-settings-name">
                            <span style={{ backgroundColor: column.color || '#2563eb' }} aria-hidden="true" />
                            <strong>{column.name}</strong>
                          </div>
                        )}

                        {editingColumnId === column.id ? (
                          <div className="column-row-actions">
                            <button type="button" disabled={isSaving} onClick={() => setEditingColumnId(null)}>{t.common.cancel}</button>
                            <button type="button" disabled={isSaving || !editingName.trim()} onClick={() => void saveEditing(column)}>{t.common.save}</button>
                          </div>
                        ) : (
                          <div className="column-row-actions">
                            <button
                              className="column-icon-action column-edit-action"
                              type="button"
                              disabled={isSaving}
                              aria-label={t.kanbanSettings.editColumn(column.name)}
                              title={t.common.edit}
                              onClick={() => startEditing(column)}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                              </svg>
                            </button>
                            <button
                              className="column-icon-action column-delete-action"
                              type="button"
                              disabled={isSaving}
                              aria-label={t.kanbanSettings.deleteColumn(column.name)}
                              title={t.common.delete}
                              onClick={() => onDelete(column)}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        </section>
      </section>
    </div>
  )
}
