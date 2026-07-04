import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { WorkspacesPage } from './pages/WorkspacesPage'
import { ListsPage } from './pages/ListsPage'
import { ItemsPage } from './pages/ItemsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { hasStoredSession } from './services/auth-storage'
import './App.css'

function ProtectedRoute() {
  return hasStoredSession() ? <Outlet /> : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={hasStoredSession() ? <Navigate to="/workspaces" replace /> : <LoginPage />}
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:workspaceId/lists" element={<ListsPage />} />
          <Route path="/workspaces/:workspaceId/lists/:listId" element={<ItemsPage />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={hasStoredSession() ? '/workspaces' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
