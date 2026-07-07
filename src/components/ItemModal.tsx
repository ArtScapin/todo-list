import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import type { Item, Priority } from '../services/api/items'
import './WorkspaceModal.css'

type ItemFormData = {
  name: string
  description: string
  priority: Priority
  status: boolean
  listId?: number
}

type ItemModalProps = {
  item?: Item | null
  isSaving: boolean
  errorMessage: string | null
  onClose: () => void
  allowStatusEdit?: boolean
  lists?: Array<{
    id: number
    name: string
    color?: string
  }>
  selectedListId?: number | null
  onSubmit: (data: ItemFormData) => Promise<void>
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
}

export function ItemModal({
  item,
  isSaving,
  errorMessage,
  onClose,
  allowStatusEdit = true,
  lists = [],
  selectedListId = null,
  onSubmit,
}: ItemModalProps) {
  const { t } = useI18n()
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [priority, setPriority] = useState<Priority>(item?.priority ?? 'MEDIUM')
  const [status, setStatus] = useState(item?.status ?? false)
  const [listId, setListId] = useState<number | null>(selectedListId ?? lists[0]?.id ?? null)
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isListOpen, setIsListOpen] = useState(false)
  const currentList = lists.find((list) => list.id === listId)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose])

  useEffect(() => {
    setListId(selectedListId ?? lists[0]?.id ?? null)
  }, [lists, selectedListId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      priority,
      status,
      listId: listId ?? undefined,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="workspace-modal item-details-modal item-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form className="item-editor-form" onSubmit={handleSubmit}>
          <div className="modal-header">
            <div className="editable-detail-title">
              <h2 id="item-modal-title">{item ? t.itemModal.editTitle : t.itemModal.createTitle}</h2>
            </div>
            <div className="item-details-actions">
              <button type="button" aria-label={t.common.close} onClick={onClose}>&times;</button>
            </div>
          </div>

          <div className="item-details-grid item-editor-grid">
            <div className="item-editor-field">
              <span>{t.common.name}</span>
              <input
                id="item-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.itemModal.namePlaceholder}
                autoFocus
                required
              />
            </div>

            <div className="editable-description-block item-editor-field">
              <span>{t.common.description}</span>
              <textarea
                id="item-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t.itemModal.optionalDetails}
                rows={5}
              />
            </div>

            <div className={`item-details-properties ${allowStatusEdit ? '' : 'three-columns'}`}>
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

              {lists.length > 0 ? (
                <div
                  className="status-property-card"
                  style={{ '--status-color': currentList?.color || '#2563eb' } as CSSProperties}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsListOpen(false)
                    }
                  }}
                >
                  <span>{t.common.list}</span>
                  <button
                    className="priority-combo-trigger"
                    type="button"
                    onClick={() => setIsListOpen((current) => !current)}
                    aria-haspopup="listbox"
                    aria-expanded={isListOpen}
                    disabled={isSaving}
                  >
                    {currentList?.name ?? t.itemModal.selectList}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isListOpen ? (
                    <div className="priority-combo-menu" role="listbox">
                      {lists.map((list) => (
                        <button
                          className={list.id === listId ? 'selected' : ''}
                          type="button"
                          role="option"
                          aria-selected={list.id === listId}
                          key={list.id}
                          onClick={() => {
                            setListId(list.id)
                            setIsListOpen(false)
                          }}
                        >
                          <span
                            className="priority-marker"
                            style={{ '--priority-option-color': list.color || '#2563eb' } as CSSProperties}
                            aria-hidden="true"
                          />
                          {list.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {allowStatusEdit ? (
                <div
                  className="status-property-card"
                  style={{ '--status-color': status ? '#22c55e' : '#94a3b8' } as CSSProperties}
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
                    {status ? t.itemModal.done : t.common.pending}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isStatusOpen ? (
                    <div className="priority-combo-menu" role="listbox">
                      <button
                        className={!status ? 'selected' : ''}
                        type="button"
                        role="option"
                        aria-selected={!status}
                        onClick={() => {
                          setStatus(false)
                          setIsStatusOpen(false)
                        }}
                      >
                        <span
                          className="priority-marker"
                          style={{ '--priority-option-color': '#94a3b8' } as CSSProperties}
                          aria-hidden="true"
                        />
                        {t.common.pending}
                      </button>
                      <button
                        className={status ? 'selected' : ''}
                        type="button"
                        role="option"
                        aria-selected={status}
                        onClick={() => {
                          setStatus(true)
                          setIsStatusOpen(false)
                        }}
                      >
                        <span
                          className="priority-marker"
                          style={{ '--priority-option-color': '#22c55e' } as CSSProperties}
                          aria-hidden="true"
                        />
                        {t.itemModal.done}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {errorMessage ? <div className="feedback error" role="alert">{errorMessage}</div> : null}

            <div className="modal-actions item-editor-actions">
              <button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>
                {t.common.cancel}
              </button>
              <button
                className="primary-button"
                type="submit"
                disabled={isSaving || !name.trim() || (lists.length > 0 && listId === null)}
              >
                {isSaving ? t.common.saving : t.itemModal.save}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
