import { useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useI18n } from '../i18n'
import type { Item, Priority } from '../services/api/items'
import './WorkspaceModal.css'

type ItemDetailsModalProps = {
  item: Item
  columns: Array<{
    id: number
    name: string
    color?: string
  }>
  currentColumnId: number
  isSaving: boolean
  errorMessage: string | null
  statusControl?: 'combo' | 'checkbox'
  onClose: () => void
  onSave: (data: { name: string; description: string; priority: Priority }) => Promise<void>
  onStatusChange: (columnId: number) => Promise<void>
  onDelete: () => void
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
}

export function ItemDetailsModal({
  item,
  columns,
  currentColumnId,
  isSaving,
  errorMessage,
  statusControl = 'combo',
  onClose,
  onSave,
  onStatusChange,
  onDelete,
}: ItemDetailsModalProps) {
  const { t } = useI18n()
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description ?? '')
  const [priority, setPriority] = useState<Priority>(item.priority)
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null)
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const currentColumn = columns.find((column) => column.id === currentColumnId)

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose])

  async function saveChanges(nextData?: Partial<{ name: string; description: string; priority: Priority }>) {
    if (isSaving) return

    const nextName = (nextData?.name ?? name).trim()
    const nextDescription = (nextData?.description ?? description).trim()
    const nextPriority = nextData?.priority ?? priority

    if (!nextName) {
      setName(item.name)
      setEditingField(null)
      return
    }

    if (
      nextName === item.name
      && nextDescription === (item.description ?? '')
      && nextPriority === item.priority
    ) {
      setEditingField(null)
      return
    }

    try {
      await onSave({
        name: nextName,
        description: nextDescription,
        priority: nextPriority,
      })
      setEditingField(null)
    } catch {
      setName(item.name)
      setDescription(item.description ?? '')
      setPriority(item.priority)
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }

    if (event.key === 'Escape') {
      setName(item.name)
      setEditingField(null)
    }
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.blur()
    }

    if (event.key === 'Escape') {
      setDescription(item.description ?? '')
      setEditingField(null)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="workspace-modal item-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="editable-detail-title">
            {editingField === 'name' ? (
              <input
                id="item-details-title"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => void saveChanges({ name })}
                onKeyDown={handleInputKeyDown}
                disabled={isSaving}
                autoFocus
              />
            ) : (
              <button
                className="inline-edit-trigger title-trigger"
                type="button"
                onClick={() => setEditingField('name')}
                disabled={isSaving}
              >
                <h2 id="item-details-title">{item.name}</h2>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </button>
            )}
          </div>
          <div className="item-details-actions">
            <button
              className="item-details-delete"
              type="button"
              aria-label={t.itemDetails.deleteItem}
              title={t.itemDetails.deleteItem}
              onClick={onDelete}
              disabled={isSaving}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
              </svg>
            </button>
            <button
              className="item-details-close"
              type="button"
              aria-label={t.itemDetails.closeDetails}
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="item-details-grid">
          <div className="editable-description-block">
            <span>{t.common.description}</span>
            {editingField === 'description' ? (
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => void saveChanges({ description })}
                onKeyDown={handleTextareaKeyDown}
                placeholder={t.common.optionalDetails}
                rows={5}
                disabled={isSaving}
                autoFocus
              />
            ) : (
              <button
                className="inline-edit-trigger description-trigger"
                type="button"
                onClick={() => setEditingField('description')}
                disabled={isSaving}
              >
                <p>{item.description || t.common.noDescription}</p>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </button>
            )}
          </div>

          <div className="item-details-properties">
            <div
              className="priority-select-card"
              style={{ '--priority-color': PRIORITY_COLORS[priority] } as CSSProperties}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsPriorityOpen(false)
                }
              }}
            >
              <span>{t.common.priority}</span>
              <button
                className="priority-combo-trigger"
                type="button"
                onClick={() => setIsPriorityOpen((current) => !current)}
                aria-haspopup="listbox"
                aria-expanded={isPriorityOpen}
                disabled={isSaving}
              >
                {t.priorities[priority]}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isPriorityOpen ? (
                <div className="priority-combo-menu" role="listbox">
                  {PRIORITIES.map((currentPriority) => (
                    <button
                      className={currentPriority === priority ? 'selected' : ''}
                      type="button"
                      role="option"
                      aria-selected={currentPriority === priority}
                      key={currentPriority}
                      onClick={() => {
                        setPriority(currentPriority)
                        setIsPriorityOpen(false)
                        void saveChanges({ priority: currentPriority })
                      }}
                    >
                      <span
                        className="priority-marker"
                        style={{ '--priority-option-color': PRIORITY_COLORS[currentPriority] } as CSSProperties}
                        aria-hidden="true"
                      />
                      {t.priorities[currentPriority]}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {statusControl === 'checkbox' ? (
              <div
                className="status-property-card"
                style={{ '--status-color': item.status ? '#22c55e' : '#94a3b8' } as CSSProperties}
              >
                <span>{t.common.status}</span>
                <button
                  className="status-check-trigger"
                  type="button"
                  role="checkbox"
                  aria-checked={item.status}
                  disabled={isSaving}
                  onClick={() => void onStatusChange(item.status ? 0 : 1)}
                >
                  <span className="status-check-box" aria-hidden="true">
                    {item.status ? '\u2713' : ''}
                  </span>
                  {item.status ? t.common.completed : t.common.pending}
                </button>
              </div>
            ) : (
              <div
                className="status-property-card"
                style={{ '--status-color': currentColumn?.color || '#2563eb' } as CSSProperties}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsStatusOpen(false)
                  }
                }}
              >
                <span>{t.common.status}</span>
                <button
                  className="priority-combo-trigger"
                  type="button"
                  onClick={() => setIsStatusOpen((current) => !current)}
                  aria-haspopup="listbox"
                  aria-expanded={isStatusOpen}
                  disabled={isSaving}
                >
                  {currentColumn?.name ?? t.itemDetails.statusFallback}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isStatusOpen ? (
                  <div className="priority-combo-menu" role="listbox">
                    {columns.map((column) => (
                      <button
                        className={column.id === currentColumnId ? 'selected' : ''}
                        type="button"
                        role="option"
                        aria-selected={column.id === currentColumnId}
                        key={column.id}
                        onClick={() => {
                          setIsStatusOpen(false)
                          if (column.id !== currentColumnId) {
                            void onStatusChange(column.id)
                          }
                        }}
                      >
                        <span
                          className="priority-marker"
                          style={{ '--priority-option-color': column.color || '#2563eb' } as CSSProperties}
                          aria-hidden="true"
                        />
                        {column.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {errorMessage ? <div className="feedback error" role="alert">{errorMessage}</div> : null}
        </div>
      </section>
    </div>
  )
}
