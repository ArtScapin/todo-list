import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../services/api'
import { register } from '../services/auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (password !== passwordConfirmation) {
      setErrorMessage('As senhas não coincidem.')
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
          ? 'Não foi possível realizar o cadastro. Verifique os dados informados.'
          : 'Não conseguimos conectar à API. Verifique se o servidor está disponível.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="register-title">
        <header className="login-header">
          <span className="brand-mark" aria-hidden="true">✓</span>
          <h1 id="register-title">Criar conta</h1>
          <p>Cadastre-se para começar a organizar suas tarefas.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Digite seu nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Escolha um username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Crie uma senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label htmlFor="password-confirmation">Confirmar senha</label>
          <input
            id="password-confirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            placeholder="Digite a senha novamente"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />

          {errorMessage ? (
            <div className="feedback error" role="alert">{errorMessage}</div>
          ) : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>

          <p className="form-navigation">
            Já possui uma conta? <Link to="/login">Entrar</Link>
          </p>
        </form>
      </section>
    </main>
  )
}
