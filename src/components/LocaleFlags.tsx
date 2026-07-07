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

type LocaleFlagsProps = {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  className?: string
}

export function LocaleFlags({ locale, onLocaleChange, className }: LocaleFlagsProps) {
  const { t } = useI18n()

  return (
    <div className={className ?? 'locale-flags'} role="group" aria-label={t.toolbar.language}>
      <button
        className={`locale-flag ${locale === 'pt-BR' ? 'active' : ''}`}
        type="button"
        aria-label={t.localeNames['pt-BR']}
        title={t.localeNames['pt-BR']}
        onClick={() => onLocaleChange('pt-BR')}
      >
        <span className="flag-icon">
          <FlagBrazil />
        </span>
      </button>
      <button
        className={`locale-flag ${locale === 'en-US' ? 'active' : ''}`}
        type="button"
        aria-label={t.localeNames['en-US']}
        title={t.localeNames['en-US']}
        onClick={() => onLocaleChange('en-US')}
      >
        <span className="flag-icon">
          <FlagUsa />
        </span>
      </button>
      <button
        className={`locale-flag ${locale === 'es-ES' ? 'active' : ''}`}
        type="button"
        aria-label={t.localeNames['es-ES']}
        title={t.localeNames['es-ES']}
        onClick={() => onLocaleChange('es-ES')}
      >
        <span className="flag-icon">
          <FlagSpain />
        </span>
      </button>
    </div>
  )
}
