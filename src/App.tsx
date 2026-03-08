import { useState, useEffect, lazy, Suspense } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Lottie from 'lottie-react'
import serverErrorAnimation from '@/assets/lottie/server_eror.json'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/spinner'
import { AuthProvider, NotificationProvider } from '@/hooks/shared'
import { Toaster } from './components/ui/sonner'
// Static imports: core pages, layout, guards
import Login from './pages/Login'
import Landing from './pages/Landing'
import MicrosoftCallback from './pages/auth/MicrosoftCallback'
import ActivationSuccess from './pages/auth/ActivationSuccess'
import AccountInactive from './pages/auth/AccountInactive'
import ActivationEmailSent from './pages/auth/ActivationEmailSent'
import ResetPassword from './pages/ResetPassword'
import ProtectedLayout from './components/layout/ProtectedLayout'
import Placeholder from './pages/Placeholder'
import NotFoundPage from './pages/NotFound'
import InternshipLetterVerification from './pages/kerja-praktik/public/InternshipLetterVerification'
// Guards
import KerjaPraktekGuard from './pages/guards/KerjaPraktekGuard'
import TugasAkhirGuard from './pages/guards/TugasAkhirGuard'
import MetopelGuard from './pages/guards/MetopelGuard'
import RoleGuard from './pages/guards/RoleGuard'
import { ROLES, LECTURER_ROLES } from './lib/roles'

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profil = lazy(() => import('./pages/profil/Profil'))
// Tugas Akhir - Bimbingan
const BimbinganEntry = lazy(() => import('./pages/tugas-akhir/bimbingan/BimbinganEntry'))
const StudentGuidancePage = lazy(() => import('./pages/tugas-akhir/bimbingan/student/StudentGuidance'))
const StudentGuidanceSessionPage = lazy(() => import('./pages/tugas-akhir/bimbingan/student/GuidanceSession'))
const StudentMilestonePage = lazy(() => import('./pages/tugas-akhir/bimbingan/student/Milestone'))
const DangerZonePage = lazy(() => import('./pages/tugas-akhir/bimbingan/student/DangerZone'))
const LecturerRequestsPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/Requests'))
const LecturerGuidanceSessionPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/GuidanceSession'))
const LecturerMyStudentsPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/MyStudents'))
const LecturerMyStudentDetailPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/MyStudentDetail'))
const SecretaryKelolaTugasAkhirPage = lazy(() => import('./pages/tugas-akhir/bimbingan/secretary/TugasAkhir'))
// Tugas Akhir - Seminar Hasil
const SeminarHasilEntry = lazy(() => import('./pages/tugas-akhir/seminar-hasil/SeminarHasilEntry'))
const StudentThesisSeminarPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/StudentThesisSeminar'))
const StudentSeminarAttendancePage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/StudentSeminarAttendance'))
const StudentSeminarDetailPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/StudentSeminarDetail'))
const AdminThesisSeminarManagementPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/AdminThesisSeminarManagement'))
const AdminSeminarDetailPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/AdminSeminarDetail'))
const LecturerThesisSeminarPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/LecturerThesisSeminar'))
const LecturerExaminerAssignmentPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/LecturerExaminerAssignment'))
const LecturerSupervisedStudentsPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/LecturerSupervisedStudents'))
const LecturerSeminarDetailIdentityPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/LecturerSeminarDetailIdentity'))
const LecturerSeminarDetailAssessmentPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/LecturerSeminarDetailAssessment'))
const LecturerSeminarDetailRevisionPage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/LecturerSeminarDetailRevision'))
const LecturerSeminarDetailAttendancePage = lazy(() => import('./pages/tugas-akhir/seminar-hasil/LecturerSeminarDetailAttendance'))
// Tugas Akhir - Sidang
const SidangEntry = lazy(() => import('./pages/tugas-akhir/sidang/SidangEntry'))
const StudentThesisDefencePage = lazy(() => import('./pages/tugas-akhir/sidang/StudentThesisDefence'))
const StudentDefenceDetailPage = lazy(() => import('./pages/tugas-akhir/sidang/StudentDefenceDetail'))
const AdminThesisDefenceManagementPage = lazy(() => import('./pages/tugas-akhir/sidang/AdminThesisDefenceManagement'))
const AdminDefenceDetailPage = lazy(() => import('./pages/tugas-akhir/sidang/AdminDefenceDetail'))
const LecturerThesisDefencePage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerThesisDefence'))
const LecturerDefenceExaminerAssignmentPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceExaminerAssignment'))
const LecturerSupervisedStudentDefencesPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerSupervisedStudentDefences'))
const LecturerDefenceDetailIdentityPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceDetailIdentity'))
const LecturerDefenceDetailAssessmentPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceDetailAssessment'))
const LecturerDefenceDetailMinutesPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceDetailMinutes'))
const LecturerDefenceDetailRevisionPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceDetailRevision'))
// Kerja Praktik - Student
const InternshipProposalPage = lazy(() => import('./pages/kerja-praktik/student/registration/Proposal'))
const InternshipProposalDetailPage = lazy(() => import('./pages/kerja-praktik/student/registration/PendaftaranDetail'))
const InternshipAssignmentPage = lazy(() => import('./pages/kerja-praktik/student/registration/Assignment'))
const InternshipLogbookPage = lazy(() => import('./pages/kerja-praktik/student/activity/Logbook'))
const InternshipGuidancePage = lazy(() => import('./pages/kerja-praktik/student/activity/Guidance'))
// Kerja Praktik - Sekdep
const SekdepInternshipProposalPage = lazy(() => import('./pages/kerja-praktik/sekdep/registration/Proposal'))
const SekdepInternshipProposalDetailPage = lazy(() => import('./pages/kerja-praktik/sekdep/registration/PendaftaranDetail'))
const SekdepInternshipAssignmentPage = lazy(() => import('./pages/kerja-praktik/sekdep/registration/Assignment'))
const SekdepCompanyListPage = lazy(() => import('./pages/kerja-praktik/sekdep/companies/CompanyList'))
// Kerja Praktik - Admin
const AdminCompanyListPage = lazy(() => import('./pages/kerja-praktik/admin/companies/CompanyList'))
const AdminApplicationPage = lazy(() => import('./pages/kerja-praktik/admin/application/Application'))
const ManageApplicationLetter = lazy(() => import('./pages/kerja-praktik/admin/application/ManageApplicationLetter'))
const AdminAssignmentPage = lazy(() => import('./pages/kerja-praktik/admin/assignment/Assignment'))
const ManageAssignmentLetter = lazy(() => import('./pages/kerja-praktik/admin/assignment/ManageAssignmentLetter'))
const AssignmentTemplateEditor = lazy(() => import('./pages/kerja-praktik/admin/assignment/AssignmentTemplateEditor'))
const InternshipTemplateEditor = lazy(() => import('./pages/kerja-praktik/admin/application/ApplicationTemplateEditor'))
// Kerja Praktik - Kadep
const KadepInternshipManagementPage = lazy(() => import('./pages/kerja-praktik/kadep/ManageInternship'))
const SignLetterPage = lazy(() => import('./pages/kerja-praktik/kadep/SignLetterPage'))
// Overview Pages
const KerjaPraktekOverviewPage = lazy(() => import('./pages/kerja-praktik/Overview'))
const MetopenOverviewPage = lazy(() => import('./pages/metopel/Overview'))
const YudisiumOverviewPage = lazy(() => import('./pages/yudisium/student/Overview'))
const KelolaYudisiumPage = lazy(() => import('./pages/yudisium/KelolaYudisium'))
const TugasAkhirOverviewPage = lazy(() => import('./pages/tugas-akhir/Overview'))
// Tugas Akhir - Monitoring
const MonitoringDashboard = lazy(() => import('./pages/tugas-akhir/monitoring/MonitoringDashboard'))
const StudentProgressDetail = lazy(() => import('./pages/tugas-akhir/monitoring/StudentProgressDetail'))
// Master Data
const UserManagementPage = lazy(() => import('./pages/master-data/UserManagement'))
const AcademicYearPage = lazy(() => import('./pages/master-data/AcademicYear'))
const MahasiswaPage = lazy(() => import('./pages/master-data/Mahasiswa'))
const MahasiswaDetailPage = lazy(() => import('./pages/master-data/MahasiswaDetail'))
const DosenPage = lazy(() => import('./pages/master-data/Dosen'))
const DosenDetailPage = lazy(() => import('./pages/master-data/DosenDetail'))
const MasterDataTugasAkhirPage = lazy(() => import('./pages/master-data/TugasAkhir'))
const ScienceGroupPage = lazy(() => import('./pages/master-data/ScienceGroup'))
// Kelola
const KelolaTugasAkhirKadepPage = lazy(() => import('./pages/kelola/kadep/KelolaTugasAkhir'))
const KelolaSopPage = lazy(() => import('./pages/kelola/Sop'))
const KelolaCpl = lazy(() => import('./pages/kelola/KelolaCpl'))
// Lecturer Availability
const JadwalKetersediaan = lazy(() => import('./pages/lecturer/JadwalKetersediaan'))
// Pengumuman
const SeminarHasilAnnouncementPage = lazy(() => import('./pages/pengumuman/SeminarHasilAnnouncement'))
const YudisiumAnnouncementPage = lazy(() => import('./pages/pengumuman/YudisiumAnnouncement'))
const PengumumanOverviewPage = lazy(() => import('./pages/pengumuman/Overview'))

