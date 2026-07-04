import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearCurrentUserCache, getCurrentUser } from '../services/api/users'
import { removeTokens } from '../services/auth-storage'
import { Toolbar } from './Toolbar'
import '../styles/workspaces.css'

const THEME_KEY = 'todo-list:theme'

type AuthenticatedLayoutProps = {
  children: ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchLabel?: string
  searchPlaceholder?: string
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
    let isActive = true

    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser()
        if (isActive) setUserName(user.name)
      } catch {
        if (isActive) setUserName('Usuário')
      }
    }

    void loadCurrentUser()
    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkTheme ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, isDarkTheme ? 'dark' : 'light')

    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [isDarkTheme])

  function handleLogout() {
    clearCurrentUserCache()
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
