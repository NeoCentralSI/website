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
import Placeholder from './pages/Placeholder'
import BimbinganEntry from './pages/tugas-akhir/BimbinganEntry'
import StudentGuidancePage from './pages/tugas-akhir/student/StudentGuidance'
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
import NotFoundPage from './pages/NotFound'
import UserManagementPage from './pages/master-data/UserManagement'
import AcademicYearPage from './pages/master-data/AcademicYear'
import MahasiswaPage from './pages/master-data/Mahasiswa'
import DosenPage from './pages/master-data/Dosen'

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

              {/* Placeholder routes for main + submenu entries */}
              {/* Kerja Praktek */}
              <Route path="/kerja-praktik" element={<Placeholder title="main menu Kerja Praktek" />} />
              <Route path="/kerja-praktik/pendaftaran" element={<Placeholder title="Kerja Praktek - Pendaftaran" />} />
              <Route path="/kerja-praktik/logbook" element={<Placeholder title="Kerja Praktek - Log Book" />} />
              <Route path="/kerja-praktik/seminar" element={<Placeholder title="Kerja Praktek - Seminar" />} />
              <Route path="/kerja-praktik/bimbingan" element={<Placeholder title="Kerja Praktek - Bimbingan" />} />
              <Route path="/kerja-praktik/acc-proposal" element={<Placeholder title="Kerja Praktek - ACC Proposal" />} />
              <Route path="/kerja-praktik/surat-pengantar" element={<Placeholder title="Kerja Praktek - Surat Pengantar" />} />
              <Route path="/kerja-praktik/data" element={<Placeholder title="Kerja Praktek - Data KP" />} />

              {/* Tugas Akhir */}
              <Route path="/tugas-akhir" element={<Placeholder title="main menu Tugas Akhir" />} />
              <Route path="/metopel" element={<Placeholder title="main menu Metodologi Penelitian" />} />
              <Route path="/tugas-akhir/seminar" element={<Placeholder title="Tugas Akhir - Seminar" />} />
              <Route path="/tugas-akhir/sidang" element={<Placeholder title="Tugas Akhir - Sidang" />} />
              <Route path="/yudisium" element={<Placeholder title="Yudisium" />} />
              <Route path="/tugas-akhir/kelola-penguji" element={<Placeholder title="Tugas Akhir - Kelola Penguji" />} />
              <Route path="/tugas-akhir/monitoring" element={<Placeholder title="Tugas Akhir - Monitoring" />} />
              <Route path="/tugas-akhir/acc-pembimbing" element={<Placeholder title="Tugas Akhir - ACC Pembimbing" />} />
              <Route path="/tugas-akhir/acc-rubrik" element={<Placeholder title="Tugas Akhir - ACC Rubrik Penilaian" />} />
              <Route path="/tugas-akhir/kelola-rubrik" element={<Placeholder title="Tugas Akhir - Kelola Rubrik" />} />
              <Route path="/tugas-akhir/kelola-yudisium" element={<Placeholder title="Tugas Akhir - Kelola Yudisium" />} />
              <Route path="/tugas-akhir/data" element={<Placeholder title="Tugas Akhir - Data" />} />
              <Route path="/tugas-akhir/jadwal-seminar" element={<Placeholder title="Tugas Akhir - Penjadwalan Seminar" />} />
              <Route path="/tugas-akhir/jadwal-sidang" element={<Placeholder title="Tugas Akhir - Penjadwalan Sidang" />} />

              {/* Master Data (Admin) */}
              <Route path="/master-data" element={<Placeholder title="main menu Master Data" />} />
              <Route path="/master-data/mahasiswa" element={<MahasiswaPage />} />
              <Route path="/master-data/dosen" element={<DosenPage />} />
              <Route path="/master-data/user" element={<UserManagementPage />} />
              <Route path="/master-data/tahun-ajaran" element={<AcademicYearPage />} />

              {/* Tugas Akhir - Bimbingan entry (role-based redirect) */}
              <Route path="/tugas-akhir/bimbingan" element={<BimbinganEntry />} />
              {/* Student - Tugas Akhir - Bimbingan */}
              <Route path="/tugas-akhir/bimbingan/student" element={<StudentGuidancePage />} />
              <Route path="/tugas-akhir/bimbingan/progress" element={<StudentProgressPage />} />
              <Route path="/tugas-akhir/bimbingan/history" element={<GuidanceHistoryPage />} />
              <Route path="/tugas-akhir/bimbingan/activity" element={<ActivityLogPage />} />
              <Route path="/tugas-akhir/bimbingan/supervisors" element={<SupervisorsPage />} />
              {/* Guidance detail page removed; use dialog instead */}

              {/* Lecturer - Tugas Akhir - Bimbingan */}
              <Route path="/tugas-akhir/bimbingan/lecturer/requests" element={<LecturerRequestsPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/my-students" element={<LecturerMyStudentsPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/progress" element={<LecturerProgressPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/progress/:studentId" element={<LecturerProgressDetailPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/eligibility" element={<LecturerEligibilityPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/history/:studentId" element={<LecturerHistoryPage />} />
              <Route path="/tugas-akhir/bimbingan/lecturer/activity/:studentId" element={<LecturerActivityPage />} />
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
