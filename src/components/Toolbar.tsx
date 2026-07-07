import { useEffect, useRef, useState } from 'react'
import { type Locale, useI18n } from '../i18n'
import { LocaleFlags } from './LocaleFlags'
import { ThemeSwitch } from './ThemeSwitch'
import './Toolbar.css'

type ToolbarProps = {
  isDarkTheme: boolean
  locale: Locale
  userName: string
  searchValue?: string
  searchLabel?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  onThemeChange: () => void
  onLocaleChange: (locale: Locale) => void
  onLogout: () => void
}

export function Toolbar({
  isDarkTheme,
  locale,
  userName,
  searchValue,
  searchLabel,
  searchPlaceholder,
  onSearchChange,
  onThemeChange,
  onLocaleChange,
  onLogout,
}: ToolbarProps) {
  const { t } = useI18n()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const currentSearchValue = searchValue ?? ''
  const currentSearchLabel = searchLabel ?? t.common.search
  const currentSearchPlaceholder = searchPlaceholder ?? t.toolbar.searchPlaceholder
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
          <span className="toolbar-logo" aria-hidden="true">{'\u2713'}</span>
          <span>{t.common.appName}</span>
        </div>

        <div className="toolbar-actions">
          {onSearchChange ? (
            <div
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
                  placeholder={currentSearchPlaceholder}
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
                aria-label={isSearchOpen ? t.toolbar.closeSearch : currentSearchLabel}
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
          ) : null}

          <div className="toolbar-menu" ref={menuRef}>
            <button
              className="menu-button"
              type="button"
              aria-label={t.toolbar.openMenu}
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
                  <strong>{userName || t.common.userFallback}</strong>
                </div>
                <div className="menu-separator" />
                <div className="theme-option">
                  <span>{t.toolbar.theme}</span>
                  <ThemeSwitch
                    isDarkTheme={isDarkTheme}
                    ariaLabel={t.toolbar.toggleTheme}
                    onToggle={onThemeChange}
                  />
                </div>
                <LocaleFlags locale={locale} onLocaleChange={onLocaleChange} />
                <button className="menu-logout" type="button" onClick={onLogout}>
                  {t.toolbar.logout}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
