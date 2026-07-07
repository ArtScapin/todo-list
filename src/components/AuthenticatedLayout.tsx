import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { clearCurrentUserCache, getCurrentUser } from '../services/api/users'
import { removeTokens } from '../services/auth-storage'
import { applyTheme, getStoredTheme } from '../services/theme'
import { Toolbar } from './Toolbar'
import '../styles/workspaces.css'

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
  const { locale, setLocale, t } = useI18n()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [isDarkTheme, setIsDarkTheme] = useState(() => getStoredTheme() === 'dark')

  useEffect(() => {
    let isActive = true

    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser()
        if (isActive) setUserName(user.name)
      } catch {
        if (isActive) setUserName(t.common.userFallback)
      }
    }

    void loadCurrentUser()
    return () => {
      isActive = false
    }
  }, [t.common.userFallback])

  useEffect(() => {
    applyTheme(isDarkTheme ? 'dark' : 'light')
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
        locale={locale}
        onLocaleChange={setLocale}
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
