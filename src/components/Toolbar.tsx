import { useEffect, useRef, useState } from 'react'
import './Toolbar.css'

type ToolbarProps = {
  isDarkTheme: boolean
  userName: string
  searchValue?: string
  searchLabel?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  onThemeChange: () => void
  onLogout: () => void
}

export function Toolbar({
  isDarkTheme,
  userName,
  searchValue,
  searchLabel,
  searchPlaceholder,
  onSearchChange,
  onThemeChange,
  onLogout,
}: ToolbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const currentSearchValue = searchValue ?? ''
  const currentSearchLabel = searchLabel ?? 'Buscar'
  const nameParts = userName.trim().split(/\s+/).filter(Boolean)
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts.at(-1)?.[0]}`
    : nameParts[0]?.slice(0, 2) || 'US'

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus()
    }
  }, [isSearchOpen])

  return (
    <header className="toolbar">
      <div className="toolbar-content">
        <div className="toolbar-brand">
          <span className="toolbar-logo" aria-hidden="true">✓</span>
          <span>ToDo List</span>
        </div>

        <div className="toolbar-actions">
          {onSearchChange ? <div
            className={`toolbar-search ${isSearchOpen ? 'open' : ''}`}
            onBlur={(event) => {
              const focusStayedInside = event.currentTarget.contains(event.relatedTarget)

              if (!focusStayedInside && !currentSearchValue.trim()) {
                setIsSearchOpen(false)
              }
            }}
          >
            {isSearchOpen ? (
              <input
                ref={searchInputRef}
                type="search"
                aria-label={currentSearchLabel}
                placeholder={searchPlaceholder ?? 'Buscar...'}
                value={currentSearchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    onSearchChange('')
                    setIsSearchOpen(false)
                  }
                }}
              />
            ) : null}
            <button
              className="search-button"
              type="button"
              aria-label={isSearchOpen ? 'Fechar busca' : currentSearchLabel}
              onClick={() => {
                if (isSearchOpen) {
                  onSearchChange('')
                }
                setIsSearchOpen((current) => !current)
              }}
            >
              <span aria-hidden="true" />
            </button>
          </div>
          : null}

          <div className="toolbar-menu" ref={menuRef}>
          <button
            className="menu-button"
            type="button"
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

            {isMenuOpen ? (
            <div className="menu-panel">
              <div className="menu-profile">
                <span className="menu-avatar" aria-hidden="true">
                  {initials.toLocaleUpperCase()}
                </span>
                <strong>{userName || 'Usuário'}</strong>
              </div>
              <div className="menu-separator" />
              <div className="theme-option">
                <span>Tema</span>
                <button
                  className={`theme-switch ${isDarkTheme ? 'active' : ''}`}
                  type="button"
                  role="switch"
                  aria-checked={isDarkTheme}
                  aria-label="Alternar tema claro e escuro"
                  onClick={onThemeChange}
                >
                  <span />
                </button>
              </div>
              <button className="menu-logout" type="button" onClick={onLogout}>
                Sair
              </button>
            </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
