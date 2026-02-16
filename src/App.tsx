import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider, NotificationProvider } from '@/hooks/shared'
import { Toaster } from './components/ui/sonner'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Profil from './pages/profil/Profil'
import MicrosoftCallback from './pages/auth/MicrosoftCallback'
import ActivationSuccess from './pages/auth/ActivationSuccess'
import AccountInactive from './pages/auth/AccountInactive'
import ActivationEmailSent from './pages/auth/ActivationEmailSent'
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
// Kerja Praktik
import InternshipProposalPage from './pages/kerja-praktik/student/registration/Proposal'
import InternshipProposalDetailPage from './pages/kerja-praktik/student/registration/ProposalDetail'
// Sekdep Internship
import SekdepInternshipProposalPage from './pages/kerja-praktik/sekdep/registration/Proposal'
import SekdepInternshipProposalDetailPage from './pages/kerja-praktik/sekdep/registration/ProposalDetail'
import SekdepCompanyListPage from './pages/kerja-praktik/sekdep/companies/CompanyList'
import AdminCompanyListPage from './pages/kerja-praktik/admin/companies/CompanyList'
import AdminApplicationPage from './pages/kerja-praktik/admin/application/ApplicationList'
import ManageApplicationLetter from './pages/kerja-praktik/admin/application/ManageApplicationLetter'
import InternshipTemplateEditor from './pages/kerja-praktik/admin/application/InternshipTemplateEditor'
import KadepInternshipManagementPage from './pages/kerja-praktik/kadep/ManageInternship';
import SignLetterPage from './pages/kerja-praktik/kadep/SignLetterPage';
import InternshipLetterVerification from './pages/kerja-praktik/public/InternshipLetterVerification';
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
import KelolaThesisPage from './pages/tugas-akhir/KelolaThesis'
// Guards
import KerjaPraktekGuard from './pages/guards/KerjaPraktekGuard'
import TugasAkhirGuard from './pages/guards/TugasAkhirGuard'
import MetopelGuard from './pages/guards/MetopelGuard'
import RoleGuard from './pages/guards/RoleGuard'
// Others
import NotFoundPage from './pages/NotFound'
import { ROLES, LECTURER_ROLES } from './lib/roles'

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/microsoft/callback" element={<MicrosoftCallback />} />
            <Route path="/auth/activate/success" element={<ActivationSuccess />} />
            <Route path="/auth/inactive" element={<AccountInactive />} />
            <Route path="/auth/activate/email-sent" element={<ActivationEmailSent />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify/internship-letter/:id" element={<InternshipLetterVerification />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profil />} />

              {/* Student routes */}
              <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                <Route path="/kerja-praktik" element={<KerjaPraktekGuard />}>
                  <Route path="pendaftaran" element={<InternshipProposalPage />} />
                  <Route path="pendaftaran/:id" element={<InternshipProposalDetailPage />} />
                  <Route path="logbook" element={<Placeholder title="KP - Logbook" />} />
                  <Route path="seminar" element={<Placeholder title="KP - Seminar" />} />
                </Route>

                <Route path="/tugas-akhir" element={<TugasAkhirGuard />}>
                  <Route path="bimbingan" element={<StudentGuidancePage />} />
                  <Route path="bimbingan/session/:id" element={<StudentGuidanceSessionPage />} />
                  <Route path="bimbingan/history" element={<GuidanceHistoryPage />} />
                  <Route path="bimbingan/supervisors" element={<SupervisorsPage />} />
                  <Route path="milestone" element={<StudentMilestonePage />} />
                  <Route path="completed-history" element={<CompletedHistoryPage />} />
                </Route>

                <Route path="/metopel" element={<MetopelGuard />}>
                  <Route index element={<BimbinganEntry />} />
                </Route>

                <Route path="/yudisium" element={<Placeholder title="Yudisium" />} />
              </Route>

              {/* Tugas Akhir - Lecturer routes (no guard, different role) */}
              <Route element={<RoleGuard allowedRoles={[...LECTURER_ROLES]} />}>
                <Route path="/tugas-akhir/bimbingan/lecturer/requests" element={<LecturerRequestsPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/scheduled" element={<LecturerScheduledPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/session/:guidanceId" element={<LecturerGuidanceSessionPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/my-students" element={<LecturerMyStudentsPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/my-students/:thesisId" element={<LecturerMyStudentDetailPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/history/:studentId" element={<LecturerHistoryPage />} />
              </Route>

              {/* Tugas Akhir - Non-student routes (monitoring, etc) */}
              <Route path="/tugas-akhir/kelola-penguji" element={<Placeholder title="Tugas Akhir - Kelola Penguji" />} />
              <Route path="/tugas-akhir/monitoring" element={<MonitoringDashboard />} />
              <Route path="/tugas-akhir/monitoring/:thesisId" element={<StudentProgressDetail />} />
              <Route path="/tugas-akhir/acc-pembimbing" element={<Placeholder title="Tugas Akhir - ACC Pembimbing" />} />
              <Route path="/tugas-akhir/acc-rubrik" element={<Placeholder title="Tugas Akhir - ACC Rubrik Penilaian" />} />
              <Route path="/tugas-akhir/kelola-rubrik" element={<Placeholder title="Tugas Akhir - Kelola Rubrik" />} />
              <Route path="/tugas-akhir/kelola-yudisium" element={<Placeholder title="Tugas Akhir - Kelola Yudisium" />} />
              <Route path="/tugas-akhir/kelola" element={<KelolaThesisPage />} />
              <Route path="/tugas-akhir/jadwal-seminar" element={<Placeholder title="Tugas Akhir - Penjadwalan Seminar" />} />
              <Route path="/tugas-akhir/jadwal-sidang" element={<Placeholder title="Tugas Akhir - Penjadwalan Sidang" />} />

              {/* Shared Kelola - Sekdep & Kadep */}
              <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN]} />}>
                <Route path="/kelola/perusahaan" element={<SekdepCompanyListPage />} />
                <Route path="/kelola/sop" element={<KelolaSopPage />} />
              </Route>

              {/* Kelola - Sekretaris */}
              <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN]} />}>
                <Route path="/kelola" element={<Placeholder title="main menu Kelola" />} />
                <Route path="/kelola/kerja-praktik" element={<Navigate to="/kelola/kerja-praktik/pendaftaran" replace />} />
                <Route path="/kelola/kerja-praktik/pendaftaran" element={<SekdepInternshipProposalPage />} />
                <Route path="/kelola/kerja-praktik/pendaftaran/:proposalId" element={<SekdepInternshipProposalDetailPage />} />
                <Route path="/kelola/tugas-akhir" element={<Navigate to="/kelola/tugas-akhir/topik" replace />} />
                <Route path="/kelola/tugas-akhir/topik" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/monitor" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/milestone" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/rubrik-seminar" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/rubrik-sidang" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/yudisium" element={<Placeholder title="Kelola - Yudisium" />} />
              </Route>

              {/* Kelola - Kadep */}
              <Route element={<RoleGuard allowedRoles={[ROLES.KETUA_DEPARTEMEN]} />}>
                <Route path="/kelola/tugas-akhir/kadep" element={<Navigate to="/kelola/tugas-akhir/kadep/pergantian" replace />} />
                <Route path="/kelola/tugas-akhir/kadep/pergantian" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/tugas-akhir/kadep/data" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/tugas-akhir/kadep/penguji" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/tugas-akhir/kadep/pembimbing" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/tugas-akhir/kadep/acc-rubrik" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/kerja-praktik/kadep/persetujuan" element={<KadepInternshipManagementPage />} />
                <Route path="/kelola/kerja-praktik/kadep/sign/:type/:id" element={<SignLetterPage />} />
              </Route>

              {/* Master Data (Admin) */}
              <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN]} />}>
                <Route path="/master-data" element={<Placeholder title="main menu Master Data" />} />
                <Route path="/admin/kerja-praktik/perusahaan" element={<AdminCompanyListPage />} />
                <Route path="/admin/kerja-praktik/surat-pengantar" element={<AdminApplicationPage />} />
                <Route path="/admin/kerja-praktik/surat-pengantar/:id" element={<ManageApplicationLetter />} />
                <Route path="/admin/kerja-praktik/templates/:name" element={<InternshipTemplateEditor />} />
                <Route path="/master-data/mahasiswa" element={<MahasiswaPage />} />
                <Route path="/master-data/mahasiswa/:id" element={<MahasiswaDetailPage />} />
                <Route path="/master-data/dosen" element={<DosenPage />} />
                <Route path="/master-data/dosen/:id" element={<DosenDetailPage />} />
                <Route path="/master-data/user" element={<UserManagementPage />} />
                <Route path="/master-data/tahun-ajaran" element={<AcademicYearPage />} />
              </Route>
            </Route>

            <Route path="/not-found" element={<NotFoundPage />} />

            {/* 404 - Catch all undefined routes (outside ProtectedLayout) */}
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
          <Toaster position="top-right" visibleToasts={1} closeButton />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
