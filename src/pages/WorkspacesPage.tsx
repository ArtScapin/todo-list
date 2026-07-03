import { useCallback, useEffect, useState } from 'react'
import { AuthenticatedLayout } from '../components/AuthenticatedLayout'
import { WorkspaceModal } from '../components/WorkspaceModal'
import { ApiError } from '../services/api/api'
import {
  createWorkspace,
  getWorkspaces,
  type Workspace,
} from '../services/api/workspaces'

export function WorkspacesPage() {
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
    } catch {
      if (!signal?.aborted) {
        setLoadError('Não foi possível carregar seus workspaces. Tente novamente.')
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadInitialWorkspaces() {
      try {
        const data = await getWorkspaces(controller.signal)
        setWorkspaces(data)
      } catch {
        if (!controller.signal.aborted) {
          setLoadError('Não foi possível carregar seus workspaces. Tente novamente.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialWorkspaces()
    return () => controller.abort()
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSaveError(null)
  }, [])

  async function handleCreateWorkspace(name: string) {
    setIsSaving(true)
    setSaveError(null)

    try {
      const workspace = await createWorkspace(name)
      setWorkspaces((current) => [...current, workspace])
      closeModal()
    } catch (error) {
      const hasApiResponse = error instanceof ApiError && error.status !== undefined
      setSaveError(
        hasApiResponse
          ? 'Não foi possível criar o workspace. Verifique o nome informado.'
          : 'Não conseguimos conectar à API. Tente novamente em instantes.',
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
        searchLabel="Buscar workspaces"
        searchPlaceholder="Buscar workspace..."
        onSearchChange={setSearchValue}
    >
      <main className="workspaces-content">
        <div className="workspaces-heading">
          <div>
            <p className="eyebrow">Seus projetos</p>
            <h1>Workspaces</h1>
          </div>
          <button className="primary-button" type="button" onClick={() => setIsModalOpen(true)}>
            + Novo workspace
          </button>
        </div>

        {isLoading ? <div className="state-card">Carregando workspaces...</div> : null}

        {!isLoading && loadError ? (
          <div className="state-card error-state">
            <p>{loadError}</p>
            <button className="secondary-button" type="button" onClick={() => void loadWorkspaces()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {!isLoading && !loadError && workspaces.length === 0 ? (
          <div className="state-card empty-state">
            <h2>Nenhum workspace ainda</h2>
            <p>Crie seu primeiro workspace para começar a organizar as tarefas.</p>
          </div>
        ) : null}

        {!isLoading && !loadError && workspaces.length > 0 && filteredWorkspaces.length === 0 ? (
          <div className="state-card empty-state">
            <h2>Nenhum resultado</h2>
            <p>Não encontramos um workspace com esse nome.</p>
          </div>
        ) : null}

        {!isLoading && !loadError && filteredWorkspaces.length > 0 ? (
          <section className="workspace-grid" aria-label="Lista de workspaces">
            {filteredWorkspaces.map((workspace) => (
              <article className="workspace-card" key={workspace.id}>
                <span className="workspace-icon" aria-hidden="true">W</span>
                <h2>{workspace.name}</h2>
                <p>Workspace</p>
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
    </AuthenticatedLayout>
  )
}
