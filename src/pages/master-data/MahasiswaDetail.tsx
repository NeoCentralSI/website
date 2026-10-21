import { useEffect, useMemo, type ReactNode } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useRole } from '@/hooks/shared/useRole';
import { getStudentDetailAPI } from '@/services/admin.service';
import { useQuery } from '@tanstack/react-query';
import { toTitleCaseName, formatRoleName, formatDateId, formatDateShortId } from '@/lib/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Target,
  FileText,
  Shield,
  Award
} from 'lucide-react';
import { ThesisStatusBadge } from '@/components/shared/ThesisStatusBadge';
import { PageHeading } from '@/components/shared/PageHeading';
import { getThesisEventStatusLabel, type ThesisEventStatus } from '@/components/shared/ThesisEventStatusBadge';
import { getStudentStatusLabel } from '@/lib/thesisLabels';
import { StudentSemesterFlagsCard } from '@/components/master-data/StudentSemesterFlagsCard';

const MILESTONE_STATUS_ICONS: Record<string, ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  not_started: <Clock className="h-4 w-4 text-gray-300" />,
  revision_needed: <AlertTriangle className="h-4 w-4 text-red-500" />,
  pending_review: <Clock className="h-4 w-4 text-yellow-500" />,
};

const CPL_STATUS_LABELS: Record<string, string> = {
  calculated: 'Dihitung',
  verified: 'Diverifikasi',
  finalized: 'Final',
};

