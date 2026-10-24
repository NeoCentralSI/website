import { useState, useEffect, lazy, Suspense } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes, useParams } from 'react-router-dom'
import { ENV } from '@/config/env'
import { Loading } from '@/components/ui/spinner'
import { AuthProvider, NotificationProvider } from '@/hooks/shared'
import { Toaster } from './components/ui/sonner'
// Static imports: core pages, layout, guards
import ProtectedLayout from './components/layout/ProtectedLayout'
import Placeholder from './pages/Placeholder'
import NotFoundPage from './pages/NotFound'
import InternshipLetterVerification from './pages/kerja-praktik/public/InternshipLetterVerification'
import CekDokumenPage from './pages/public/CekDokumen'
// Guards
import KerjaPraktekGuard from './pages/guards/KerjaPraktekGuard'
import RoleGuard from './pages/guards/RoleGuard'
import { ROLES, LECTURER_ROLES, SUPERVISOR_ROLES } from './lib/roles'

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login'))
const Landing = lazy(() => import('./pages/Landing'))
const SitemapPage = lazy(() => import('./pages/Sitemap'))
const MicrosoftCallback = lazy(() => import('./pages/auth/MicrosoftCallback'))
const ActivationSuccess = lazy(() => import('./pages/auth/ActivationSuccess'))
const AccountInactive = lazy(() => import('./pages/auth/AccountInactive'))
const ActivationEmailSent = lazy(() => import('./pages/auth/ActivationEmailSent'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profil = lazy(() => import('./pages/profil/Profil'))
// Tugas Akhir - Bimbingan
const BimbinganEntry = lazy(() => import('./pages/tugas-akhir/bimbingan/BimbinganEntry'))
const StudentGuidance = lazy(() => import('./pages/tugas-akhir/bimbingan/student/StudentGuidance'));
const StudentMilestonePage = lazy(() => import('./pages/tugas-akhir/bimbingan/student/Milestone'));
const StudentGuidanceSessionPage = lazy(() => import('./pages/tugas-akhir/bimbingan/student/GuidanceSession'))
const LecturerRequestsPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/Requests'))
const LecturerGuidanceSessionPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/GuidanceSession'))
const LecturerMyStudentsPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/MyStudents'))
const LecturerMyStudentDetailPage = lazy(() => import('./pages/tugas-akhir/bimbingan/lecturer/MyStudentDetail'))
const SecretaryKelolaTugasAkhirPage = lazy(() => import('./pages/tugas-akhir/bimbingan/secretary/TugasAkhir'))
const LecturerSupervisorRequestsPage = lazy(() => import('./pages/tugas-akhir/permohonan/LecturerSupervisorRequests'))
const ThesisChangeRequestsPage = lazy(() => import('./pages/tugas-akhir/perubahan/ThesisChangeRequests'))
const ThesisGuidanceEvaluationsPage = lazy(() => import('./pages/tugas-akhir/evaluasi/ThesisGuidanceEvaluations'))
// Tugas Akhir - Seminar Hasil
const ThesisSeminarEntryPage = lazy(() => import('./pages/thesis-seminar/ThesisSeminarEntry'))
const ThesisSeminarDetailPage = lazy(() => import('./pages/thesis-seminar/ThesisSeminarDetail'))
// Tugas Akhir - Sidang
const ThesisDefenceEntryPage = lazy(() => import('./pages/thesis-defence/ThesisDefenceEntry'))
const ThesisDefenceDetailPage = lazy(() => import('./pages/thesis-defence/ThesisDefenceDetail'))
// Kerja Praktik - Dosen
const InternshipGuidanceOverviewPage = lazy(() => import('./pages/kerja-praktik/dosen/GuidanceOverview'))
const StudentDetailPage = lazy(() => import('./pages/kerja-praktik/dosen/StudentDetail'))
const StudentGuidanceTimelinePage = lazy(() => import('./pages/kerja-praktik/dosen/StudentGuidanceTimeline'))
const GuidanceEvaluatePage = lazy(() => import('./pages/kerja-praktik/dosen/GuidanceEvaluate'))
const LecturerFinalReportTab = lazy(() => import('./pages/kerja-praktik/dosen/LecturerFinalReportTab'))
const LecturerSeminarTab = lazy(() => import('./pages/kerja-praktik/dosen/LecturerSeminarTab'))
const LecturerNilaiTab = lazy(() => import('./pages/kerja-praktik/dosen/LecturerNilaiTab'))
// Kerja Praktik - Student
const InternshipProposalPage = lazy(() => import('./pages/kerja-praktik/student/registration/Registration'))
const RegisterInternshipFormPage = lazy(() => import('./pages/kerja-praktik/student/registration/RegisterInternshipForm'))
const InternshipLogbookPage = lazy(() => import('./pages/kerja-praktik/student/activity/Logbook'))
const InternshipGuidancePage = lazy(() => import('./pages/kerja-praktik/student/activity/Guidance'))
const InternshipGuidanceDetailPage = lazy(() => import('./pages/kerja-praktik/student/activity/GuidanceDetail'))
const InternshipSeminarPage = lazy(() => import('./pages/kerja-praktik/student/Manage'))
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
const KerjaPraktekOverviewPage = lazy(() => import('./pages/kerja-praktik/student/Overview'))
const ThesisProposalEntryPage = lazy(() => import('./pages/thesis-proposal/ThesisProposalEntry'))
const StudentSupervisorRequestPage = lazy(() => import('./pages/thesis-proposal/StudentSupervisorRequestPage'));
const KadepThesisSupervisorAssignmentPage = lazy(() => import('./pages/thesis-proposal/KadepThesisSupervisorAssignment'))
const SupervisionQuotaPage = lazy(() => import('./pages/thesis-proposal/SupervisionQuota'))
const YudisiumEntry = lazy(() => import('./pages/yudisium/YudisiumEntry'))
const StudentExitSurveyPage = lazy(() => import('./pages/yudisium/StudentExitSurvey'))
const YudisiumDetailPage = lazy(() => import('./pages/yudisium/YudisiumDetail'))
const YudisiumParticipantDetailPage = lazy(() => import('./pages/yudisium/YudisiumParticipantDetail'))
const ExitSurveyFormPage = lazy(() => import('./pages/yudisium/ExitSurveyForm'))
const YudisiumAnnouncementPage = lazy(() => import('./pages/yudisium/YudisiumAnnouncement'))
const RepositoryPage = lazy(() => import('./pages/yudisium/Repository'))
const TugasAkhirOverviewPage = lazy(() => import('./pages/tugas-akhir/Overview'))
// Tugas Akhir - Monitoring
const MonitoringDashboard = lazy(() => import('./pages/tugas-akhir/monitoring/MonitoringDashboard'))
const StudentProgressDetail = lazy(() => import('./pages/tugas-akhir/monitoring/StudentProgressDetail'))
// Dev Tools (development/staging only)
const DevToolsPage = lazy(() => import('./pages/dev-tools/DevTools'))
// Master Data
const UserManagementPage = lazy(() => import('./pages/master-data/UserManagement'))
const ActivityLogPage = lazy(() => import('./pages/master-data/ActivityLog'))
const AcademicYearPage = lazy(() => import('./pages/master-data/AcademicYear'))
const CurriculumPage = lazy(() => import('./pages/master-data/Curriculum'))
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
const ResearchMethodPage = lazy(() => import('./pages/master-data/ResearchMethod'))
const ResearchMethodMonitoringPage = lazy(() => import('./pages/research-method/ClassMonitoring'))
const ResearchMethodAssessmentPage = lazy(() => import('./pages/research-method/ProposalAssessment'))
const ProposalScorePage = lazy(() => import('./pages/research-method/ProposalScorePage'))
const KelolaSopPage = lazy(() => import('./pages/kelola/Sop'))

// Pengumuman
const ThesisSeminarAnnouncementPage = lazy(() => import('./pages/thesis-seminar/ThesisSeminarAnnouncement'))

// Field Assessment Portal
const FieldAssessmentPortal = lazy(() => import('./pages/kerja-praktik/public/field-assessment/FieldAssessmentPortal'))
const FieldAssessmentLogin = lazy(() => import('./pages/kerja-praktik/public/field-assessment/FieldAssessmentLogin'))
const FieldAssessmentLayout = lazy(() => import('./pages/kerja-praktik/public/field-assessment/FieldAssessmentLayout'))
const FieldAssessmentLogbook = lazy(() => import('./pages/kerja-praktik/public/field-assessment/FieldAssessmentLogbook'))
const FieldAssessmentForm = lazy(() => import('./pages/kerja-praktik/public/field-assessment/FieldAssessmentForm'))

/** Old QR links `/verify/document/:token` open Cek Dokumen. */
function LegacyDocumentLinkRedirect() {
  const { token } = useParams<{ token: string }>()
  return <Navigate to={`/cek-dokumen/${token ?? ''}`} replace />
}

function App() {
  const [showServerError, setShowServerError] = useState(false);

  useEffect(() => {
    const handleServerError = () => setShowServerError(true);
    window.addEventListener('server-error', handleServerError);
    return () => window.removeEventListener('server-error', handleServerError);
  }, []);

  if (showServerError) {
    const ServerError = lazy(() => import('@/components/shared/ServerError'));
    return (
      <Suspense fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loading size="lg" text="Memuat..." />
        </div>
      }>
        <ServerError onRetry={() => setShowServerError(false)} />
      </Suspense>
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
              <Route path="/verify/internship-assignment/:id" element={<InternshipLetterVerification />} />
              <Route path="/verify/lecturer-assignment/:id" element={<InternshipLetterVerification />} />
              <Route path="/verify/seminar-minutes/:id" element={<InternshipLetterVerification />} />
              {/* Cek Dokumen (public). QR links of documents issued before it keep working. */}
              <Route path="/cek-dokumen" element={<CekDokumenPage />} />
              <Route path="/cek-dokumen/:token" element={<CekDokumenPage />} />
              <Route path="/verify/document/:token" element={<LegacyDocumentLinkRedirect />} />

              <Route path="/field-assessment/:token" element={<FieldAssessmentPortal />}>
                <Route index element={<FieldAssessmentLogin />} />
                <Route element={<FieldAssessmentLayout />}>
                  <Route path="logbook" element={<FieldAssessmentLogbook />} />
                  <Route path="nilai" element={<FieldAssessmentForm />} />
                </Route>
              </Route>

              <Route element={<ProtectedLayout />}>
                {/* Thesis Seminar list pages — explicit paths take priority over /:id */}
                <Route path="/tugas-akhir/seminar-hasil" element={<ThesisSeminarEntryPage />} />
                <Route path="/tugas-akhir/sidang" element={<ThesisDefenceEntryPage />} />
                {/* Unified detail route for all roles */}
                <Route path="/tugas-akhir/seminar-hasil/:id" element={<ThesisSeminarDetailPage />} />
                <Route path="/tugas-akhir/sidang/:id" element={<ThesisDefenceDetailPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profil />} />

                {/* Student routes - Kerja Praktik */}
                <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                  <Route path="/kerja-praktik" element={<KerjaPraktekGuard />}>
                    <Route index element={<KerjaPraktekOverviewPage />} />
                    <Route path="pendaftaran" element={<InternshipProposalPage />} />
                    <Route path="pendaftaran/baru" element={<RegisterInternshipFormPage />} />
                    <Route path="pendaftaran/edit/:proposalId" element={<RegisterInternshipFormPage />} />
                    <Route path="logbook" element={<Navigate to="/kerja-praktik/kegiatan/logbook" replace />} />
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

                {/* The student "Metode Penelitian" menu is gone; old addresses go to Tugas Akhir > Proposal. */}
                <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                  <Route path="/metopel" element={<Navigate to="/tugas-akhir/proposal" replace />} />
                  <Route path="/metopel/*" element={<Navigate to="/tugas-akhir/proposal" replace />} />

                  {/* The student Tugas Akhir pages are always reachable; without a thesis they show an empty state. */}
                  <Route path="tugas-akhir">
                    <Route index element={<TugasAkhirOverviewPage />} />
                    <Route path="riwayat" element={<TugasAkhirOverviewPage />} />
                    {/* Removed bimbingan/ route to allow BimbinganEntry to handle role-based redirection */}
                    <Route path="bimbingan/student" element={<StudentGuidance />} />
                    <Route path="bimbingan/student/milestone" element={<StudentMilestonePage />} />
                    <Route path="bimbingan/student/session/:guidanceId" element={<StudentGuidanceSessionPage />} />
                    {/* The old Riwayat Bimbingan page: its sessions and PDF log are on the Bimbingan page */}
                    <Route path="bimbingan/student/history" element={<Navigate to="/tugas-akhir/bimbingan/student" replace />} />
                    {/* DangerZone (TA-05) is not restored in the guidance revival (GUIDANCE_REVIVAL_PLAN e1); redirect to TA overview */}
                    <Route path="bimbingan/danger-zone" element={<Navigate to="/tugas-akhir" replace />} />
                    {/* Seminar Hasil and Sidang handled by top-level routes (thesis-seminar/, thesis-defence/) */}
                  </Route>

                </Route>

                {/* Shared Routes (Student & Lecturer & Others)
                    Entry components do internal role-based redirect, but the URL must
                    still be guarded so unauthorized roles do not see the page paint
                    before redirect. */}
                {/* Tugas Akhir Shared — seminar-hasil/sidang handled by top-level routes (thesis-seminar/, thesis-defence/) */}
                <Route path="/tugas-akhir/bimbingan" element={<BimbinganEntry />} />
                {/* Tugas Akhir > Proposal: student page; the entry picks the view per role. */}
                <Route path="/tugas-akhir/proposal" element={<ThesisProposalEntryPage />} />
                {/* The student's request form on its own page */}
                <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA]} />}>
                  <Route path="/tugas-akhir/proposal/pengajuan" element={<StudentSupervisorRequestPage />} />
                </Route>
                {/* The supervisor's score page of one proposal attempt */}
                <Route element={<RoleGuard allowedRoles={[...SUPERVISOR_ROLES]} />}>
                  <Route path="/tugas-akhir/proposal/penilaian/:assessmentId" element={<ProposalScorePage party="supervisor" />} />
                </Route>

                {/* Pengumuman dapat dibaca oleh seluruh pengguna terautentikasi.
                    Mutasi pendaftaran audiens seminar tetap dibatasi untuk Mahasiswa
                    pada komponen dan endpoint backend terkait. */}
                <Route path="/pengumuman" element={<Navigate to="/pengumuman/seminar-hasil" replace />} />
                <Route path="/pengumuman/seminar-hasil" element={<ThesisSeminarAnnouncementPage />} />
                <Route path="/pengumuman/yudisium" element={<YudisiumAnnouncementPage />} />

                {/* Kerja Praktik Shared */}
                <Route element={<RoleGuard allowedRoles={[ROLES.MAHASISWA, ...LECTURER_ROLES, ROLES.ADMIN]} />}>
                  <Route path="/kerja-praktik/monitoring" element={<Placeholder title="Kerja Praktek - Monitoring" />} />
                </Route>

                <Route path="/yudisium" element={<YudisiumEntry />} />
                <Route path="/yudisium/:id" element={<YudisiumDetailPage />} />
                <Route path="/yudisium/:id/peserta/:yudisiumParticipantId" element={<YudisiumParticipantDetailPage />} />
                <Route path="/yudisium/exit-survey" element={<StudentExitSurveyPage />} />
                <Route path="/yudisium/exit-survey/:id" element={<ExitSurveyFormPage />} />
                <Route path="/repositori" element={<RepositoryPage />} />

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
                  <Route path="/kerja-praktik/bimbingan" element={<Navigate to="/kerja-praktik/dosen/bimbingan" replace />} />

                  {/* Settings */}
                  <Route path="/tugas-akhir/bimbingan/lecturer/requests" element={<LecturerRequestsPage />} />
                  <Route path="/tugas-akhir/bimbingan/lecturer/session/:guidanceId" element={<LecturerGuidanceSessionPage />} />
                  <Route path="/tugas-akhir/bimbingan/lecturer/my-students" element={<LecturerMyStudentsPage />} />
                  <Route path="/tugas-akhir/bimbingan/lecturer/my-students/:thesisId" element={<LecturerMyStudentDetailPage />} />
                  {/* Seminar Hasil and Sidang lecturer-side handled by unified top-level routes */}
                  <Route path="/jadwal-ketersediaan" element={<LecturerAvailability />} />
                  {/* Permohonan, Perubahan and Evaluasi have their own pages.
                      Perubahan and Evaluasi are the Ketua Departemen's; the pages send other
                      lecturers to Permohonan and Mahasiswa Bimbingan. */}
                  <Route path="/tugas-akhir/permohonan" element={<LecturerSupervisorRequestsPage />} />
                  <Route path="/tugas-akhir/perubahan" element={<ThesisChangeRequestsPage />} />
                  <Route path="/tugas-akhir/evaluasi" element={<ThesisGuidanceEvaluationsPage />} />
                  <Route path="/dosen/inbox-pembimbing" element={<Navigate to="/tugas-akhir/permohonan" replace />} />
                </Route>

                {/* Monitoring TA — KaDep, Sekdep, GKM (guidance revival: akses GKM baseline dipulihkan,
                    selaras guard backend /thesisGuidance/monitoring = DEPARTMENT_ROLES). */}
                <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN, ROLES.GKM]} />}>
                  <Route path="/tugas-akhir/monitoring" element={<MonitoringDashboard />} />
                  <Route path="/tugas-akhir/monitoring/:thesisId" element={<StudentProgressDetail />} />
                </Route>

                {/* Tugas Akhir - Non-student placeholder routes ("Coming Soon"). */}
                <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN]} />}>
                  <Route path="/tugas-akhir/acc-pembimbing" element={<Placeholder title="Tugas Akhir - ACC Pembimbing" />} />
                  <Route path="/tugas-akhir/acc-rubrik" element={<Placeholder title="Tugas Akhir - ACC Rubrik Penilaian" />} />
                  <Route path="/tugas-akhir/kelola-rubrik" element={<Placeholder title="Tugas Akhir - Kelola Rubrik" />} />
                  <Route path="/tugas-akhir/kelola-yudisium" element={<Placeholder title="Tugas Akhir - Kelola Yudisium" />} />
                  <Route path="/tugas-akhir/kelola" element={<Placeholder title="Tugas Akhir - Kelola (Deprecated)" />} />
                </Route>

                {/* Log Aktivitas: Admin (Master Data), Kadep and Sekdep (read-only, same page) */}
                <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.KETUA_DEPARTEMEN, ROLES.SEKRETARIS_DEPARTEMEN]} />}>
                  <Route path="/master-data/log" element={<ActivityLogPage />} />
                </Route>

                {/* Shared Kelola - Sekdep & Kadep */}
                <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN]} />}>
                  <Route path="/kelola/perusahaan" element={<SekdepCompanyListPage />} />
                  <Route path="/kelola/sop" element={<KelolaSopPage />} />
                  <Route path="/kelola/kelompok-keilmuan" element={<ScienceGroupPage />} />
                </Route>

                {/* Kelola Tugas Akhir (topik, CPMK seminar/sidang, rubrik seminar/sidang) — modul TA penuh */}
                <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN, ROLES.KOORDINATOR_METODE_PENELITIAN]} />}>
                  <Route path="/kelola/tugas-akhir" element={<Navigate to="/kelola/tugas-akhir/topik" replace />} />
                  <Route path="/kelola/tugas-akhir/topik" element={<SecretaryKelolaTugasAkhirPage />} />
                  {/* F2-12: route '/kelola/tugas-akhir/monitor' dihapus — tidak ada tab 'monitor' di TugasAkhir.tsx. */}
                  <Route path="/kelola/tugas-akhir/milestone" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/cpmk" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/rubrik-seminar" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/rubrik-sidang" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/syarat-seminar" element={<SecretaryKelolaTugasAkhirPage />} />
                  <Route path="/kelola/tugas-akhir/syarat-sidang" element={<SecretaryKelolaTugasAkhirPage />} />
                  {/* Old bookmark: the Research Method rubrics live in Kelola > Metode Penelitian. */}
                  <Route path="/kelola/tugas-akhir/rubrik-metopen" element={<Navigate to="/kelola/metode-penelitian" replace />} />
                  <Route path="/kelola/tugas-akhir/master-data" element={<SecretaryKelolaTugasAkhirPage />} />
                </Route>

                {/* Kelola CPL - Sekdep, Kadep, GKM (non-SIMPTA improvement from origin/main) */}
                <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN, ROLES.GKM]} />}>
                  <Route path="/kelola/cpl" element={<CurriculumPage />} />
                  <Route path="/kelola/cpl/:curriculumId" element={<Cpl />} />
                  <Route path="/kelola/cpl/:curriculumId/:cplId" element={<CplDetailPage />} />
                </Route>

                {/* Metode Penelitian: Monitoring Kelas for the coordinator, Kadep, Sekdep and Admin;
                    Penilaian Proposal for the coordinator only. */}
                <Route element={<RoleGuard allowedRoles={[ROLES.KOORDINATOR_METODE_PENELITIAN]} />}>
                  <Route path="/metode-penelitian/penilaian" element={<ResearchMethodAssessmentPage />} />
                  <Route path="/metode-penelitian/penilaian/:assessmentId" element={<ProposalScorePage party="coordinator" />} />
                </Route>
                <Route element={<RoleGuard allowedRoles={[ROLES.KOORDINATOR_METODE_PENELITIAN, ROLES.SEKRETARIS_DEPARTEMEN, ROLES.KETUA_DEPARTEMEN, ROLES.ADMIN]} />}>
                  <Route path="/metode-penelitian/monitoring" element={<ResearchMethodMonitoringPage />} />
                  <Route path="/metode-penelitian" element={<Navigate to="/metode-penelitian/monitoring" replace />} />
                  {/* Old addresses of the former research-method module redirect to the new pages */}
                  <Route path="/kelola/metopen" element={<Navigate to="/metode-penelitian/monitoring" replace />} />
                  <Route path="/kelola/metopen/monitoring" element={<Navigate to="/metode-penelitian/monitoring" replace />} />
                  <Route path="/kelola/metopen/ta03b" element={<Navigate to="/metode-penelitian/penilaian" replace />} />
                </Route>
                <Route path="/kelola/metopen/ta03a" element={<Navigate to="/tugas-akhir/proposal" replace />} />
                <Route path="/kelola/metopen/cpmk-rubrik" element={<Navigate to="/kelola/metode-penelitian" replace />} />
                {/* Batas Bimbingan: Kadep and Sekdep set the limits and see every lecturer's load. */}
                <Route element={<RoleGuard allowedRoles={[ROLES.KETUA_DEPARTEMEN, ROLES.SEKRETARIS_DEPARTEMEN]} />}>
                  <Route path="/kelola/tugas-akhir/batas-bimbingan" element={<SupervisionQuotaPage />} />
                  <Route path="/kelola/metopen/kuota-dosen" element={<Navigate to="/kelola/tugas-akhir/batas-bimbingan" replace />} />
                </Route>
                {/* Kelola > Metode Penelitian: Template Milestone, CPMK, Rubrik Penilaian. One
                    address per tab, as Kelola Tugas Akhir. The Sekretaris Departemen's only. */}
                <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN]} />}>
                  <Route path="/kelola/metode-penelitian" element={<Navigate to="/kelola/metode-penelitian/milestone" replace />} />
                  <Route path="/kelola/metode-penelitian/:tab" element={<ResearchMethodPage />} />
                </Route>

                {/* Kelola - Sekretaris */}
                <Route element={<RoleGuard allowedRoles={[ROLES.SEKRETARIS_DEPARTEMEN]} />}>
                  <Route path="/kelola" element={<Placeholder title="main menu Kelola" />} />
                  <Route path="/kelola/kerja-praktik" element={<Navigate to="/kelola/kerja-praktik/monitoring" replace />} />
                  <Route path="/kelola/kerja-praktik/monitoring" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/proposal" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/balasan" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/mahasiswa" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/dosen" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/bimbingan" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/cpmk" element={<SekdepInternshipProposalPage />} />
                  <Route path="/kelola/kerja-praktik/cpmk/:cpmkId/rubrik" element={<BulkRubricManage />} />
                  <Route path="/kelola/kerja-praktik/dosen/:supervisorId" element={<LecturerWorkloadDetail />} />
                  <Route path="/kelola/kerja-praktik/dosen/:supervisorId/surat-tugas" element={<LecturerWorkloadManageLetter />} />
                  <Route path="/kelola/kerja-praktik/dosen/template/surat-tugas" element={<SupervisorTemplateEditor />} />
                  <Route path="/kelola/kerja-praktik/mahasiswa/:internshipId" element={<InternshipLifecycleDetail />}>
                    <Route path="logbook" element={<div />} />
                    <Route path="bimbingan" element={<div />} />
                    <Route path="seminar" element={<div />} />
                    <Route path="nilai" element={<div />} />
                  </Route>
                  <Route path="/kelola/kerja-praktik/:proposalId" element={<SekdepInternshipProposalDetailPage />} />
                  {/* Kelola Tugas Akhir: routes registered under the shared Sekdep/Kadep/Koordinator Metode Penelitian guard above */}
                  {/* Yudisium Management - Redirect to unified detail if specific actions needed, or keep for list */}
                  <Route path="/kelola/yudisium" element={<Navigate to="/yudisium" replace />} />
                  <Route path="/kelola/yudisium/event" element={<Navigate to="/yudisium" replace />} />
                  <Route path="/kelola/yudisium/persyaratan" element={<Navigate to="/yudisium" replace />} />
                  <Route path="/kelola/yudisium/exit-survey" element={<Navigate to="/yudisium" replace />} />
                </Route>

                {/* Tugas Akhir > Penetapan Pembimbing: Kadep decides and issues; Sekdep reads. */}
                <Route element={<RoleGuard allowedRoles={[ROLES.KETUA_DEPARTEMEN, ROLES.SEKRETARIS_DEPARTEMEN]} />}>
                  <Route path="/kelola/tugas-akhir/kadep/penetapan-pembimbing" element={<KadepThesisSupervisorAssignmentPage />} />
                </Route>

                {/* Kelola - Kadep */}
                <Route element={<RoleGuard allowedRoles={[ROLES.KETUA_DEPARTEMEN]} />}>
                  {/* The old Kadep addresses go to Penetapan Pembimbing. */}
                  <Route path="/kelola/tugas-akhir/kadep" element={<Navigate to="/kelola/tugas-akhir/kadep/penetapan-pembimbing" replace />} />
                  <Route path="/kelola/tugas-akhir/kadep/pembimbing" element={<Navigate to="/kelola/tugas-akhir/kadep/penetapan-pembimbing" replace />} />
                  <Route path="/kelola/tugas-akhir/kadep/pengesahan-judul" element={<Navigate to="/kelola/tugas-akhir/kadep/penetapan-pembimbing" replace />} />
                  {/* "Persetujuan Tugas Akhir" is gone; its addresses go to the Kadep's submenus. */}
                  <Route path="/kelola/tugas-akhir/kadep/perubahan" element={<Navigate to="/tugas-akhir/perubahan" replace />} />
                  <Route path="/kelola/tugas-akhir/kadep/evaluasi" element={<Navigate to="/tugas-akhir/evaluasi" replace />} />
                  <Route path="/kelola/tugas-akhir/kadep/pergantian-pembimbing" element={<Navigate to="/tugas-akhir/perubahan" replace />} />
                  {/* Kerja Praktik Kadep (non-SIMPTA, from origin/main) */}
                  <Route path="/kelola/kerja-praktik/kadep" element={<Navigate to="/kelola/kerja-praktik/kadep/monitoring" replace />} />
                  <Route path="/kelola/kerja-praktik/kadep/monitoring" element={<KadepInternshipManagementPage />} />
                  <Route path="/kelola/kerja-praktik/kadep/persetujuan" element={<KadepInternshipManagementPage />} />
                  <Route path="/kelola/kerja-praktik/kadep/persetujuan/permohonan" element={<KadepInternshipManagementPage />} />
                  <Route path="/kelola/kerja-praktik/kadep/persetujuan/penugasan" element={<KadepInternshipManagementPage />} />
                  <Route path="/kelola/kerja-praktik/kadep/persetujuan/dosen" element={<KadepInternshipManagementPage />} />
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
                  <Route path="/admin/kerja-praktik/seminar/template" element={<BeritaAcaraTemplateEditor />} />
                  <Route path="/admin/kerja-praktik/templates/:name" element={<InternshipTemplateEditor />} />
                  {/* Seminar Hasil and Sidang admin handled by unified top-level routes (thesis-seminar/, thesis-defence/) */}
                  <Route path="/master-data/hari-libur" element={<ManageHolidays />} />
                  <Route path="/master-data/mahasiswa" element={<MahasiswaPage />} />
                  <Route path="/master-data/mahasiswa/:id" element={<MahasiswaDetailPage />} />
                  <Route path="/master-data/dosen" element={<DosenPage />} />
                  <Route path="/master-data/dosen/:id" element={<DosenDetailPage />} />
                  <Route path="/master-data/tugas-akhir" element={<MasterDataTugasAkhirPage />} />
                  <Route path="/master-data/user" element={<UserManagementPage />} />
                  <Route path="/master-data/tahun-ajaran" element={<AcademicYearPage />} />
                  <Route path="/master-data/ruangan" element={<RoomPage />} />
                  {/* Batas Bimbingan belongs to Kadep and Sekdep; Admin has no page for it. */}
                  {/* DevTools simulator: only registered when explicitly enabled outside production. */}
                  {ENV.ENABLE_DEV_TOOLS && (
                    <>
                      <Route path="/admin/dev-tools" element={<Navigate to="/admin/dev-tools/users" replace />} />
                      <Route path="/admin/dev-tools/:tab" element={<DevToolsPage />} />
                    </>
                  )}
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
