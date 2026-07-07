import { useEffect } from 'react'
import { useI18n } from '../i18n'
import './WorkspaceModal.css'

type ConfirmModalProps = {
  title: string
  message: string
  isConfirming: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmModal({
  title,
  message,
  isConfirming,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const { t } = useI18n()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isConfirming) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isConfirming, onCancel])

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={() => !isConfirming && onCancel()}
    >
      <section
        className="workspace-modal confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="confirm-modal-title">{title}</h2>
          <button type="button" aria-label={t.confirm.close} disabled={isConfirming} onClick={onCancel}>&times;</button>
        </div>
        <p id="confirm-modal-message">{message}</p>
        <div className="modal-actions">
          <button className="secondary-button" type="button" disabled={isConfirming} onClick={onCancel}>
            {t.common.cancel}
          </button>
          <button className="danger-button" type="button" disabled={isConfirming} onClick={onConfirm}>
            {isConfirming ? t.confirm.deleting : t.common.delete}
          </button>
        </div>
      </section>
    </div>
  )
}
