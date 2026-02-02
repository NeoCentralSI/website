import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider, NotificationProvider, useAuth } from '@/hooks/shared'
import { Toaster } from './components/ui/sonner'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Profil from './pages/profil/Profil'
import MicrosoftCallback from './pages/auth/MicrosoftCallback'
import ResetPassword from './pages/ResetPassword'
import ProtectedLayout from './components/layout/ProtectedLayout'
import Placeholder from './pages/Placeholder'
// Tugas Akhir - Bimbingan Module
import BimbinganEntry from './pages/tugas-akhir/bimbingan/BimbinganEntry'
import StudentGuidancePage from './pages/tugas-akhir/bimbingan/student/StudentGuidance'
import StudentGuidanceSessionPage from './pages/tugas-akhir/bimbingan/student/GuidanceSession'
import GuidanceHistoryPage from './pages/tugas-akhir/bimbingan/student/History'
import SupervisorsPage from './pages/tugas-akhir/bimbingan/student/Supervisors'
import StudentMilestonePage from './pages/tugas-akhir/bimbingan/student/Milestone'
import CompletedHistoryPage from './pages/tugas-akhir/bimbingan/student/CompletedHistory'
import LecturerRequestsPage from './pages/tugas-akhir/bimbingan/lecturer/Requests'
import LecturerScheduledPage from './pages/tugas-akhir/bimbingan/lecturer/Scheduled'
import LecturerGuidanceSessionPage from './pages/tugas-akhir/bimbingan/lecturer/GuidanceSession'
import LecturerMyStudentsPage from './pages/tugas-akhir/bimbingan/lecturer/MyStudents'
import LecturerMyStudentDetailPage from './pages/tugas-akhir/bimbingan/lecturer/MyStudentDetail'
import LecturerHistoryPage from './pages/tugas-akhir/bimbingan/lecturer/History'
import SecretaryKelolaTugasAkhirPage from './pages/tugas-akhir/bimbingan/secretary/TugasAkhir'
// Tugas Akhir - Monitoring Module
import MonitoringDashboard from './pages/tugas-akhir/monitoring/MonitoringDashboard'
import StudentProgressDetail from './pages/tugas-akhir/monitoring/StudentProgressDetail'
// Master Data
import UserManagementPage from './pages/master-data/UserManagement'
import AcademicYearPage from './pages/master-data/AcademicYear'
import MahasiswaPage from './pages/master-data/Mahasiswa'
import MahasiswaDetailPage from './pages/master-data/MahasiswaDetail'
import DosenPage from './pages/master-data/Dosen'
import DosenDetailPage from './pages/master-data/DosenDetail'
// Kelola
import KelolaTugasAkhirKadepPage from './pages/kelola/kadep/KelolaTugasAkhir'
import KelolaSopPage from './pages/kelola/Sop'
// Guards
import KerjaPraktekGuard from './pages/guards/KerjaPraktekGuard'
import TugasAkhirGuard from './pages/guards/TugasAkhirGuard'
import MetopelGuard from './pages/guards/MetopelGuard'
// Others
import NotFoundPage from './pages/NotFound'
import { getAuthTokens } from './services/auth.service'
import { Spinner } from './components/ui/spinner'

