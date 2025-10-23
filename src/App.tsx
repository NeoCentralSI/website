import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { NotificationProvider } from './hooks/useNotifications'
import { Toaster } from './components/ui/sonner'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Profil from './pages/profil/Profil'
import Notifikasi from './pages/Notifikasi'
import ResetPassword from './pages/ResetPassword'

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/notifikasi" element={<Notifikasi />} />
          </Routes>
          <Toaster position="top-right" />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
