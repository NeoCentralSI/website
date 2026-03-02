import { useState, useEffect } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Lottie from 'lottie-react'
import serverErrorAnimation from '@/assets/lottie/server_eror.json'
import { Button } from '@/components/ui/button'
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
import StudentMilestonePage from './pages/tugas-akhir/bimbingan/student/Milestone'
import CompletedHistoryPage from './pages/tugas-akhir/bimbingan/student/CompletedHistory'
import DangerZonePage from './pages/tugas-akhir/bimbingan/student/DangerZone'
import LecturerRequestsPage from './pages/tugas-akhir/bimbingan/lecturer/Requests'
import LecturerScheduledPage from './pages/tugas-akhir/bimbingan/lecturer/Scheduled'
import LecturerGuidanceSessionPage from './pages/tugas-akhir/bimbingan/lecturer/GuidanceSession'
import LecturerMyStudentsPage from './pages/tugas-akhir/bimbingan/lecturer/MyStudents'
import LecturerMyStudentDetailPage from './pages/tugas-akhir/bimbingan/lecturer/MyStudentDetail'
import SecretaryKelolaTugasAkhirPage from './pages/tugas-akhir/bimbingan/secretary/TugasAkhir'
import SeminarHasilEntry from './pages/tugas-akhir/seminar-hasil/SeminarHasilEntry'
import StudentThesisSeminarPage from './pages/tugas-akhir/seminar-hasil/StudentThesisSeminar'
import StudentSeminarAttendancePage from './pages/tugas-akhir/seminar-hasil/StudentSeminarAttendance'
import AdminThesisSeminarManagementPage from './pages/tugas-akhir/seminar-hasil/AdminThesisSeminarManagement'
import AdminSeminarDetailPage from './pages/tugas-akhir/seminar-hasil/AdminSeminarDetail'
import LecturerThesisSeminarPage from './pages/tugas-akhir/seminar-hasil/LecturerThesisSeminar'
import LecturerExaminerAssignmentPage from './pages/tugas-akhir/seminar-hasil/LecturerExaminerAssignment'
import LecturerSupervisedStudentsPage from './pages/tugas-akhir/seminar-hasil/LecturerSupervisedStudents'
import LecturerSeminarDetailPage from './pages/tugas-akhir/seminar-hasil/LecturerSeminarDetail'
// Kerja Praktik
import InternshipProposalPage from './pages/kerja-praktik/student/registration/Proposal'
import InternshipProposalDetailPage from './pages/kerja-praktik/student/registration/PendaftaranDetail'
import InternshipAssignmentPage from './pages/kerja-praktik/student/registration/Assignment'
// Sekdep Internship
import SekdepInternshipProposalPage from './pages/kerja-praktik/sekdep/registration/Proposal'
import SekdepInternshipProposalDetailPage from './pages/kerja-praktik/sekdep/registration/PendaftaranDetail'
import SekdepInternshipAssignmentPage from './pages/kerja-praktik/sekdep/registration/Assignment'
import SekdepCompanyListPage from './pages/kerja-praktik/sekdep/companies/CompanyList'
// Overview Pages
import KerjaPraktekOverviewPage from './pages/kerja-praktik/Overview'
import MetopenOverviewPage from './pages/metopel/Overview'
import YudisiumOverviewPage from './pages/yudisium/student/Overview'
import KelolaYudisiumPage from './pages/yudisium/KelolaYudisium'
import TugasAkhirOverviewPage from './pages/tugas-akhir/Overview'
import AdminCompanyListPage from './pages/kerja-praktik/admin/companies/CompanyList'
import AdminApplicationPage from './pages/kerja-praktik/admin/application/Application'
import ManageApplicationLetter from './pages/kerja-praktik/admin/application/ManageApplicationLetter'
import AdminAssignmentPage from './pages/kerja-praktik/admin/assignment/Assignment'
import ManageAssignmentLetter from './pages/kerja-praktik/admin/assignment/ManageAssignmentLetter'
import AssignmentTemplateEditor from './pages/kerja-praktik/admin/assignment/AssignmentTemplateEditor'
import InternshipTemplateEditor from './pages/kerja-praktik/admin/application/ApplicationTemplateEditor'
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
import MasterDataTugasAkhirPage from './pages/master-data/TugasAkhir'
import ScienceGroupPage from './pages/master-data/ScienceGroup'
// Kelola
import KelolaTugasAkhirKadepPage from './pages/kelola/kadep/KelolaTugasAkhir'
import KelolaSopPage from './pages/kelola/Sop'
import KelolaCpl from './pages/kelola/KelolaCpl'
// Guards
import KerjaPraktekGuard from './pages/guards/KerjaPraktekGuard'
import TugasAkhirGuard from './pages/guards/TugasAkhirGuard'
import SeminarHasilGuard from './pages/guards/SeminarHasilGuard'
import MetopelGuard from './pages/guards/MetopelGuard'
import RoleGuard from './pages/guards/RoleGuard'
// Lecturer Availability
import JadwalKetersediaan from './pages/lecturer/JadwalKetersediaan'
// Pengumuman
import SeminarHasilAnnouncementPage from './pages/pengumuman/SeminarHasilAnnouncement'
import YudisiumAnnouncementPage from './pages/pengumuman/YudisiumAnnouncement'
import PengumumanOverviewPage from './pages/pengumuman/Overview'
// Others
import NotFoundPage from './pages/NotFound'
import { ROLES, LECTURER_ROLES } from './lib/roles'

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
                <Route element={<KerjaPraktekGuard />}>
                  <Route path="/kerja-praktik" element={<KerjaPraktekOverviewPage />} />
                  <Route path="/kerja-praktik/pendaftaran" element={<InternshipProposalPage />} />
                  <Route path="/kerja-praktik/pendaftaran/:proposalId" element={<InternshipProposalDetailPage />} />
                  <Route path="/kerja-praktik/logbook" element={<Placeholder title="Kerja Praktek - Log Book" />} />
                  <Route path="/kerja-praktik/acc-proposal" element={<Placeholder title="Kerja Praktek - ACC Proposal" />} />
                  <Route path="/kerja-praktik/surat-pengantar" element={<Placeholder title="Kerja Praktek - Surat Pengantar" />} />
                  <Route path="/kerja-praktik/data" element={<Placeholder title="Kerja Praktek - Data KP" />} />
                </Route>
                <Route path="/kerja-praktik" element={<KerjaPraktekGuard />}>
                  <Route path="pendaftaran" element={<InternshipProposalPage />} />
                  <Route path="pendaftaran/:id" element={<InternshipProposalDetailPage />} />
                  <Route path="penugasan" element={<InternshipAssignmentPage />} />
                  <Route path="logbook" element={<Placeholder title="KP - Logbook" />} />
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
                  <Route path="bimbingan/completed-history" element={<CompletedHistoryPage />} />
                  <Route path="bimbingan/danger-zone" element={<DangerZonePage />} />
                  <Route element={<SeminarHasilGuard />}>
                    <Route path="seminar/student" element={<StudentThesisSeminarPage />} />
                    <Route path="seminar/student/attendance" element={<StudentSeminarAttendancePage />} />
                  </Route>
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
              <Route path="/tugas-akhir/sidang" element={<Placeholder title="Tugas Akhir - Sidang" />} />

              {/* Kerja Praktik Shared */}
              <Route path="/kerja-praktik/monitoring" element={<Placeholder title="Kerja Praktek - Monitoring" />} />
              <Route path="/kerja-praktik/bimbingan" element={<Placeholder title="Kerja Praktek - Bimbingan" />} />
              <Route path="/kerja-praktik/seminar" element={<Placeholder title="Kerja Praktek - Seminar" />} />

              {/* Yudisium - Top Level for Student */}
              <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                <Route path="/yudisium" element={<YudisiumOverviewPage />} />
              </Route>

              {/* Tugas Akhir - Lecturer routes (no guard, different role) */}
              <Route element={<RoleGuard allowedRoles={[...LECTURER_ROLES]} />}>
                <Route path="/tugas-akhir/bimbingan/lecturer/requests" element={<LecturerRequestsPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/scheduled" element={<LecturerScheduledPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/session/:guidanceId" element={<LecturerGuidanceSessionPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/my-students" element={<LecturerMyStudentsPage />} />
                <Route path="/tugas-akhir/bimbingan/lecturer/my-students/:thesisId" element={<LecturerMyStudentDetailPage />} />
                <Route path="/tugas-akhir/seminar/lecturer" element={<LecturerThesisSeminarPage />} />
                <Route path="/tugas-akhir/seminar/lecturer/assignment" element={<LecturerExaminerAssignmentPage />} />
                <Route path="/tugas-akhir/seminar/lecturer/my-students" element={<LecturerSupervisedStudentsPage />} />
                <Route path="/tugas-akhir/seminar/lecturer/:seminarId" element={<LecturerSeminarDetailPage />} />
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
              <Route path="/tugas-akhir/jadwal-sidang" element={<Placeholder title="Tugas Akhir - Penjadwalan Sidang" />} />

              {/* Shared Kelola - Sekdep & Kadep */}
              <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN]} />}>
                <Route path="/kelola/perusahaan" element={<SekdepCompanyListPage />} />
                <Route path="/kelola/sop" element={<KelolaSopPage />} />
                <Route path="/kelola/data-cpl" element={<KelolaCpl />} />
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
                <Route path="/kelola/kelompok-keilmuan" element={<ScienceGroupPage />} />
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
                <Route path="/kelola/kelompok-keilmuan" element={<ScienceGroupPage />} />
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
          <Toaster position="top-right" visibleToasts={1} closeButton />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