const RootRoute = () => {
  const { isLoading, isLoggedIn } = useAuth()
  const { accessToken, refreshToken } = getAuthTokens()
  const hasStoredSession = Boolean(accessToken || refreshToken)

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  if (hasStoredSession && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return <Landing />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/microsoft/callback" element={<MicrosoftCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected layout routes - sidebar persists */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profil" element={<Profil />} />
    

              {/* Placeholder routes for main + submenu entries */}
              {/* Kerja Praktek - Protected by eligibility guard */}
              <Route element={<KerjaPraktekGuard />}>
                <Route path="/kerja-praktik" element={<Placeholder title="main menu Kerja Praktek" />} />
                <Route path="/kerja-praktik/pendaftaran" element={<Placeholder title="Kerja Praktek - Pendaftaran" />} />
                <Route path="/kerja-praktik/logbook" element={<Placeholder title="Kerja Praktek - Log Book" />} />
                <Route path="/kerja-praktik/seminar" element={<Placeholder title="Kerja Praktek - Seminar" />} />
                <Route path="/kerja-praktik/bimbingan" element={<Placeholder title="Kerja Praktek - Bimbingan" />} />
                <Route path="/kerja-praktik/acc-proposal" element={<Placeholder title="Kerja Praktek - ACC Proposal" />} />
                <Route path="/kerja-praktik/surat-pengantar" element={<Placeholder title="Kerja Praktek - Surat Pengantar" />} />
                <Route path="/kerja-praktik/data" element={<Placeholder title="Kerja Praktek - Data KP" />} />
              </Route>

              {/* Metode Penelitian - Protected by eligibility guard */}
              <Route element={<MetopelGuard />}>
                <Route path="/metopel" element={<Placeholder title="main menu Metodologi Penelitian" />} />
              </Route>

              {/* Tugas Akhir - Protected by eligibility guard for student routes */}
              <Route element={<TugasAkhirGuard />}>
                <Route path="/tugas-akhir" element={<Placeholder title="main menu Tugas Akhir" />} />
                <Route path="/tugas-akhir/seminar" element={<Placeholder title="Tugas Akhir - Seminar" />} />
                <Route path="/tugas-akhir/sidang" element={<Placeholder title="Tugas Akhir - Sidang" />} />
                <Route path="/yudisium" element={<Placeholder title="Yudisium" />} />
                {/* Student - Tugas Akhir - Bimbingan */}
                <Route path="/tugas-akhir/bimbingan" element={<BimbinganEntry />} />
                <Route path="/tugas-akhir/bimbingan/student" element={<StudentGuidancePage />} />
                <Route path="/tugas-akhir/bimbingan/student/session/:guidanceId" element={<StudentGuidanceSessionPage />} />
                <Route path="/tugas-akhir/bimbingan/history" element={<GuidanceHistoryPage />} />
                <Route path="/tugas-akhir/bimbingan/supervisors" element={<SupervisorsPage />} />
                {/* Student - Tugas Akhir - Milestone */}
                <Route path="/tugas-akhir/bimbingan/milestone" element={<StudentMilestonePage />} />
                {/* Student - Tugas Akhir - Completed History */}
                <Route path="/tugas-akhir/bimbingan/completed-history" element={<CompletedHistoryPage />} />
              </Route>

              {/* Tugas Akhir - Lecturer routes (no guard, different role) */}
              <Route path="/tugas-akhir/bimbingan/lecturer/requests" element={<LecturerRequestsPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/scheduled" element={<LecturerScheduledPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/session/:guidanceId" element={<LecturerGuidanceSessionPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/my-students" element={<LecturerMyStudentsPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/my-students/:thesisId" element={<LecturerMyStudentDetailPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/history/:studentId" element={<LecturerHistoryPage />} />

              {/* Tugas Akhir - Non-student routes (monitoring, etc) */}
              <Route path="/tugas-akhir/kelola-penguji" element={<Placeholder title="Tugas Akhir - Kelola Penguji" />} />
              <Route path="/tugas-akhir/monitoring" element={<MonitoringDashboard />} />
              <Route path="/tugas-akhir/monitoring/:thesisId" element={<StudentProgressDetail />} />
              <Route path="/tugas-akhir/acc-pembimbing" element={<Placeholder title="Tugas Akhir - ACC Pembimbing" />} />
              <Route path="/tugas-akhir/acc-rubrik" element={<Placeholder title="Tugas Akhir - ACC Rubrik Penilaian" />} />
              <Route path="/tugas-akhir/kelola-rubrik" element={<Placeholder title="Tugas Akhir - Kelola Rubrik" />} />
              <Route path="/tugas-akhir/kelola-yudisium" element={<Placeholder title="Tugas Akhir - Kelola Yudisium" />} />
              <Route path="/tugas-akhir/data" element={<Placeholder title="Tugas Akhir - Data" />} />
              <Route path="/tugas-akhir/jadwal-seminar" element={<Placeholder title="Tugas Akhir - Penjadwalan Seminar" />} />
              <Route path="/tugas-akhir/jadwal-sidang" element={<Placeholder title="Tugas Akhir - Penjadwalan Sidang" />} />

              {/* Kelola - Sekretaris */}
              <Route path="/kelola" element={<Placeholder title="main menu Kelola" />} />
              <Route path="/kelola/kerja-praktik" element={<Placeholder title="Kelola - Kerja Praktek" />} />
              <Route path="/kelola/tugas-akhir" element={<Navigate to="/kelola/tugas-akhir/topik" replace />} />
              <Route path="/kelola/tugas-akhir/topik" element={<SecretaryKelolaTugasAkhirPage />} />
              <Route path="/kelola/tugas-akhir/monitor" element={<SecretaryKelolaTugasAkhirPage />} />
              <Route path="/kelola/tugas-akhir/milestone" element={<SecretaryKelolaTugasAkhirPage />} />
              <Route path="/kelola/tugas-akhir/rubrik-seminar" element={<SecretaryKelolaTugasAkhirPage />} />
              <Route path="/kelola/tugas-akhir/rubrik-sidang" element={<SecretaryKelolaTugasAkhirPage />} />
              <Route path="/kelola/yudisium" element={<Placeholder title="Kelola - Yudisium" />} />
              
              {/* Kelola - Kadep */}
              <Route path="/kelola/tugas-akhir/kadep" element={<Navigate to="/kelola/tugas-akhir/kadep/pergantian" replace />} />
              <Route path="/kelola/tugas-akhir/kadep/pergantian" element={<KelolaTugasAkhirKadepPage />} />
              <Route path="/kelola/tugas-akhir/kadep/data" element={<KelolaTugasAkhirKadepPage />} />
              <Route path="/kelola/tugas-akhir/kadep/penguji" element={<KelolaTugasAkhirKadepPage />} />
              <Route path="/kelola/tugas-akhir/kadep/pembimbing" element={<KelolaTugasAkhirKadepPage />} />
              <Route path="/kelola/tugas-akhir/kadep/acc-rubrik" element={<KelolaTugasAkhirKadepPage />} />
              <Route path="/kelola/sop" element={<KelolaSopPage />} />

              {/* Master Data (Admin) */}
              <Route path="/master-data" element={<Placeholder title="main menu Master Data" />} />
              <Route path="/master-data/mahasiswa" element={<MahasiswaPage />} />
              <Route path="/master-data/mahasiswa/:id" element={<MahasiswaDetailPage />} />
              <Route path="/master-data/dosen" element={<DosenPage />} />
              <Route path="/master-data/dosen/:id" element={<DosenDetailPage />} />
              <Route path="/master-data/user" element={<UserManagementPage />} />
              <Route path="/master-data/tahun-ajaran" element={<AcademicYearPage />} />
            </Route>

            {/* 404 - Catch all undefined routes (outside ProtectedLayout) */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster position="top-right" visibleToasts={1} closeButton />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
