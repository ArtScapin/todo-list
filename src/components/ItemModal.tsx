import { useEffect, useState, type FormEvent } from 'react'
import type { Item, Priority } from '../services/api/items'
import './WorkspaceModal.css'

type ItemFormData = {
  name: string
  description: string
  priority: Priority
}

type ItemModalProps = {
  item?: Item | null
  isSaving: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (data: ItemFormData) => Promise<void>
}

export function ItemModal({
  item,
  isSaving,
  errorMessage,
  onClose,
  onSubmit,
}: ItemModalProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [priority, setPriority] = useState<Priority>(item?.priority ?? 'MEDIUM')

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
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      priority,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="workspace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="item-modal-title">{item ? 'Editar item' : 'Novo item'}</h2>
          <button type="button" aria-label="Fechar modal" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="item-name">Nome</label>
          <input
            id="item-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="O que precisa ser feito?"
            autoFocus
            required
          />

          <label htmlFor="item-description">Descrição</label>
          <textarea
            id="item-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Detalhes opcionais"
            rows={4}
          />

          <label htmlFor="item-priority">Prioridade</label>
          <select
            id="item-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
          >
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>


          {errorMessage ? <div className="feedback error" role="alert">{errorMessage}</div> : null}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? 'Salvando...' : 'Salvar item'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
