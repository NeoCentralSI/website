import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { NotificationProvider } from './hooks/useNotifications'
import { Toaster } from './components/ui/sonner'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Profil from './pages/profil/Profil'
import Notifikasi from './pages/Notifikasi'
import ResetPassword from './pages/ResetPassword'
import ProtectedLayout from './components/layout/ProtectedLayout'
import BimbinganEntry from './pages/tugas-akhir/BimbinganEntry'
import StudentGuidancePage from './pages/tugas-akhir/student/StudentGuidance'
import GuidanceDetailPage from './pages/tugas-akhir/student/GuidanceDetail'
import StudentProgressPage from './pages/tugas-akhir/student/Progress'
import GuidanceHistoryPage from './pages/tugas-akhir/student/History'
import ActivityLogPage from './pages/tugas-akhir/student/Activity'
import SupervisorsPage from './pages/tugas-akhir/student/Supervisors'
import LecturerRequestsPage from './pages/tugas-akhir/lecturer/Requests'
import LecturerProgressPage from './pages/tugas-akhir/lecturer/Progress'
import LecturerProgressDetailPage from './pages/tugas-akhir/lecturer/ProgressDetail'
import LecturerMyStudentsPage from './pages/tugas-akhir/lecturer/MyStudents'
import LecturerEligibilityPage from './pages/tugas-akhir/lecturer/Eligibility'
import LecturerHistoryPage from './pages/tugas-akhir/lecturer/History'
import LecturerActivityPage from './pages/tugas-akhir/lecturer/Activity'

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected layout routes - sidebar persists */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/notifikasi" element={<Notifikasi />} />

              {/* Tugas Akhir - Bimbingan entry (role-based redirect) */}
              <Route path="/tugas-akhir/bimbingan" element={<BimbinganEntry />} />
              {/* Student - Tugas Akhir - Bimbingan */}
              <Route path="/tugas-akhir/bimbingan/student" element={<StudentGuidancePage />} />
              <Route path="/tugas-akhir/bimbingan/progress" element={<StudentProgressPage />} />
              <Route path="/tugas-akhir/bimbingan/history" element={<GuidanceHistoryPage />} />
              <Route path="/tugas-akhir/bimbingan/activity" element={<ActivityLogPage />} />
              <Route path="/tugas-akhir/bimbingan/supervisors" element={<SupervisorsPage />} />
              <Route path="/tugas-akhir/bimbingan/:guidanceId" element={<GuidanceDetailPage />} />

              {/* Lecturer - Tugas Akhir - Bimbingan */}
              <Route path="/tugas-akhir/bimbingan/lecturer/requests" element={<LecturerRequestsPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/my-students" element={<LecturerMyStudentsPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/progress" element={<LecturerProgressPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/progress/:studentId" element={<LecturerProgressDetailPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/eligibility" element={<LecturerEligibilityPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/history/:studentId" element={<LecturerHistoryPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/activity/:studentId" element={<LecturerActivityPage />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
