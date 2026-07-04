import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/api/users'
import { removeTokens } from '../services/auth-storage'
import { Toolbar } from './Toolbar'
import '../styles/workspaces.css'

const THEME_KEY = 'todo-list:theme'

type AuthenticatedLayoutProps = {
  children: ReactNode
  searchValue: string
  onSearchChange: (value: string) => void
  searchLabel: string
  searchPlaceholder: string
}

export function AuthenticatedLayout({
  children,
  searchValue,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
}: AuthenticatedLayoutProps) {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [isDarkTheme, setIsDarkTheme] = useState(
    () => localStorage.getItem(THEME_KEY) === 'dark',
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser(controller.signal)
        setUserName(user.name)
      } catch {
        if (!controller.signal.aborted) {
          setUserName('Usuário')
        }
      }
    }

    void loadCurrentUser()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkTheme ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, isDarkTheme ? 'dark' : 'light')

    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [isDarkTheme])

  function handleLogout() {
    removeTokens()
    navigate('/login', { replace: true })
  }

  return (
    <div className="workspaces-page">
      <Toolbar
        isDarkTheme={isDarkTheme}
        userName={userName}
        searchValue={searchValue}
        searchLabel={searchLabel}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={onSearchChange}
        onThemeChange={() => setIsDarkTheme((current) => !current)}
        onLogout={handleLogout}
      />
      {children}
    </div>
  )
}
