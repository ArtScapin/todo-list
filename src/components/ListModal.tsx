import { useEffect, useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import type { KanbanList } from '../services/api/lists'
import './WorkspaceModal.css'

const LIST_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
]

type ListModalProps = {
  list?: KanbanList | null
  title?: string
  isSaving: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (name: string, color: string) => Promise<void>
  onDelete?: () => void
}

export function ListModal({ list, title, isSaving, errorMessage, onClose, onSubmit, onDelete }: ListModalProps) {
  const { t } = useI18n()
  const [name, setName] = useState(list?.name ?? '')
  const [color, setColor] = useState(list?.color ?? '#2563eb')

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(name.trim(), color)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="workspace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="list-modal-title">{title ?? (list ? t.listModal.editTitle : t.listModal.createTitle)}</h2>
          <button type="button" aria-label={t.common.close} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="list-name">{t.common.name}</label>
          <input
            id="list-name"
            type="text"
            placeholder={t.listModal.placeholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />

          <span className="color-label" id="list-color-label">{t.listModal.color}</span>
          <div className="color-palette" role="radiogroup" aria-labelledby="list-color-label">
            {LIST_COLORS.map((option) => (
              <button
                className={`color-option ${color === option ? 'selected' : ''}`}
                key={option}
                type="button"
                role="radio"
                aria-checked={color === option}
                aria-label={t.listModal.selectColor(option)}
                style={{ backgroundColor: option }}
                onClick={() => setColor(option)}
              >
                {color === option ? <span aria-hidden="true">{'\u2713'}</span> : null}
              </button>
            ))}
          </div>

          {errorMessage ? <div className="feedback error" role="alert">{errorMessage}</div> : null}

          {list && onDelete ? (
            <button
              className="list-settings-delete-button"
              type="button"
              disabled={isSaving}
              onClick={onDelete}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
              </svg>
              {t.listModal.delete}
            </button>
          ) : null}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>
              {t.common.cancel}
            </button>
            <button className="primary-button" type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? t.common.saving : list ? t.listModal.save : t.listModal.create}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
