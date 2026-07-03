import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { WorkspacesPage } from './pages/WorkspacesPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { getToken } from './services/auth-storage'
import './App.css'

function ProtectedRoute() {
  return getToken() ? <WorkspacesPage /> : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={getToken() ? <Navigate to="/workspaces" replace /> : <LoginPage />}
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/workspaces" element={<ProtectedRoute />} />
        <Route
          path="*"
          element={<Navigate to={getToken() ? '/workspaces' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
