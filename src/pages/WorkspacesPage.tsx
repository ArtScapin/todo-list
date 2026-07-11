import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/AuthenticatedLayout'
import { ConfirmModal } from '../components/ConfirmModal'
import { SettingsModal } from '../components/SettingsModal'
import { WorkspaceModal } from '../components/WorkspaceModal'
import { useI18n } from '../i18n'
import { ApiError } from '../services/api/api'
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
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
  const [workspaceSettings, setWorkspaceSettings] = useState<Workspace | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isConfirmingWorkspaceDeletion, setIsConfirmingWorkspaceDeletion] = useState(false)
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

  async function handleToggleWorkspaceMode() {
    if (!workspaceSettings || isSavingSettings) return

    setIsSavingSettings(true)
    setSettingsError(null)

    try {
      const updatedWorkspace = await updateWorkspace(workspaceSettings.id, {
        name: workspaceSettings.name,
        isKanbanViewMode: !workspaceSettings.isKanbanViewMode,
      })
      setWorkspaceSettings(updatedWorkspace)
      setWorkspaces((current) => current.map((workspace) => (
        workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace
      )))
    } catch {
      setSettingsError(t.lists.toggleViewError)
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function handleDeleteWorkspace() {
    if (!workspaceSettings || isSavingSettings) return

    setIsSavingSettings(true)
    setSettingsError(null)

    try {
      await deleteWorkspace(workspaceSettings.id)
      setWorkspaces((current) => current.filter((workspace) => workspace.id !== workspaceSettings.id))
      setIsConfirmingWorkspaceDeletion(false)
      setWorkspaceSettings(null)
    } catch {
      setSettingsError(t.kanbanSettings.deleteWorkspaceError)
    } finally {
      setIsSavingSettings(false)
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
              <article className="workspace-card" key={workspace.id}>
                <Link
                  className="workspace-card-link"
                  to={`/workspaces/${workspace.id}/${workspace.isKanbanViewMode ? 'board' : 'lists'}`}
                >
                  <span className="workspace-icon" aria-hidden="true">W</span>
                  <h2>{workspace.name}</h2>
                  <p>{workspace.isKanbanViewMode ? t.common.kanban : t.common.listMode}</p>
                </Link>
                <button
                  className="workspace-card-settings"
                  type="button"
                  aria-label={t.kanbanSettings.workspaceSubtitle(workspace.name)}
                  title={t.kanbanSettings.title}
                  onClick={() => {
                    setWorkspaceSettings(workspace)
                    setSettingsError(null)
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.55 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.55a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.45 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.12.37.33.71.6 1 .3.28.7.43 1.1.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
                  </svg>
                </button>
              </article>
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

      {workspaceSettings ? (
        <SettingsModal
          workspace={workspaceSettings}
          errorMessage={settingsError}
          isSavingWorkspace={isSavingSettings}
          onClose={() => {
            setWorkspaceSettings(null)
            setSettingsError(null)
            setIsConfirmingWorkspaceDeletion(false)
          }}
          onToggleKanbanMode={handleToggleWorkspaceMode}
          onDeleteWorkspace={() => setIsConfirmingWorkspaceDeletion(true)}
        />
      ) : null}

      {workspaceSettings && isConfirmingWorkspaceDeletion ? (
        <ConfirmModal
          title={t.kanbanSettings.deleteWorkspaceTitle}
          message={t.kanbanSettings.deleteWorkspaceMessage(workspaceSettings.name)}
          isConfirming={isSavingSettings}
          onCancel={() => {
            if (!isSavingSettings) setIsConfirmingWorkspaceDeletion(false)
          }}
          onConfirm={() => void handleDeleteWorkspace()}
        />
      ) : null}
    </AuthenticatedLayout>
  )
}
