import { useEffect, useState, type FormEvent } from 'react'
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
  isSaving: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (name: string, color: string) => Promise<void>
}

export function ListModal({ isSaving, errorMessage, onClose, onSubmit }: ListModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2563eb')

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
          <h2 id="list-modal-title">Nova lista</h2>
          <button type="button" aria-label="Fechar modal" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="list-name">Nome</label>
          <input
            id="list-name"
            type="text"
            placeholder="Ex.: Em andamento"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />

          <span className="color-label" id="list-color-label">Cor</span>
          <div className="color-palette" role="radiogroup" aria-labelledby="list-color-label">
            {LIST_COLORS.map((option) => (
              <button
                className={`color-option ${color === option ? 'selected' : ''}`}
                key={option}
                type="button"
                role="radio"
                aria-checked={color === option}
                aria-label={`Selecionar cor ${option}`}
                style={{ backgroundColor: option }}
                onClick={() => setColor(option)}
              >
                {color === option ? <span aria-hidden="true">✓</span> : null}
              </button>
            ))}
          </div>

          {errorMessage ? <div className="feedback error" role="alert">{errorMessage}</div> : null}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? 'Criando...' : 'Criar lista'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
