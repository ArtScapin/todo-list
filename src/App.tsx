import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { WorkspacesPage } from './pages/WorkspacesPage'
import { ListsPage } from './pages/ListsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { getToken } from './services/auth-storage'
import './App.css'

function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />
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
        <Route element={<ProtectedRoute />}>
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:workspaceId/lists" element={<ListsPage />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={getToken() ? '/workspaces' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
