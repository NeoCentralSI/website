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
import SitemapPage from './pages/Sitemap'
import MicrosoftCallback from './pages/auth/MicrosoftCallback'
import ActivationSuccess from './pages/auth/ActivationSuccess'
import AccountInactive from './pages/auth/AccountInactive'
import ActivationEmailSent from './pages/auth/ActivationEmailSent'
import ResetPassword from './pages/ResetPassword'
import ProtectedLayout from './components/layout/ProtectedLayout'
import Placeholder from './pages/Placeholder'
import NotFoundPage from './pages/NotFound'
import InternshipLetterVerification from './pages/kerja-praktik/public/InternshipLetterVerification'
import FieldAssessmentPage from './pages/kerja-praktik/public/FieldAssessmentPage'
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
const StudentGuidance = lazy(() => import('./pages/tugas-akhir/bimbingan/student/StudentGuidance'));
const StudentMilestonePage = lazy(() => import('./pages/tugas-akhir/bimbingan/student/Milestone'));
const CompletedHistory = lazy(() => import('./pages/tugas-akhir/bimbingan/student/CompletedHistory'));
const StudentGuidanceSessionPage = lazy(() => import('./pages/tugas-akhir/bimbingan/student/GuidanceSession'))
const DangerZonePage = lazy(() => import('./pages/tugas-akhir/bimbingan/student/DangerZone'))
const LecturerRequestsPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/Requests'))
const LecturerGuidanceSessionPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/GuidanceSession'))
const LecturerMyStudentsPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/MyStudents'))
const LecturerMyStudentDetailPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/MyStudentDetail'))
const SecretaryKelolaTugasAkhirPage = lazy(() => import('./pages/tugas-akhir/bimbingan/secretary/TugasAkhir'))
// Tugas Akhir - Seminar Hasil
const ThesisSeminarEntryPage = lazy(() => import('./pages/thesis-seminar/ThesisSeminarEntry'))
const ThesisSeminarDetailPage = lazy(() => import('./pages/thesis-seminar/ThesisSeminarDetail'))

