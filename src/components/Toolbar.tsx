import { useEffect, useRef, useState } from 'react'
import './Toolbar.css'

type ToolbarProps = {
  isDarkTheme: boolean
  searchValue: string
  onSearchChange: (value: string) => void
  onThemeChange: () => void
  onLogout: () => void
}

export function Toolbar({
  isDarkTheme,
  searchValue,
  onSearchChange,
  onThemeChange,
  onLogout,
}: ToolbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
          <div
            className={`toolbar-search ${isSearchOpen ? 'open' : ''}`}
            onBlur={(event) => {
              const focusStayedInside = event.currentTarget.contains(event.relatedTarget)

              if (!focusStayedInside && !searchValue.trim()) {
                setIsSearchOpen(false)
              }
            }}
          >
            {isSearchOpen ? (
              <input
                ref={searchInputRef}
                type="search"
                aria-label="Buscar workspaces"
                placeholder="Buscar workspace..."
                value={searchValue}
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
              aria-label={isSearchOpen ? 'Fechar busca' : 'Buscar workspaces'}
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
