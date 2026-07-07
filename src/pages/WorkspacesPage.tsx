import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/AuthenticatedLayout'
import { WorkspaceModal } from '../components/WorkspaceModal'
import { useI18n } from '../i18n'
import { ApiError } from '../services/api/api'
import {
  createWorkspace,
  getWorkspaces,
  type Workspace,
} from '../services/api/workspaces'

export function WorkspacesPage() {
  const { t } = useI18n()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')

  const loadWorkspaces = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const data = await getWorkspaces(signal)
      setWorkspaces(data)
    } catch (error) {
      if (!signal?.aborted && !(error instanceof ApiError && error.status === 401)) {
        setLoadError(t.workspaces.loadError)
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [t.workspaces.loadError])

  useEffect(() => {
    const controller = new AbortController()

    async function loadInitialWorkspaces() {
      try {
        const data = await getWorkspaces(controller.signal)
        setWorkspaces(data)
      } catch (error) {
        if (!controller.signal.aborted && !(error instanceof ApiError && error.status === 401)) {
          setLoadError(t.workspaces.loadError)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialWorkspaces()
    return () => controller.abort()
  }, [t.workspaces.loadError])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSaveError(null)
  }, [])

  async function handleCreateWorkspace(name: string, isKanbanViewMode: boolean) {
    setIsSaving(true)
    setSaveError(null)

    try {
      const workspace = await createWorkspace({ name, isKanbanViewMode })
      setWorkspaces((current) => [...current, workspace])
      closeModal()
    } catch (error) {
      const hasApiResponse = error instanceof ApiError && error.status !== undefined
      setSaveError(
        hasApiResponse
          ? t.workspaces.createError
          : t.workspaces.createApiError,
      )
    } finally {
      setIsSaving(false)
    }
  }

  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLocaleLowerCase().includes(searchValue.trim().toLocaleLowerCase()),
  )

  return (
    <AuthenticatedLayout
      searchValue={searchValue}
      searchLabel={t.workspaces.searchLabel}
      searchPlaceholder={t.workspaces.searchPlaceholder}
      onSearchChange={setSearchValue}
    >
      <main className="workspaces-content">
        <div className="workspaces-heading">
          <div>
            <p className="eyebrow">{t.workspaces.eyebrow}</p>
            <h1>{t.workspaces.title}</h1>
          </div>
          <button className="primary-button" type="button" onClick={() => setIsModalOpen(true)}>
            {t.common.createWorkspace}
          </button>
        </div>

        {isLoading ? <div className="state-card">{t.workspaces.loading}</div> : null}

        {!isLoading && loadError ? (
          <div className="state-card error-state">
            <p>{loadError}</p>
            <button className="secondary-button" type="button" onClick={() => void loadWorkspaces()}>
              {t.common.retry}
            </button>
          </div>
        ) : null}

        {!isLoading && !loadError && workspaces.length === 0 ? (
          <div className="state-card empty-state">
            <h2>{t.workspaces.emptyTitle}</h2>
            <p>{t.workspaces.emptyDescription}</p>
          </div>
        ) : null}

        {!isLoading && !loadError && workspaces.length > 0 && filteredWorkspaces.length === 0 ? (
          <div className="state-card empty-state">
            <h2>{t.common.noResults}</h2>
            <p>{t.workspaces.noResults}</p>
          </div>
        ) : null}

        {!isLoading && !loadError && filteredWorkspaces.length > 0 ? (
          <section className="workspace-grid" aria-label={t.workspaces.gridLabel}>
            {filteredWorkspaces.map((workspace) => (
              <Link
                className="workspace-card"
                key={workspace.id}
                to={`/workspaces/${workspace.id}/${workspace.isKanbanViewMode ? 'board' : 'lists'}`}
              >
                <span className="workspace-icon" aria-hidden="true">W</span>
                <h2>{workspace.name}</h2>
                <p>{workspace.isKanbanViewMode ? t.common.kanban : t.common.listMode}</p>
              </Link>
            ))}
          </section>
        ) : null}
      </main>

      {isModalOpen ? (
        <WorkspaceModal
          isOpen
          isSaving={isSaving}
          errorMessage={saveError}
          onClose={closeModal}
          onSubmit={handleCreateWorkspace}
        />
      ) : null}
    </AuthenticatedLayout>
  )
}