// Kerja Praktik - Dosen
const InternshipGuidanceOverviewPage = lazy(() => import('./pages/kerja-praktik/dosen/bimbingan/GuidanceOverview'))
const StudentDetailPage = lazy(() => import('./pages/kerja-praktik/dosen/bimbingan/StudentDetail'))
const StudentGuidanceTimelinePage = lazy(() => import('./pages/kerja-praktik/dosen/bimbingan/StudentGuidanceTimeline'))
const GuidanceEvaluatePage = lazy(() => import('./pages/kerja-praktik/dosen/bimbingan/GuidanceEvaluate'))
const LecturerFinalReportTab = lazy(() => import('./pages/kerja-praktik/dosen/bimbingan/LecturerFinalReportTab'))
const LecturerSeminarTab = lazy(() => import('./pages/kerja-praktik/dosen/bimbingan/LecturerSeminarTab'))
const LecturerNilaiTab = lazy(() => import('./pages/kerja-praktik/dosen/bimbingan/LecturerNilaiTab'))
// Tugas Akhir - Sidang
const SidangEntry = lazy(() => import('./pages/tugas-akhir/sidang/SidangEntry'))
const StudentThesisDefencePage = lazy(() => import('./pages/tugas-akhir/sidang/StudentThesisDefence'))
const StudentDefenceDetailPage = lazy(() => import('./pages/tugas-akhir/sidang/StudentDefenceDetail'))
const AdminThesisDefenceManagementPage = lazy(() => import('./pages/tugas-akhir/sidang/AdminThesisDefenceManagement'))
const LecturerThesisDefencePage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerThesisDefence'))
const LecturerDefenceExaminerAssignmentPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceExaminerAssignment'))
const LecturerSupervisedStudentDefencesPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerSupervisedStudentDefences'))
const LecturerDefenceDetailIdentityPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceDetailIdentity'))
const LecturerDefenceDetailAssessmentPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceDetailAssessment'))
const LecturerDefenceDetailMinutesPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceDetailMinutes'))
const LecturerDefenceDetailRevisionPage = lazy(() => import('./pages/tugas-akhir/sidang/LecturerDefenceDetailRevision'))
// Kerja Praktik - Student
const InternshipProposalPage = lazy(() => import('./pages/kerja-praktik/student/registration/Registration'))
const RegisterInternshipFormPage = lazy(() => import('./pages/kerja-praktik/student/registration/RegisterInternshipForm'))
const InternshipLogbookPage = lazy(() => import('./pages/kerja-praktik/student/activity/Logbook'))
const InternshipGuidancePage = lazy(() => import('./pages/kerja-praktik/student/activity/Guidance'))
const InternshipGuidanceDetailPage = lazy(() => import('./pages/kerja-praktik/student/activity/GuidanceDetail'))
const InternshipSeminarPage = lazy(() => import('./pages/kerja-praktik/student/Seminar'))
const InternshipSeminarDetailPage = lazy(() => import('./pages/kerja-praktik/student/SeminarDetail'))
// Kerja Praktik - Sekdep
const SekdepInternshipProposalPage = lazy(() => import('./pages/kerja-praktik/sekdep/Manage'))
const SekdepInternshipProposalDetailPage = lazy(() => import('./pages/kerja-praktik/sekdep/RegistrationDetail'))
const SekdepCompanyListPage = lazy(() => import('./pages/kerja-praktik/sekdep/CompanyList'))
const InternshipLifecycleDetail = lazy(() => import('./pages/kerja-praktik/sekdep/InternshipLifecycleDetail'))
const BulkRubricManage = lazy(() => import('./pages/kerja-praktik/sekdep/BulkRubricManage'))
const LecturerWorkloadDetail = lazy(() => import('./pages/kerja-praktik/sekdep/LecturerWorkloadDetail'))
const LecturerWorkloadManageLetter = lazy(() => import('./pages/kerja-praktik/sekdep/LecturerWorkloadManageLetter'))
const SupervisorTemplateEditor = lazy(() => import('./pages/kerja-praktik/sekdep/SupervisorTemplateEditor'))
// Kerja Praktik - Admin
const AdminCompanyListPage = lazy(() => import('./pages/kerja-praktik/admin/CompanyList'))
const AdminApplicationPage = lazy(() => import('./pages/kerja-praktik/admin/application/Application'))
const ManageApplicationLetter = lazy(() => import('./pages/kerja-praktik/admin/application/ManageApplicationLetter'))
const AdminAssignmentPage = lazy(() => import('./pages/kerja-praktik/admin/assignment/Assignment'))
const ManageAssignmentLetter = lazy(() => import('./pages/kerja-praktik/admin/assignment/ManageAssignmentLetter'))
const AssignmentTemplateEditor = lazy(() => import('./pages/kerja-praktik/admin/assignment/AssignmentTemplateEditor'))
const InternshipTemplateEditor = lazy(() => import('./pages/kerja-praktik/admin/application/ApplicationTemplateEditor'))
const BeritaAcaraTemplateEditor = lazy(() => import('./pages/kerja-praktik/admin/seminar/BeritaAcaraTemplateEditor'))
const ManageHolidays = lazy(() => import('./pages/kerja-praktik/admin/holidays/ManageHolidays'))
// Kerja Praktik - Kadep
const KadepInternshipManagementPage = lazy(() => import('./pages/kerja-praktik/kadep/ManageInternship'))
const SignLetterPage = lazy(() => import('./pages/kerja-praktik/kadep/SignLetterPage'))
// Overview Pages
const KerjaPraktekOverviewPage = lazy(() => import('./pages/kerja-praktik/Overview'))
const MetopenOverviewPage = lazy(() => import('./pages/metopel/Metopel'))
const YudisiumEntry = lazy(() => import('./pages/yudisium/YudisiumEntry'))
const StudentYudisiumPage = lazy(() => import('./pages/yudisium/StudentYudisium'))
const StudentExitSurveyPage = lazy(() => import('./pages/yudisium/StudentExitSurvey'))
const LecturerYudisiumPage = lazy(() => import('./pages/yudisium/LecturerYudisium'))
const LecturerYudisiumDetailPage = lazy(() => import('./pages/yudisium/LecturerYudisiumDetail'))
const YudisiumParticipantCPLValidationPage = lazy(() => import('./pages/yudisium/YudisiumParticipantCPLValidation'))
const AdminYudisiumPage = lazy(() => import('./pages/yudisium/AdminYudisium'))
const AdminYudisiumValidationPage = lazy(() => import('./pages/yudisium/AdminYudisiumValidation'))
const YudisiumParticipantDetailPage = lazy(() => import('./pages/yudisium/YudisiumParticipantDetail'))
const TugasAkhirOverviewPage = lazy(() => import('./pages/tugas-akhir/Overview'))
// Tugas Akhir - Monitoring
const MonitoringDashboard = lazy(() => import('./pages/tugas-akhir/monitoring/MonitoringDashboard'))
const StudentProgressDetail = lazy(() => import('./pages/tugas-akhir/monitoring/StudentProgressDetail'))
// Master Data
const UserManagementPage = lazy(() => import('./pages/master-data/UserManagement'))
const AcademicYearPage = lazy(() => import('./pages/master-data/AcademicYear'))
const Cpl = lazy(() => import('./pages/master-data/Cpl'))
const CplDetailPage = lazy(() => import('./pages/master-data/CplDetail'))
const MahasiswaPage = lazy(() => import('./pages/master-data/Mahasiswa'))
const MahasiswaDetailPage = lazy(() => import('./pages/master-data/MahasiswaDetail'))
const DosenPage = lazy(() => import('./pages/master-data/Dosen'))
const DosenDetailPage = lazy(() => import('./pages/master-data/DosenDetail'))
const MasterDataTugasAkhirPage = lazy(() => import('./pages/master-data/TugasAkhir'))
const ScienceGroupPage = lazy(() => import('./pages/master-data/ScienceGroup'))
const RoomPage = lazy(() => import('./pages/master-data/Room'))
const LecturerAvailability = lazy(() => import('./pages/master-data/LecturerAvailability'))
// Kelola
const KelolaTugasAkhirKadepPage = lazy(() => import('./pages/kelola/kadep/KelolaTugasAkhir'))
const KelolaMetopenPage = lazy(() => import('./pages/kelola/KelolaMetopen'))
const PenilaianAkhirMetopen = lazy(() => import('./pages/dosen/metopen/PenilaianAkhirMetopen'))
const InboxPembimbing = lazy(() => import('./pages/dosen/InboxPembimbing'))
const DSSKadep = lazy(() => import('./pages/kelola/kadep/DSSKadep'))
const KelolaSopPage = lazy(() => import('./pages/kelola/Sop'))
const KuotaBimbinganPage = lazy(() => import('./pages/master-data/KuotaBimbingan'))

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
              <Route path="/sitemap" element={<SitemapPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/microsoft/callback" element={<MicrosoftCallback />} />
              <Route path="/auth/activate/success" element={<ActivationSuccess />} />
              <Route path="/auth/inactive" element={<AccountInactive />} />
              <Route path="/auth/activate/email-sent" element={<ActivationEmailSent />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify/internship-letter/:id" element={<InternshipLetterVerification />} />
              <Route path="/verify/seminar-minutes/:id" element={<InternshipLetterVerification />} />

              <Route path="/field-assessment/:token" element={<FieldAssessmentPage />} />

              <Route element={<ProtectedLayout />}>
                <Route element={<TugasAkhirGuard />}>
                  {/* Thesis Seminar list pages — explicit paths take priority over /:id */}
                  <Route path="/tugas-akhir/seminar-hasil" element={<ThesisSeminarEntryPage />} />
                  <Route path="/tugas-akhir/seminar-hasil/ringkasan" element={<ThesisSeminarEntryPage />} />
                  <Route path="/tugas-akhir/seminar-hasil/riwayat-kehadiran" element={<ThesisSeminarEntryPage />} />
                  <Route path="/tugas-akhir/seminar-hasil/validasi" element={<ThesisSeminarEntryPage />} />
                  <Route path="/tugas-akhir/seminar-hasil/arsip" element={<ThesisSeminarEntryPage />} />
                  <Route path="/tugas-akhir/seminar-hasil/mahasiswa-bimbingan" element={<ThesisSeminarEntryPage />} />
                  <Route path="/tugas-akhir/seminar-hasil/menguji-mahasiswa" element={<ThesisSeminarEntryPage />} />
                  <Route path="/tugas-akhir/seminar-hasil/tetapkan-penguji" element={<ThesisSeminarEntryPage />} />
                  {/* Unified detail route for all roles */}
                  <Route path="/tugas-akhir/seminar-hasil/:id" element={<ThesisSeminarDetailPage />} />
                </Route>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profil />} />

                {/* Student routes - Kerja Praktik */}
                <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                  <Route path="/kerja-praktik" element={<KerjaPraktekGuard />}>
                    <Route index element={<KerjaPraktekOverviewPage />} />
                    <Route path="pendaftaran" element={<InternshipProposalPage />} />
                    <Route path="pendaftaran/baru" element={<RegisterInternshipFormPage />} />
                    <Route path="pendaftaran/edit/:proposalId" element={<RegisterInternshipFormPage />} />
                    <Route path="kegiatan">
                      <Route index element={<Navigate to="logbook" replace />} />
                      <Route path="logbook" element={<InternshipLogbookPage />} />
                      <Route path="bimbingan" element={<InternshipGuidancePage />} />
                      <Route path="bimbingan/:weekNumber" element={<InternshipGuidanceDetailPage />} />
                    </Route>
                    <Route path="seminar">
                      <Route index element={<Navigate to="pelaporan" replace />} />
                      <Route path="pelaporan" element={<InternshipSeminarPage />} />
                      <Route path="laporan-akhir" element={<InternshipSeminarPage />} />
                      <Route path="jadwal" element={<InternshipSeminarPage />} />
                      <Route path="jadwal/:seminarId" element={<InternshipSeminarDetailPage />} />
                      <Route path="nilai" element={<InternshipSeminarPage />} />
                    </Route>

                    {/* Redirect old paths for backward compatibility */}
                    <Route path="pelaporan" element={<Navigate to="seminar/pelaporan" replace />} />
                    <Route path="laporan-akhir" element={<Navigate to="seminar/laporan-akhir" replace />} />
                    <Route path="nilai" element={<Navigate to="seminar/nilai" replace />} />
                  </Route>
                </Route>

                {/* Metode Penelitian - Protected by eligibility guard */}
                <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                  <Route element={<MetopelGuard />}>
                    <Route path="/metopel" element={<MetopenOverviewPage />} />
                    <Route path="/metopel/tugas" element={<MetopenOverviewPage />} />
                    <Route path="/metopel/cari-pembimbing" element={<MetopenOverviewPage />} />
                    <Route path="/metopel/logbook" element={<MetopenOverviewPage />} />
                  </Route>

                  <Route path="tugas-akhir" element={<TugasAkhirGuard />}>
                    <Route index element={<TugasAkhirOverviewPage />} />
                    {/* Removed bimbingan/ route to allow BimbinganEntry to handle role-based redirection */}
                    <Route path="bimbingan/student" element={<StudentGuidance />} />
                    <Route path="bimbingan/student/milestone" element={<StudentMilestonePage />} />
                    <Route path="bimbingan/student/session/:guidanceId" element={<StudentGuidanceSessionPage />} />
                    <Route path="bimbingan/student/history" element={<CompletedHistory />} />
                    <Route path="bimbingan/danger-zone" element={<DangerZonePage />} />
                    {/* Seminar Hasil handled by top-level route */}
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
                <Route element={<TugasAkhirGuard />}>
                  <Route path="/tugas-akhir/sidang" element={<SidangEntry />} />
                </Route>

                {/* Kerja Praktik Shared */}
                <Route path="/kerja-praktik/monitoring" element={<Placeholder title="Kerja Praktek - Monitoring" />} />

                {/* Yudisium shared entry */}
                <Route path="/yudisium" element={<YudisiumEntry />} />

                {/* Yudisium - Student */}
                <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                  <Route path="/yudisium/student" element={<StudentYudisiumPage />} />
                  <Route path="/yudisium/student/exit-survey" element={<StudentExitSurveyPage />} />
                </Route>

                {/* Yudisium - Lecturer */}
                <Route element={<RoleGuard allowedRoles={[...LECTURER_ROLES]} />}>
                  <Route path="/yudisium/lecturer" element={<Navigate to="/yudisium/lecturer/event" replace />} />
                  <Route path="/yudisium/lecturer/event" element={<LecturerYudisiumPage />} />
                  <Route path="/yudisium/lecturer/event/:id" element={<LecturerYudisiumDetailPage />} />
                  <Route path="/yudisium/lecturer/event/:id/participant/:participantId" element={<YudisiumParticipantDetailPage />} />
                </Route>

                <Route element={<RoleGuard allowedRoles={[ROLES.GKM, ROLES.GKM]} />}>
                  <Route path="/yudisium/lecturer/event/:id/participant/:participantId/cpl-validation" element={<YudisiumParticipantCPLValidationPage />} />
                </Route>

                {/* Yudisium - Restricted Lecturer Tabs */}
                <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KOORDINATOR_YUDISIUM]} />}>
                  <Route path="/yudisium/lecturer/persyaratan" element={<LecturerYudisiumPage />} />
                  <Route path="/yudisium/lecturer/exit-survey" element={<LecturerYudisiumPage />} />
                </Route>

                {/* Yudisium - Admin */}
                <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN]} />}>
                  <Route path="/yudisium/admin" element={<AdminYudisiumPage />} />
                  <Route path="/yudisium/admin/:id" element={<AdminYudisiumValidationPage />} />
                  <Route path="/yudisium/admin/:id/participant/:participantId" element={<YudisiumParticipantDetailPage />} />
                </Route>

                {/* Tugas Akhir - Lecturer routes (no guard, different role) */}
                <Route element={<RoleGuard allowedRoles={[...LECTURER_ROLES]} />}>
                  {/* Kerja Praktik - Lecturer Routes */}
                  <Route path="/kerja-praktik/dosen/bimbingan">
                    <Route index element={<InternshipGuidanceOverviewPage />} />
                    <Route path=":internshipId" element={<StudentDetailPage />}>
                      <Route path="bimbingan" element={<StudentGuidanceTimelinePage />} />
                      <Route path="bimbingan/minggu/:weekNumber" element={<GuidanceEvaluatePage />} />
                      <Route path="laporan-akhir" element={<LecturerFinalReportTab />} />
                      <Route path="seminar" element={<LecturerSeminarTab />} />
                      <Route path="nilai" element={<LecturerNilaiTab />} />
                      <Route index element={<Navigate to="bimbingan" replace />} />
                    </Route>
                  </Route>

                  {/* Settings */}
                  <Route path="/tugas-akhir/bimbingan/lecturer/requests" element={<LecturerRequestsPage />} />
                  <Route path="/tugas-akhir/bimbingan/lecturer/session/:guidanceId" element={<LecturerGuidanceSessionPage />} />
                  <Route path="/tugas-akhir/bimbingan/lecturer/my-students" element={<LecturerMyStudentsPage />} />
                  <Route path="/tugas-akhir/bimbingan/lecturer/my-students/:thesisId" element={<LecturerMyStudentDetailPage />} />
                  {/* Seminar Hasil detail handled by unified route /tugas-akhir/seminar-hasil/:id */}
                  <Route path="/tugas-akhir/sidang/lecturer" element={<Navigate to="/tugas-akhir/sidang/lecturer/my-students" replace />} />
                  <Route path="/tugas-akhir/sidang/lecturer/examiner-requests" element={<LecturerThesisDefencePage />} />
                  <Route path="/tugas-akhir/sidang/lecturer/assignment" element={<LecturerDefenceExaminerAssignmentPage />} />
                  <Route path="/tugas-akhir/sidang/lecturer/my-students" element={<LecturerSupervisedStudentDefencesPage />} />
                  <Route path="/tugas-akhir/sidang/lecturer/:defenceId" element={<LecturerDefenceDetailIdentityPage />} />
                  <Route path="/tugas-akhir/sidang/lecturer/:defenceId/assessment" element={<LecturerDefenceDetailAssessmentPage />} />
                  <Route path="/tugas-akhir/sidang/lecturer/:defenceId/minutes" element={<LecturerDefenceDetailMinutesPage />} />
                  <Route path="/tugas-akhir/sidang/lecturer/:defenceId/revision" element={<LecturerDefenceDetailRevisionPage />} />
                  <Route path="/jadwal-ketersediaan" element={<LecturerAvailability />} />
                  <Route path="/dosen/inbox-pembimbing" element={<InboxPembimbing />} />
                </Route>

                {/* Tugas Akhir - Non-student routes (monitoring, etc) */}
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
                  <Route path="/kelola/tugas-akhir/cpmk" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/rubrik-seminar" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/rubrik-sidang" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/kelompok-keilmuan" element={<ScienceGroupPage />} />
                </Route>

                <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN, ROLES.GKM]} />}>
                  <Route path="/kelola/cpl" element={<Cpl />} />
                  <Route path="/kelola/cpl/:id" element={<CplDetailPage />} />
                </Route>

                {/* Kelola Metopen - Dosen Pengampu, Sekdep, Kadep */}
                <Route element={<RoleGuard allowedRoles={[ROLES.DOSEN_METOPEN, ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN]} />}>
                  <Route path="/kelola/metopen" element={<Navigate to="/kelola/metopen/template" replace />} />
                  <Route path="/kelola/metopen/mahasiswa" element={<KelolaMetopenPage />} />
                  <Route path="/kelola/metopen/template" element={<KelolaMetopenPage />} />
                  <Route path="/kelola/metopen/publish" element={<KelolaMetopenPage />} />
                  <Route path="/kelola/metopen/penilaian" element={<KelolaMetopenPage />} />
                  <Route path="/kelola/metopen/penilaian-akhir/:classId" element={<PenilaianAkhirMetopen />} />
                  <Route path="/kelola/metopen/monitoring" element={<KelolaMetopenPage />} />
                </Route>

                {/* Kelola - Sekretaris */}
                <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN]} />}>
                  <Route path="/kelola" element={<Placeholder title="main menu Kelola" />} />
                  <Route path="/kelola/kerja-praktik" element={<Navigate to="/kelola/kerja-praktik/pendaftaran" replace />} />
                  <Route path="/kelola/kerja-praktik/pendaftaran" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/pendaftaran/proposal" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/pendaftaran/balasan" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/pendaftaran/mahasiswa" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/pendaftaran/dosen" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/pendaftaran/bimbingan" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/pendaftaran/cpmk" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/pendaftaran/cpmk/:cpmkId/rubrik" element={<BulkRubricManage />} />
                  <Route path="/kelola/kerja-praktik/dosen/:supervisorId" element={<LecturerWorkloadDetail />} />
                  <Route path="/kelola/kerja-praktik/dosen/:supervisorId/surat-tugas" element={<LecturerWorkloadManageLetter />} />
                  <Route path="/kelola/kerja-praktik/dosen/template/surat-tugas" element={<SupervisorTemplateEditor />} />
                  <Route path="/kelola/kerja-praktik/mahasiswa/:internshipId" element={<InternshipLifecycleDetail />}>
                    <Route path="logbook" element={<div />} />
                    <Route path="bimbingan" element={<div />} />
                    <Route path="seminar" element={<div />} />
                    <Route path="nilai" element={<div />} />
                  </Route>
                  <Route path="/kelola/kerja-praktik/pendaftaran/:proposalId" element={<SekdepInternshipProposalDetailPage />} />
                  <Route path="/kelola/tugas-akhir" element={<Navigate to="/kelola/tugas-akhir/topik" replace />} />
                  <Route path="/kelola/tugas-akhir/topik" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/monitor" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/milestone" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/rubrik-seminar" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/rubrik-sidang" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/master-data" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/cpmk" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/yudisium" element={<Navigate to="/kelola/yudisium/event" replace />} />
                  <Route path="/kelola/yudisium/event" element={<LecturerYudisiumPage />} />
                  <Route path="/kelola/yudisium/persyaratan" element={<LecturerYudisiumPage />} />
                  <Route path="/kelola/yudisium/exit-survey" element={<LecturerYudisiumPage />} />
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
                  <Route path="/kelola/metopen/dss" element={<DSSKadep />} />
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
                  <Route path="/admin/kerja-praktik/seminar/template" element={<BeritaAcaraTemplateEditor />} />
                  <Route path="/admin/kerja-praktik/templates/:name" element={<InternshipTemplateEditor />} />

                  <Route path="/master-data/hari-libur" element={<ManageHolidays />} />
                  <Route path="/tugas-akhir/seminar-hasil/arsip/:id" element={<ThesisSeminarDetailPage />} />
                  <Route path="/tugas-akhir/sidang/admin" element={<AdminThesisDefenceManagementPage />} />
                  <Route path="/master-data/mahasiswa" element={<MahasiswaPage />} />
                  <Route path="/master-data/mahasiswa/:id" element={<MahasiswaDetailPage />} />
                  <Route path="/master-data/dosen" element={<DosenPage />} />
                  <Route path="/master-data/dosen/:id" element={<DosenDetailPage />} />
                  <Route path="/master-data/tugas-akhir" element={<MasterDataTugasAkhirPage />} />
                  <Route path="/master-data/user" element={<UserManagementPage />} />
                  <Route path="/master-data/tahun-ajaran" element={<AcademicYearPage />} />
                  <Route path="/master-data/ruangan" element={<RoomPage />} />
                  <Route path="/master-data/kuota-bimbingan" element={<KuotaBimbinganPage />} />
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
