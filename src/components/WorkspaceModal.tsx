import { useEffect, useState, type FormEvent } from 'react'
import './WorkspaceModal.css'

type WorkspaceModalProps = {
  isOpen: boolean
  isSaving: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (name: string, isKanbanViewMode: boolean) => Promise<void>
}

export function WorkspaceModal({
  isOpen,
  isSaving,
  errorMessage,
  onClose,
  onSubmit,
}: WorkspaceModalProps) {
  const [name, setName] = useState('')
  const [isKanbanViewMode, setIsKanbanViewMode] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(name.trim(), isKanbanViewMode)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="workspace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="workspace-modal-title">Novo workspace</h2>
          <button type="button" aria-label="Fechar modal" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="workspace-name">Nome</label>
          <input
            id="workspace-name"
            type="text"
            placeholder="Ex.: Projeto pessoal"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />

          <div className="workspace-mode-option">
            <div>
              <strong>Modo Kanban</strong>
              <span>Organize listas como colunas e mova cards entre elas.</span>
            </div>
            <button
              className={`theme-switch ${isKanbanViewMode ? 'active' : ''}`}
              type="button"
              role="switch"
              aria-checked={isKanbanViewMode}
              aria-label="Ativar visualização Kanban"
              onClick={() => setIsKanbanViewMode((current) => !current)}
            >
              <span />
            </button>
          </div>

          {errorMessage ? <div className="feedback error" role="alert">{errorMessage}</div> : null}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? 'Criando...' : 'Criar workspace'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
