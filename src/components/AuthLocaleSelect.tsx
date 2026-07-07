import { useEffect, useRef, useState, type ReactElement } from 'react'
import { type Locale, useI18n } from '../i18n'
import './PreferencesControls.css'

function FlagBrazil() {
  return (
    <svg viewBox="0 0 26 18" aria-hidden="true" focusable="false">
      <rect width="26" height="18" rx="3" fill="#1F8F46" />
      <path d="M13 2.4 21 9l-8 6.6L5 9 13 2.4Z" fill="#FACC15" />
      <circle cx="13" cy="9" r="3.4" fill="#1D4ED8" />
    </svg>
  )
}

function FlagUsa() {
  return (
    <svg viewBox="0 0 26 18" aria-hidden="true" focusable="false">
      <rect width="26" height="18" rx="3" fill="#fff" />
      <path d="M0 0h26v2H0zm0 4h26v2H0zm0 4h26v2H0zm0 4h26v2H0zm0 4h26v2H0" fill="#B91C1C" />
      <rect width="11" height="10" rx="3" fill="#1D4ED8" />
      <g fill="#fff">
        <circle cx="2.2" cy="2.2" r=".6" />
        <circle cx="5.2" cy="2.2" r=".6" />
        <circle cx="8.2" cy="2.2" r=".6" />
        <circle cx="3.7" cy="4.2" r=".6" />
        <circle cx="6.7" cy="4.2" r=".6" />
        <circle cx="2.2" cy="6.2" r=".6" />
        <circle cx="5.2" cy="6.2" r=".6" />
        <circle cx="8.2" cy="6.2" r=".6" />
      </g>
    </svg>
  )
}

function FlagSpain() {
  return (
    <svg viewBox="0 0 26 18" aria-hidden="true" focusable="false">
      <rect width="26" height="18" rx="3" fill="#B91C1C" />
      <rect y="4.5" width="26" height="9" fill="#F59E0B" />
    </svg>
  )
}

type AuthLocaleSelectProps = {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
}

const localeIcons: Record<Locale, ReactElement> = {
  'pt-BR': <FlagBrazil />,
  'en-US': <FlagUsa />,
  'es-ES': <FlagSpain />,
}

const locales: Locale[] = ['pt-BR', 'en-US', 'es-ES']

export function AuthLocaleSelect({ locale, onLocaleChange }: AuthLocaleSelectProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <div className="auth-locale-select" ref={containerRef}>
      <button
        type="button"
        className={`auth-locale-trigger ${isOpen ? 'open' : ''}`}
        aria-label={t.toolbar.language}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="flag-icon">{localeIcons[locale]}</span>
        <span className="auth-locale-caret" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="auth-locale-menu" role="menu" aria-label={t.toolbar.language}>
          {locales.map((nextLocale) => (
            <button
              key={nextLocale}
              type="button"
              role="menuitemradio"
              aria-checked={locale === nextLocale}
              className={`auth-locale-option ${locale === nextLocale ? 'active' : ''}`}
              title={t.localeNames[nextLocale]}
              onClick={() => {
                onLocaleChange(nextLocale)
                setIsOpen(false)
              }}
            >
              <span className="flag-icon">{localeIcons[nextLocale]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