function App() {
  const [showServerError, setShowServerError] = useState(false);

  useEffect(() => {
    const handleServerError = () => setShowServerError(true);
    window.addEventListener('server-error', handleServerError);
    return () => window.removeEventListener('server-error', handleServerError);
  }, []);

  if (showServerError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <Lottie animationData={serverErrorAnimation} loop={true} className="w-64 h-64 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Terjadi Kesalahan Server</h1>
            <p className="text-muted-foreground text-sm">
              Maaf, server sedang mengalami gangguan atau masalah internal saat ini. Silakan coba beberapa saat lagi.
            </p>
          </div>
          <Button onClick={() => setShowServerError(false)} className="w-full sm:w-auto">
            Kembali & Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Suspense fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-background">
              <Loading size="lg" text="Memuat..." />
            </div>
          }>
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
                  <Route index element={<KerjaPraktekOverviewPage />} />
                  <Route path="pendaftaran" element={<InternshipProposalPage />} />
                  <Route path="pendaftaran/:id" element={<InternshipProposalDetailPage />} />
                  <Route path="penugasan" element={<InternshipAssignmentPage />} />
                  <Route path="logbook" element={<InternshipLogbookPage />} />
                  <Route path="bimbingan" element={<InternshipGuidancePage />} />
                  <Route path="seminar" element={<Placeholder title="KP - Seminar" />} />
                </Route>
              </Route>


              {/* Metode Penelitian - Protected by eligibility guard */}
              <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                <Route element={<MetopelGuard />}>
                  <Route path="/metopel" element={<MetopenOverviewPage />} />
                </Route>

                <Route path="/tugas-akhir" element={<TugasAkhirGuard />}>
                  <Route index element={<TugasAkhirOverviewPage />} />
                  {/* Removed bimbingan/ route to allow BimbinganEntry to handle role-based redirection */}
                  <Route path="bimbingan/student" element={<StudentGuidancePage />} />
                  <Route path="bimbingan/student/session/:guidanceId" element={<StudentGuidanceSessionPage />} />
                  <Route path="bimbingan/milestone" element={<StudentMilestonePage />} />
                  <Route path="bimbingan/danger-zone" element={<DangerZonePage />} />
                  <Route path="seminar/student" element={<StudentThesisSeminarPage />} />
                  <Route path="seminar/student/attendance" element={<StudentSeminarAttendancePage />} />
                  <Route path="seminar/student/history/:seminarId" element={<StudentSeminarDetailPage />} />
                  <Route path="sidang/student" element={<StudentThesisDefencePage />} />
                  <Route path="sidang/student/history/:defenceId" element={<StudentDefenceDetailPage />} />
                </Route>

                {/* Pengumuman routes */}
                <Route path="/pengumuman" element={<PengumumanOverviewPage />} />
                <Route path="/pengumuman/seminar-hasil" element={<SeminarHasilAnnouncementPage />} />
                <Route path="/pengumuman/yudisium" element={<YudisiumAnnouncementPage />} />
              </Route>

              {/* Shared Routes (Student & Lecturer & Others) */}
              {/* Tugas Akhir Shared */}
              <Route path="/tugas-akhir/bimbingan" element={<BimbinganEntry />} />
              <Route path="/tugas-akhir/seminar" element={<SeminarHasilEntry />} />
              <Route path="/tugas-akhir/sidang" element={<SidangEntry />} />

              {/* Kerja Praktik Shared */}
              <Route path="/kerja-praktik/monitoring" element={<Placeholder title="Kerja Praktek - Monitoring" />} />
              <Route path="/kerja-praktik/seminar" element={<Placeholder title="Kerja Praktek - Seminar" />} />

              {/* Yudisium - Top Level for Student */}
              <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                <Route path="/yudisium" element={<YudisiumOverviewPage />} />
              </Route>

              {/* Tugas Akhir - Lecturer routes (no guard, different role) */}
              <Route element={<RoleGuard allowedRoles={[...LECTURER_ROLES]} />}>
                <Route path="/tugas-akhir/bimbingan/lecturer/requests" element={<LecturerRequestsPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/session/:guidanceId" element={<LecturerGuidanceSessionPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/my-students" element={<LecturerMyStudentsPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/my-students/:thesisId" element={<LecturerMyStudentDetailPage />} />
                <Route path="/tugas-akhir/seminar/lecturer" element={<LecturerThesisSeminarPage />} />
                <Route path="/tugas-akhir/seminar/lecturer/assignment" element={<LecturerExaminerAssignmentPage />} />
                <Route path="/tugas-akhir/seminar/lecturer/my-students" element={<LecturerSupervisedStudentsPage />} />
                <Route path="/tugas-akhir/seminar/lecturer/:seminarId" element={<LecturerSeminarDetailIdentityPage />} />
                <Route path="/tugas-akhir/seminar/lecturer/:seminarId/assessment" element={<LecturerSeminarDetailAssessmentPage />} />
                <Route path="/tugas-akhir/seminar/lecturer/:seminarId/revision" element={<LecturerSeminarDetailRevisionPage />} />
                <Route path="/tugas-akhir/seminar/lecturer/:seminarId/attendance" element={<LecturerSeminarDetailAttendancePage />} />
                <Route path="/tugas-akhir/sidang/lecturer" element={<Navigate to="/tugas-akhir/sidang/lecturer/my-students" replace />} />
                <Route path="/tugas-akhir/sidang/lecturer/examiner-requests" element={<LecturerThesisDefencePage />} />
                <Route path="/tugas-akhir/sidang/lecturer/assignment" element={<LecturerDefenceExaminerAssignmentPage />} />
                <Route path="/tugas-akhir/sidang/lecturer/my-students" element={<LecturerSupervisedStudentDefencesPage />} />
                <Route path="/tugas-akhir/sidang/lecturer/:defenceId" element={<LecturerDefenceDetailIdentityPage />} />
                <Route path="/tugas-akhir/sidang/lecturer/:defenceId/assessment" element={<LecturerDefenceDetailAssessmentPage />} />
                <Route path="/tugas-akhir/sidang/lecturer/:defenceId/minutes" element={<LecturerDefenceDetailMinutesPage />} />
                <Route path="/tugas-akhir/sidang/lecturer/:defenceId/revision" element={<LecturerDefenceDetailRevisionPage />} />
                <Route path="/jadwal-ketersediaan" element={<JadwalKetersediaan />} />
              </Route>

              {/* Tugas Akhir - Non-student routes (monitoring, etc) */}
              <Route path="/tugas-akhir/kelola-penguji" element={<Placeholder title="Tugas Akhir - Kelola Penguji" />} />
              <Route path="/tugas-akhir/monitoring" element={<MonitoringDashboard />} />
              <Route path="/tugas-akhir/monitoring/:thesisId" element={<StudentProgressDetail />} />
              <Route path="/tugas-akhir/acc-pembimbing" element={<Placeholder title="Tugas Akhir - ACC Pembimbing" />} />
              <Route path="/tugas-akhir/acc-rubrik" element={<Placeholder title="Tugas Akhir - ACC Rubrik Penilaian" />} />
              <Route path="/tugas-akhir/kelola-rubrik" element={<Placeholder title="Tugas Akhir - Kelola Rubrik" />} />
              <Route path="/tugas-akhir/kelola-yudisium" element={<Placeholder title="Tugas Akhir - Kelola Yudisium" />} />
              <Route path="/tugas-akhir/kelola" element={<Placeholder title="Tugas Akhir - Kelola (Deprecated)" />} />

              {/* Shared Kelola - Sekdep & Kadep */}
              <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN]} />}>
                <Route path="/kelola/perusahaan" element={<SekdepCompanyListPage />} />
                <Route path="/kelola/sop" element={<KelolaSopPage />} />
                <Route path="/kelola/data-cpl" element={<KelolaCpl />} />
                <Route path="/kelola/kelompok-keilmuan" element={<ScienceGroupPage />} />
              </Route>

              {/* Kelola - Sekretaris */}
              <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN]} />}>
                <Route path="/kelola" element={<Placeholder title="main menu Kelola" />} />
                <Route path="/kelola/kerja-praktik" element={<Navigate to="/kelola/kerja-praktik/pendaftaran" replace />} />
                <Route path="/kelola/kerja-praktik/pendaftaran" element={<SekdepInternshipProposalPage />} />
                <Route path="/kelola/kerja-praktik/pendaftaran/:proposalId" element={<SekdepInternshipProposalDetailPage />} />
                <Route path="/kelola/kerja-praktik/penugasan" element={<SekdepInternshipAssignmentPage />} />
                <Route path="/kelola/tugas-akhir" element={<Navigate to="/kelola/tugas-akhir/topik" replace />} />
                <Route path="/kelola/tugas-akhir/topik" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/monitor" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/milestone" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/rubrik-seminar" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/rubrik-sidang" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/master-data" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/tugas-akhir/cpmk" element={<SecretaryKelolaTugasAkhirPage />} />
                <Route path="/kelola/yudisium" element={<Navigate to="/kelola/yudisium/event" replace />} />
                <Route path="/kelola/yudisium/event" element={<KelolaYudisiumPage />} />
                <Route path="/kelola/yudisium/persyaratan" element={<KelolaYudisiumPage />} />
                <Route path="/kelola/yudisium/exit-survey" element={<KelolaYudisiumPage />} />
              </Route>

              {/* Kelola - Kadep */}
              <Route element={<RoleGuard allowedRoles={[ROLES.KETUA_DEPARTEMEN]} />}>
                <Route path="/kelola/tugas-akhir/kadep" element={<Navigate to="/kelola/tugas-akhir/kadep/pergantian" replace />} />
                <Route path="/kelola/tugas-akhir/kadep/pergantian" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/tugas-akhir/kadep/penguji" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/tugas-akhir/kadep/pembimbing" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/tugas-akhir/kadep/acc-rubrik" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/tugas-akhir/kadep/master-data" element={<KelolaTugasAkhirKadepPage />} />
                <Route path="/kelola/kerja-praktik/kadep/persetujuan" element={<KadepInternshipManagementPage />} />
                <Route path="/kelola/kerja-praktik/kadep/sign/:type/:id" element={<SignLetterPage />} />
              </Route>

              {/* Master Data (Admin) */}
              <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN]} />}>

                <Route path="/master-data" element={<Placeholder title="main menu Master Data" />} />
                <Route path="/admin/kerja-praktik/perusahaan" element={<AdminCompanyListPage />} />
                <Route path="/admin/kerja-praktik/surat-pengantar" element={<AdminApplicationPage />} />
                <Route path="/admin/kerja-praktik/surat-pengantar/:id" element={<ManageApplicationLetter />} />
                <Route path="/admin/kerja-praktik/surat-tugas" element={<AdminAssignmentPage />} />
                <Route path="/admin/kerja-praktik/surat-tugas/:id" element={<ManageAssignmentLetter />} />
                <Route path="/admin/kerja-praktik/surat-tugas/template" element={<AssignmentTemplateEditor />} />
                <Route path="/admin/kerja-praktik/templates/:name" element={<InternshipTemplateEditor />} />
                <Route path="/tugas-akhir/seminar/admin" element={<AdminThesisSeminarManagementPage />} />
                <Route path="/tugas-akhir/seminar/admin/:seminarId" element={<AdminSeminarDetailPage />} />
                <Route path="/tugas-akhir/sidang/admin" element={<AdminThesisDefenceManagementPage />} />
                <Route path="/tugas-akhir/sidang/admin/:defenceId" element={<AdminDefenceDetailPage />} />
                <Route path="/master-data/mahasiswa" element={<MahasiswaPage />} />
                <Route path="/master-data/mahasiswa/:id" element={<MahasiswaDetailPage />} />
                <Route path="/master-data/dosen" element={<DosenPage />} />
                <Route path="/master-data/dosen/:id" element={<DosenDetailPage />} />
                <Route path="/master-data/tugas-akhir" element={<MasterDataTugasAkhirPage />} />
                <Route path="/master-data/user" element={<UserManagementPage />} />
                <Route path="/master-data/tahun-ajaran" element={<AcademicYearPage />} />
              </Route>
            </Route>

            <Route path="/not-found" element={<NotFoundPage />} />

            {/* 404 - Catch all undefined routes (outside ProtectedLayout) */}
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
          </Suspense>
          <Toaster position="top-right" visibleToasts={1} closeButton />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