export default function MahasiswaDetail() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { id } = useParams<{ id: string }>();

  const breadcrumbs = useMemo(() => [
    { label: 'Master Data', href: '/master-data/mahasiswa' },
    { label: 'Data Mahasiswa', href: '/master-data/mahasiswa' },
    { label: 'Detail' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Mahasiswa');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: () => getStudentDetailAPI(id!).then((res) => res.data),
    enabled: !!id,
  });

  // Update breadcrumb with student name
  useEffect(() => {
    if (data?.fullName) {
      setBreadcrumbs([
        { label: 'Master Data', href: '/master-data/mahasiswa' },
        { label: 'Data Mahasiswa', href: '/master-data/mahasiswa' },
        { label: toTitleCaseName(data.fullName) },
      ]);
    }
  }, [data, setBreadcrumbs]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Memuat detail mahasiswa...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
        <p className="text-muted-foreground mb-4">Gagal memuat data mahasiswa. Silakan coba lagi.</p>
        <Button asChild variant="outline">
          <Link to="/master-data/mahasiswa">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>
    );
  }

  const activeThesis = data.theses.find((t) => t.status !== 'completed' && t.status !== 'failed');
  const currentThesis = activeThesis ?? data.theses.find((t) => t.status === 'completed') ?? data.theses[0] ?? null;
  const otherTheses = data.theses.filter((t) => t.id !== currentThesis?.id);
  const semesterFlags = data.student.semesterFlags ?? [];
  /** "Lulus · 14 Oktober 2026", or "—" before the first registration. */
  const eventLine = (event?: { status: string; date: string | null }) =>
    event ? [getThesisEventStatusLabel(event.status as ThesisEventStatus), event.date ? formatDateShortId(event.date) : null].filter(Boolean).join(' · ') : '—';

  return (
    <div className="p-6 space-y-6">
      {/* Header: the size of every page heading, with the back button. */}
      <PageHeading
        title={toTitleCaseName(data.fullName)}
        subtitle={[data.identityNumber, data.email].filter(Boolean).join(' · ')}
        backTo="/master-data/mahasiswa"
        backLabel="Kembali ke Data Mahasiswa"
      >
        <div className="flex items-center gap-2">
          <Badge variant={data.isVerified ? 'default' : 'secondary'}>
            {data.isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
          </Badge>
          <Badge variant="outline" className={data.student.status === 'active' ? 'border-green-500 text-green-600' : ''}>
            {getStudentStatusLabel(data.student.status)}
          </Badge>
        </div>
      </PageHeading>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tahun Masuk</p>
                <p className="text-xl font-bold">{data.student.enrollmentYear || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SKS Selesai</p>
                <p className="text-xl font-bold">{data.student.sksCompleted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IPK</p>
                <p className="text-xl font-bold">{data.student.gpa != null ? data.student.gpa.toFixed(2) : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="text-lg font-semibold truncate">
                  {data.roles.map((r) => formatRoleName(r.name)).join(', ') || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Informasi Pribadi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{data.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Telepon</p>
                <p className="text-sm font-medium">{data.phoneNumber || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">NIM</p>
                <p className="text-sm font-medium">{data.identityNumber || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Terdaftar</p>
                <p className="text-sm font-medium">{formatDateId(data.createdAt)}</p>
              </div>
            </div>

            {/* Data Akademik SIA */}
            <div className="border-t pt-4 mt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Data Akademik SIA</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Semester</span>
                  <Badge variant="outline">{data.student.currentSemester ?? '-'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">IPK</span>
                  <Badge variant="outline">{data.student.gpa != null ? data.student.gpa.toFixed(2) : '-'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Predikat</span>
                  <Badge variant="outline">{data.student.graduationPredicate || '-'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">MK Wajib</span>
                  <Badge variant={data.student.mandatoryCoursesCompleted ? 'default' : 'secondary'} className={data.student.mandatoryCoursesCompleted ? 'bg-green-600' : ''}>
                    {data.student.mandatoryCoursesCompleted ? 'Lulus' : 'Belum'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">MKWU</span>
                  <Badge variant={data.student.mkwuCompleted ? 'default' : 'secondary'} className={data.student.mkwuCompleted ? 'bg-green-600' : ''}>
                    {data.student.mkwuCompleted ? 'Lulus' : 'Belum'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kerja Praktik</span>
                  <Badge variant={data.student.internshipCompleted ? 'default' : 'secondary'} className={data.student.internshipCompleted ? 'bg-green-600' : ''}>
                    {data.student.internshipCompleted ? 'Lulus' : 'Belum'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">KKN</span>
                  <Badge variant={data.student.kknCompleted ? 'default' : 'secondary'} className={data.student.kknCompleted ? 'bg-green-600' : ''}>
                    {data.student.kknCompleted ? 'Lulus' : 'Belum'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Metode Penelitian</span>
                  <Badge variant={data.student.researchMethodCompleted ? 'default' : 'secondary'} className={data.student.researchMethodCompleted ? 'bg-green-600' : ''}>
                    {data.student.researchMethodCompleted ? 'Lulus' : 'Belum'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Nilai CPL */}
            {data.cplScores && data.cplScores.length > 0 && (
              <div className="border-t pt-4 mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Nilai CPL
                  <Badge variant="outline" className="ml-2 text-xs">{data.cplScores.length}</Badge>
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.cplScores.map((cpl) => {
                    const passed = cpl.minimalScore != null ? cpl.score >= cpl.minimalScore : true;
                    const statusColor =
                      cpl.status === 'finalized' ? 'bg-purple-100 text-purple-700' :
                      cpl.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-blue-100 text-blue-700';
                    return (
                      <div key={cpl.cplId} className="p-2 bg-muted/50 rounded-md space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{cpl.cplCode || '-'}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg font-bold">{cpl.score}</span>
                            {cpl.minimalScore != null && (
                              <Badge variant="outline" className="text-[10px] px-1">
                                min {cpl.minimalScore}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {cpl.cplDescription && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{cpl.cplDescription}</p>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[10px] px-1.5 ${statusColor}`}>
                            {CPL_STATUS_LABELS[cpl.status] || cpl.status}
                          </Badge>
                          <Badge variant={passed ? 'default' : 'destructive'} className={`text-[10px] px-1.5 ${passed ? 'bg-green-600' : ''}`}>
                            {passed ? 'Lulus' : 'Belum Lulus'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Thesis Info */}
        <div className="lg:col-span-2 space-y-6">
          <StudentSemesterFlagsCard studentId={data.id} semesterFlags={semesterFlags} canEdit={isAdmin()} />

          {/* Tugas Akhir: the running thesis, else the latest one. */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Tugas Akhir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentThesis ? (
                <p className="text-sm text-muted-foreground">Mahasiswa ini belum memiliki tugas akhir.</p>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {currentThesis.title || <span className="italic text-muted-foreground">Judul belum ditentukan</span>}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <ThesisStatusBadge status={currentThesis.status} />
                      {currentThesis.topic && <Badge variant="outline">{currentThesis.topic}</Badge>}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progres Milestone</span>
                      <span className="font-bold text-primary">{currentThesis.milestones.progress}%</span>
                    </div>
                    <Progress value={currentThesis.milestones.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {currentThesis.milestones.completed} dari {currentThesis.milestones.total} milestone selesai
                    </p>
                  </div>

                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[9rem_1fr]">
                    <dt className="text-muted-foreground">Mulai</dt>
                    <dd className="font-medium">{currentThesis.startDate ? formatDateShortId(currentThesis.startDate) : '—'}</dd>
                    <dt className="text-muted-foreground">Seminar Hasil</dt>
                    <dd className="font-medium">{eventLine(currentThesis.seminars[0])}</dd>
                    <dt className="text-muted-foreground">Sidang TA</dt>
                    <dd className="font-medium">{eventLine(currentThesis.defences[0])}</dd>
                  </dl>

                  {/* Supervisors */}
                  {currentThesis.supervisors.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Pembimbing
                      </p>
                      <div className="space-y-2">
                        {currentThesis.supervisors.map((sup, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div>
                              <p className="text-sm font-medium">{toTitleCaseName(sup.fullName)}</p>
                              <p className="text-xs text-muted-foreground">{sup.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {formatRoleName(sup.role)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones */}
                  {currentThesis.milestones.items.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Milestone ({currentThesis.milestones.completed}/{currentThesis.milestones.total})
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {currentThesis.milestones.items.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                            {MILESTONE_STATUS_ICONS[m.status] || <Clock className="h-4 w-4 text-muted-foreground" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{m.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {m.completedAt ? `Selesai ${formatDateId(m.completedAt)}` : m.targetDate ? `Target ${formatDateId(m.targetDate)}` : 'Belum ada target'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Earlier theses, one line each. */}
              {otherTheses.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Tugas Akhir Sebelumnya</p>
                  <ul className="space-y-1.5">
                    {otherTheses.map((thesis) => (
                      <li key={thesis.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <ThesisStatusBadge status={thesis.status} />
                        <span className="min-w-0 truncate">{thesis.title || 'Judul tidak tersedia'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
