import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/api/auth'
import { ApiError } from '../services/api/api'
import { saveTokens } from '../services/auth-storage'
import '../styles/auth.css'

type Feedback = {
  message: string
} | null

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    setIsLoading(true)

    try {
      const data = await login({ username, password })

      if (!data.token || !data.refreshToken) {
        setFeedback({
          message: 'A resposta da API não trouxe tokens válidos. Tente novamente.',
        })
        return
      }

      saveTokens(data)
      navigate('/workspaces', { replace: true })
    } catch (error) {
      const hasApiResponse = error instanceof ApiError && error.status !== undefined

      setFeedback({
        message: hasApiResponse
          ? 'Usuário ou senha incorretos. Confira os dados e tente novamente.'
          : 'Não conseguimos conectar à API. Verifique se o servidor está disponível.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <span className="brand-mark" aria-hidden="true">✓</span>
          <h1 id="login-title">ToDo List</h1>
          <p>Entre para organizar suas tarefas.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Digite seu username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
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
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="form-navigation">
            Ainda não possui uma conta? <Link to="/register">Cadastre-se</Link>
          </p>
        </form>
      </section>
    </main>
  )
}
