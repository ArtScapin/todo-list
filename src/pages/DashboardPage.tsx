import { useNavigate } from 'react-router-dom'
import { removeToken } from '../services/auth'

export function DashboardPage() {
  const navigate = useNavigate()

  function handleLogout() {
    removeToken()
    navigate('/login', { replace: true })
  }

  return (
    <main className="authenticated-page" aria-label="Área logada">
      <button className="logout-button" type="button" onClick={handleLogout}>
        Logout
      </button>
    </main>
  )
}
