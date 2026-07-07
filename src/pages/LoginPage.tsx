import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { AuthLocaleSelect } from '../components/AuthLocaleSelect'
import { login } from '../services/api/auth'
import { ApiError } from '../services/api/api'
import { saveTokens } from '../services/auth-storage'
import { applyTheme, getStoredTheme } from '../services/theme'
import { ThemeSwitch } from '../components/ThemeSwitch'
import '../styles/auth.css'

type Feedback = {
  message: string
} | null

export function LoginPage() {
  const { locale, setLocale, t } = useI18n()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [isDarkTheme, setIsDarkTheme] = useState(() => getStoredTheme() === 'dark')

  useEffect(() => {
    applyTheme(isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    setIsLoading(true)

    try {
      const data = await login({ username, password })

      if (!data.token || !data.refreshToken) {
        setFeedback({
          message: t.auth.invalidTokens,
        })
        return
      }

      saveTokens(data)
      navigate('/workspaces', { replace: true })
    } catch (error) {
      const hasApiResponse = error instanceof ApiError && error.status !== undefined

      setFeedback({
        message: hasApiResponse
          ? t.auth.invalidCredentials
          : t.auth.apiUnavailable,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <span className="brand-mark" aria-hidden="true">{'\u2713'}</span>
          <h1 id="login-title">{t.auth.loginTitle}</h1>
          <p>{t.auth.loginSubtitle}</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">{t.auth.username}</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder={t.auth.usernamePlaceholder}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label htmlFor="password">{t.auth.password}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={t.auth.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {feedback ? (
            <div className="feedback error" role="alert">
              {feedback.message}
            </div>
          ) : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? t.auth.loggingIn : t.auth.login}
          </button>

          <p className="form-navigation">
            {t.auth.noAccount} <Link to="/register">{t.auth.registerLink}</Link>
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
