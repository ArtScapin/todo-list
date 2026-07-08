import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/AuthenticatedLayout'
import { ListModal } from '../components/ListModal'
import { PageLoader } from '../components/PageLoader'
import { useI18n } from '../i18n'
import { ApiError } from '../services/api/api'
import { createList, getLists, updateList, type KanbanList } from '../services/api/lists'
import { getWorkspace, updateWorkspace, type Workspace } from '../services/api/workspaces'
import '../styles/lists.css'

export function ListsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { workspaceId } = useParams()
  const parsedWorkspaceId = Number(workspaceId)
  const isValidWorkspaceId = Number.isInteger(parsedWorkspaceId) && parsedWorkspaceId > 0
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [lists, setLists] = useState<KanbanList[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editingList, setEditingList] = useState<KanbanList | null>(null)
  const [isEditingWorkspaceName, setIsEditingWorkspaceName] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [isSavingWorkspaceName, setIsSavingWorkspaceName] = useState(false)
  const [workspaceNameError, setWorkspaceNameError] = useState<string | null>(null)
  const [isSavingViewMode, setIsSavingViewMode] = useState(false)

  useEffect(() => {
    if (!isValidWorkspaceId) {
      return
    }

    const controller = new AbortController()

    async function loadPage() {
      try {
        const [workspaceData, listsData] = await Promise.all([
          getWorkspace(parsedWorkspaceId, controller.signal),
          getLists(parsedWorkspaceId, controller.signal),
        ])
        setWorkspace(workspaceData)
        setWorkspaceName(workspaceData.name)
        setLists(listsData.sort((first, second) => first.position - second.position))
      } catch {
        if (!controller.signal.aborted) {
          setErrorMessage(t.lists.loadError)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadPage()
    return () => controller.abort()
  }, [isValidWorkspaceId, parsedWorkspaceId, t.lists.loadError])

  const filteredLists = lists.filter((list) =>
    list.name.toLocaleLowerCase().includes(searchValue.trim().toLocaleLowerCase()),
  )
  const pageError = isValidWorkspaceId ? errorMessage : t.lists.invalidWorkspace

  function closeModal() {
    setIsModalOpen(false)
    setEditingList(null)
    setSaveError(null)
  }

  function openCreateModal() {
    setEditingList(null)
    setIsModalOpen(true)
  }

  function openEditModal(list: KanbanList) {
    setEditingList(list)
    setIsModalOpen(true)
  }

  async function handleSaveList(name: string, color: string) {
    if (!isValidWorkspaceId) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      if (editingList) {
        const updatedList = await updateList(editingList.id, {
          name,
          color,
          status: editingList.status,
          position: editingList.position,
        })
        setLists((current) => current.map((list) => (
          list.id === updatedList.id ? updatedList : list
        )))
      } else {
        const nextPosition = lists.length === 0
          ? 0
          : Math.max(...lists.map((list) => list.position)) + 1
        const createdList = await createList(parsedWorkspaceId, {
          name,
          color,
          status: false,
          position: nextPosition,
        })
        setLists((current) => [...current, createdList])
      }
      closeModal()
    } catch (error) {
      const hasApiResponse = error instanceof ApiError && error.status !== undefined
      setSaveError(
        hasApiResponse
          ? t.lists.saveError
          : t.lists.saveApiError,
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleWorkspaceNameSave() {
    if (!workspace || isSavingWorkspaceName) return

    const normalizedName = workspaceName.trim()

    if (!normalizedName || normalizedName === workspace.name) {
      setWorkspaceName(workspace.name)
      setIsEditingWorkspaceName(false)
      return
    }

    setIsSavingWorkspaceName(true)
    setWorkspaceNameError(null)

    try {
      const updatedWorkspace = await updateWorkspace(workspace.id, {
        name: normalizedName,
        isKanbanViewMode: Boolean(workspace.isKanbanViewMode),
      })
      setWorkspace(updatedWorkspace)
      setWorkspaceName(updatedWorkspace.name)
    } catch {
      setWorkspaceName(workspace.name)
      setWorkspaceNameError(t.lists.renameError)
    } finally {
      setIsSavingWorkspaceName(false)
      setIsEditingWorkspaceName(false)
    }
  }

  async function handleViewModeChange() {
    if (!workspace || isSavingViewMode) return
    const isKanbanViewMode = !workspace.isKanbanViewMode
    setIsSavingViewMode(true)
    setWorkspaceNameError(null)

    try {
      const updatedWorkspace = await updateWorkspace(workspace.id, {
        name: workspace.name,
        isKanbanViewMode,
      })
      setWorkspace(updatedWorkspace)

      if (updatedWorkspace.isKanbanViewMode) {
        navigate(`/workspaces/${workspace.id}/board`)
      }
    } catch {
      setWorkspaceNameError(t.lists.toggleViewError)
    } finally {
      setIsSavingViewMode(false)
    }
  }

  if (isLoading && isValidWorkspaceId) {
    return (
      <AuthenticatedLayout
        searchValue={searchValue}
        searchLabel={t.lists.searchLabel}
        searchPlaceholder={t.lists.searchPlaceholder}
        onSearchChange={setSearchValue}
      >
        <main className="workspaces-content">
          <PageLoader label={t.lists.loadingWorkspace} />
        </main>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout
      searchValue={searchValue}
      searchLabel={t.lists.searchLabel}
      searchPlaceholder={t.lists.searchPlaceholder}
      onSearchChange={setSearchValue}
    >
      <main className="workspaces-content">
        <div className="lists-heading-row">
          <div className="lists-heading">
            <Link className="workspace-back" to="/workspaces">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t.common.workspace}
            </Link>
            {workspace && isEditingWorkspaceName ? (
              <input
                className="workspace-title-input"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                onBlur={() => void handleWorkspaceNameSave()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                }}
                aria-label={t.common.name}
                disabled={isSavingWorkspaceName}
                autoFocus
              />
            ) : workspace ? (
              <button
                className="workspace-title"
                type="button"
                onClick={() => setIsEditingWorkspaceName(true)}
              >
                <h1>{workspace.name}</h1>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </button>
            ) : null}
            <p>{t.lists.subtitle}</p>
            {workspaceNameError ? <span className="workspace-name-error" role="alert">{workspaceNameError}</span> : null}
          </div>
          <div className="lists-heading-actions">
            <div className="view-mode-control">
              <span>{t.common.kanban}</span>
              <button
                className={`theme-switch mode-switch ${workspace?.isKanbanViewMode ? 'active' : ''}`}
                type="button"
                role="switch"
                aria-checked={Boolean(workspace?.isKanbanViewMode)}
                aria-label={t.workspaceModal.toggleKanban}
                disabled={!workspace || isSavingViewMode}
                onClick={() => void handleViewModeChange()}
              >
                <span className="theme-switch-thumb" aria-hidden="true" />
              </button>
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={!workspace}
              onClick={openCreateModal}
            >
              {t.common.createList}
            </button>
          </div>
        </div>

        {(!isLoading || !isValidWorkspaceId) && pageError ? (
          <div className="state-card error-state">
            <p>{pageError}</p>
            <Link className="secondary-button back-action" to="/workspaces">
              {t.common.back}
            </Link>
          </div>
        ) : null}

        {!isLoading && !pageError && lists.length === 0 ? (
          <div className="state-card empty-state">
            <h2>{t.lists.emptyTitle}</h2>
            <p>{t.lists.emptyDescription}</p>
          </div>
        ) : null}

        {!isLoading && !pageError && lists.length > 0 && filteredLists.length === 0 ? (
          <div className="state-card empty-state">
            <h2>{t.common.noResults}</h2>
            <p>{t.lists.noResults}</p>
          </div>
        ) : null}

        {!isLoading && !pageError && filteredLists.length > 0 ? (
          <section className="lists-grid" aria-label={t.lists.gridLabel}>
            {filteredLists.map((list) => (
              <article
                className="list-card"
                key={list.id}
                style={{ borderTopColor: list.color || '#2563eb' }}
              >
                <Link
                  className="list-card-link"
                  to={`/workspaces/${parsedWorkspaceId}/lists/${list.id}`}
                >
                  <header className="list-card-header">
                    <div>
                      <h2>{list.name}</h2>
                      <p>{list.status ? t.lists.completed : t.lists.pending}</p>
                    </div>
                  </header>
                </Link>
                <button
                  className="list-edit-button"
                  type="button"
                  aria-label={t.lists.editAria(list.name)}
                  title={t.lists.editTitle}
                  onClick={() => openEditModal(list)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </svg>
                </button>
              </article>
            ))}
          </section>
        ) : null}
      </main>

      {isModalOpen ? (
        <ListModal
          list={editingList}
          isSaving={isSaving}
          errorMessage={saveError}
          onClose={closeModal}
          onSubmit={handleSaveList}
        />
      ) : null}
    </AuthenticatedLayout>
  )
}
