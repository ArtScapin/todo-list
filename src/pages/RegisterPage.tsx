import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { AuthLocaleSelect } from '../components/AuthLocaleSelect'
import { register } from '../services/api/auth'
import { ApiError } from '../services/api/api'
import { ThemeSwitch } from '../components/ThemeSwitch'
import { applyTheme, getStoredTheme } from '../services/theme'
import '../styles/auth.css'

export function RegisterPage() {
  const { locale, setLocale, t } = useI18n()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(() => getStoredTheme() === 'dark')

  useEffect(() => {
    applyTheme(isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (password !== passwordConfirmation) {
      setErrorMessage(t.auth.passwordsMismatch)
      return
    }

    setIsLoading(true)

    try {
      await register({ name, username, password })
      navigate('/login', { replace: true })
    } catch (error) {
      const hasApiResponse = error instanceof ApiError && error.status !== undefined

      setErrorMessage(
        hasApiResponse
          ? t.auth.registerApiError
          : t.auth.apiUnavailable,
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="register-title">
        <header className="login-header">
          <span className="brand-mark" aria-hidden="true">{'\u2713'}</span>
          <h1 id="register-title">{t.auth.registerTitle}</h1>
          <p>{t.auth.registerSubtitle}</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="name">{t.auth.name}</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={t.auth.namePlaceholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label htmlFor="username">{t.auth.username}</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder={t.auth.usernameRegisterPlaceholder}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label htmlFor="password">{t.auth.password}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={t.auth.passwordRegisterPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label htmlFor="password-confirmation">{t.auth.passwordConfirmation}</label>
          <input
            id="password-confirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            placeholder={t.auth.passwordConfirmationPlaceholder}
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />

          {errorMessage ? (
            <div className="feedback error" role="alert">{errorMessage}</div>
          ) : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? t.auth.registering : t.auth.register}
          </button>

          <p className="form-navigation">
            {t.auth.haveAccount} <Link to="/login">{t.auth.loginLink}</Link>
          </p>
        </form>

        <div className="auth-preferences">
          <ThemeSwitch
            isDarkTheme={isDarkTheme}
            ariaLabel={t.toolbar.toggleTheme}
            onToggle={() => setIsDarkTheme((current) => !current)}
          />
          <AuthLocaleSelect
            locale={locale}
            onLocaleChange={setLocale}
          />
        </div>
      </section>
    </main>
  )
}
