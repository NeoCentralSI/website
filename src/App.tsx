import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { NotificationProvider } from './hooks/useNotifications'
import { Toaster } from './components/ui/sonner'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Profil from './pages/profil/Profil'
import Notifikasi from './pages/Notifikasi'
import ResetPassword from './pages/ResetPassword'
import StudentGuidancePage from './pages/tugas-akhir/student/StudentGuidance'
import GuidanceDetailPage from './pages/tugas-akhir/student/GuidanceDetail'
import StudentProgressPage from './pages/tugas-akhir/student/Progress'
import GuidanceHistoryPage from './pages/tugas-akhir/student/History'
import ActivityLogPage from './pages/tugas-akhir/student/Activity'
import SupervisorsPage from './pages/tugas-akhir/student/Supervisors'

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
            {/* Student - Tugas Akhir - Bimbingan */}
            <Route path="/tugas-akhir/bimbingan" element={<StudentGuidancePage />} />
            <Route path="/tugas-akhir/bimbingan/progress" element={<StudentProgressPage />} />
            <Route path="/tugas-akhir/bimbingan/history" element={<GuidanceHistoryPage />} />
            <Route path="/tugas-akhir/bimbingan/activity" element={<ActivityLogPage />} />
            <Route path="/tugas-akhir/bimbingan/supervisors" element={<SupervisorsPage />} />
            <Route path="/tugas-akhir/bimbingan/:guidanceId" element={<GuidanceDetailPage />} />
          </Routes>
          <Toaster position="top-right" />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
