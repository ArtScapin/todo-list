import { useState, type FormEvent } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { useI18n } from '../i18n'
import type { KanbanList } from '../services/api/lists'
import './KanbanSettingsModal.css'

const COLUMN_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
]

type KanbanSettingsModalProps = {
  columns: KanbanList[]
  errorMessage: string | null
  isSaving: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<void>
  onUpdate: (column: KanbanList, name: string, color: string) => Promise<void>
  onReorder: (columns: KanbanList[]) => Promise<void>
}

export function KanbanSettingsModal({
  columns,
  errorMessage,
  isSaving,
  onClose,
  onCreate,
  onUpdate,
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
                          <button className="column-edit-action" type="button" disabled={isSaving} onClick={() => startEditing(column)}>
                            {t.kanbanSettings.edit}
                          </button>
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
    </div>
  )
}
