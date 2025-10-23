import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
