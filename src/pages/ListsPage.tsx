import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/AuthenticatedLayout'
import { ListModal } from '../components/ListModal'
import { ApiError } from '../services/api/api'
import { createList, getLists, updateList, type KanbanList } from '../services/api/lists'
import { getWorkspace, updateWorkspace, type Workspace } from '../services/api/workspaces'
import '../styles/lists.css'

export function ListsPage() {
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
          setErrorMessage('Não foi possível carregar as listas deste workspace.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadPage()
    return () => controller.abort()
  }, [isValidWorkspaceId, parsedWorkspaceId])

  const filteredLists = lists.filter((list) =>
    list.name.toLocaleLowerCase().includes(searchValue.trim().toLocaleLowerCase()),
  )
  const pageError = isValidWorkspaceId ? errorMessage : 'Workspace inválido.'

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
          ? 'Não foi possível salvar a lista. Verifique os dados informados.'
          : 'Não conseguimos conectar à API. Tente novamente em instantes.',
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
      const updatedWorkspace = await updateWorkspace(workspace.id, normalizedName)
      setWorkspace(updatedWorkspace)
      setWorkspaceName(updatedWorkspace.name)
    } catch {
      setWorkspaceName(workspace.name)
      setWorkspaceNameError('Não foi possível atualizar o nome do workspace.')
    } finally {
      setIsSavingWorkspaceName(false)
      setIsEditingWorkspaceName(false)
    }
  }

  return (
    <AuthenticatedLayout
      searchValue={searchValue}
      searchLabel="Buscar listas"
      searchPlaceholder="Buscar lista..."
      onSearchChange={setSearchValue}
    >
      <main className="workspaces-content">
        <div className="lists-heading-row">
          <div className="lists-heading">
            <Link className="workspace-back" to="/workspaces">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Workspace
            </Link>
            {isEditingWorkspaceName ? (
              <input
                className="workspace-title-input"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                onBlur={() => void handleWorkspaceNameSave()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                }}
                aria-label="Nome do workspace"
                disabled={isSavingWorkspaceName}
                autoFocus
              />
            ) : (
              <button
                className="workspace-title"
                type="button"
                disabled={!workspace}
                onClick={() => setIsEditingWorkspaceName(true)}
              >
                <h1>{workspace?.name ?? 'Listas'}</h1>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </button>
            )}
            <p>Listas deste workspace</p>
            {workspaceNameError ? <span className="workspace-name-error" role="alert">{workspaceNameError}</span> : null}
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={!workspace}
            onClick={openCreateModal}
          >
            + Nova lista
          </button>
        </div>

        {isLoading && isValidWorkspaceId ? <div className="state-card">Carregando listas...</div> : null}

        {(!isLoading || !isValidWorkspaceId) && pageError ? (
          <div className="state-card error-state">
            <p>{pageError}</p>
            <Link className="secondary-button back-action" to="/workspaces">
              Voltar
            </Link>
          </div>
        ) : null}

        {!isLoading && !pageError && lists.length === 0 ? (
          <div className="state-card empty-state">
            <h2>Nenhuma lista ainda</h2>
            <p>Este workspace ainda não possui listas.</p>
          </div>
        ) : null}

        {!isLoading && !pageError && lists.length > 0 && filteredLists.length === 0 ? (
          <div className="state-card empty-state">
            <h2>Nenhum resultado</h2>
            <p>Não encontramos uma lista com esse nome.</p>
          </div>
        ) : null}

        {!isLoading && !pageError && filteredLists.length > 0 ? (
          <section className="lists-grid" aria-label="Listas do workspace">
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
                      <p>{list.status ? 'Concluída' : 'Pendente'}</p>
                    </div>
                  </header>
                </Link>
                <button
                  className="list-edit-button"
                  type="button"
                  aria-label={`Editar ${list.name}`}
                  title="Editar lista"
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
