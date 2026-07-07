import './PreferencesControls.css'

type ThemeSwitchProps = {
  isDarkTheme: boolean
  ariaLabel: string
  onToggle: () => void
}

export function ThemeSwitch({ isDarkTheme, ariaLabel, onToggle }: ThemeSwitchProps) {
  return (
    <button
      className={`theme-switch ${isDarkTheme ? 'active' : ''}`}
      type="button"
      role="switch"
      aria-checked={isDarkTheme}
      aria-label={ariaLabel}
      onClick={onToggle}
    >
      <span />
    </button>
  )
}
