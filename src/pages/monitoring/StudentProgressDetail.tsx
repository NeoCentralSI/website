import { useEffect, useMemo, type ReactNode } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useThesisDetail } from '@/hooks/monitoring';
import { toTitleCaseName, formatRoleName, formatDateId } from '@/lib/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loading } from '@/components/ui/spinner';
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
  Activity,
  Award
} from 'lucide-react';
import Lottie from 'lottie-react';
import emptyAnimation from '@/assets/lottie/empty.json';

const STATUS_COLORS: Record<string, string> = {
  'Bimbingan': 'bg-blue-100 text-blue-700 border-blue-200',
  'Acc Seminar': 'bg-amber-100 text-amber-700 border-amber-200',
  'Selesai': 'bg-green-100 text-green-700 border-green-200',
  'Gagal': 'bg-red-100 text-red-700 border-red-200',
};

const MILESTONE_STATUS_ICONS: Record<string, ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  not_started: <Clock className="h-4 w-4 text-gray-300" />,
  revision_needed: <AlertTriangle className="h-4 w-4 text-red-500" />,
  pending_review: <Clock className="h-4 w-4 text-yellow-500" />,
};

const GUIDANCE_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  approved: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

function EmptyState({ message, icon: Icon }: { message: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Lottie 
        animationData={emptyAnimation} 
        loop 
        className="w-32 h-32 opacity-70" 
      />
      <div className="flex items-center gap-2 text-muted-foreground mt-2">
        <Icon className="h-4 w-4" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

export default function StudentProgressDetail() {
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { thesisId } = useParams<{ thesisId: string }>();

  const breadcrumbs = useMemo(() => [
    { label: 'Tugas Akhir' },
    { label: 'Monitoring', href: '/tugas-akhir/monitoring' },
    { label: 'Detail Progress' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Progress Mahasiswa');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const { data, isLoading, isError } = useThesisDetail(thesisId!);

  // Update breadcrumb with student name
  useEffect(() => {
    if (data?.student?.name) {
      setBreadcrumbs([
        { label: 'Tugas Akhir' },
        { label: 'Monitoring', href: '/tugas-akhir/monitoring' },
        { label: toTitleCaseName(data.student.name) },
      ]);
    }
  }, [data, setBreadcrumbs]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail progress..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
        <p className="text-muted-foreground mb-4">Gagal memuat data progress. Silakan coba lagi.</p>
        <Button asChild variant="outline">
          <Link to="/tugas-akhir/monitoring">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/tugas-akhir/monitoring')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{toTitleCaseName(data.student.name)}</h1>
            <p className="text-muted-foreground">
              {data.student.nim} • {data.student.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={STATUS_COLORS[data.status || ''] || 'bg-gray-100 text-gray-700'}>
            {data.status || 'Tidak diketahui'}
          </Badge>
          {data.seminarApproval.isFullyApproved && (
            <Badge className="bg-amber-100 text-amber-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Acc Seminar
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress Milestone</p>
                <p className="text-xl font-bold">{data.progress.percent}%</p>
                <p className="text-xs text-muted-foreground">
                  {data.progress.completed}/{data.progress.total} selesai
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bimbingan</p>
                <p className="text-xl font-bold">{data.guidances.completed}</p>
                <p className="text-xs text-muted-foreground">
                  dari {data.guidances.total} sesi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seminar</p>
                <p className="text-xl font-bold">{data.seminars.length}</p>
                <p className="text-xs text-muted-foreground">terjadwal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sidang</p>
                <p className="text-xl font-bold">{data.defences.length}</p>
                <p className="text-xs text-muted-foreground">terjadwal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student & Thesis Info */}
        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Informasi Mahasiswa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{data.student.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Telepon</p>
                  <p className="text-sm font-medium">{data.student.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">NIM</p>
                  <p className="text-sm font-medium">{data.student.nim || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thesis Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Informasi Tugas Akhir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Judul</p>
                <p className="text-sm font-medium">
                  {data.title || <span className="italic text-muted-foreground">Belum ditentukan</span>}
                </p>
              </div>
              {data.topic && (
                <div>
                  <p className="text-xs text-muted-foreground">Topik</p>
                  <Badge variant="outline">{data.topic}</Badge>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tahun Ajaran</p>
                  <p className="text-sm font-medium">{data.academicYear || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aktivitas Terakhir</p>
                  <p className="text-sm font-medium">{formatDateId(data.lastActivity)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mulai</p>
                    <p className="text-sm font-medium">{data.startDate ? formatDateId(data.startDate) : '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="text-sm font-medium">{data.deadlineDate ? formatDateId(data.deadlineDate) : '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supervisors & Examiners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Pembimbing & Penguji
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.supervisors.length > 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Pembimbing</p>
                  <div className="space-y-2">
                    {data.supervisors.map((sup, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{toTitleCaseName(sup.name)}</p>
                          <p className="text-xs text-muted-foreground truncate">{sup.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 ml-2">
                          {formatRoleName(sup.role)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState message="Belum ada pembimbing" icon={Users} />
              )}
              
              {data.examiners.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Penguji</p>
                  <div className="space-y-2">
                    {data.examiners.map((ex, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{toTitleCaseName(ex.name)}</p>
                          <p className="text-xs text-muted-foreground truncate">{ex.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 ml-2">
                          {formatRoleName(ex.role)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Progress Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestone Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Progress Milestone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Progress</span>
                  <span className="font-bold text-primary">{data.progress.percent}%</span>
                </div>
                <Progress value={data.progress.percent} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {data.progress.completed} dari {data.progress.total} milestone selesai
                </p>
              </div>

              {/* Milestones List */}
              {data.milestones.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {MILESTONE_STATUS_ICONS[m.status] || <Clock className="h-4 w-4 text-gray-300" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.completedAt 
                            ? `Selesai: ${formatDateId(m.completedAt)}` 
                            : m.targetDate 
                              ? `Target: ${formatDateId(m.targetDate)}` 
                              : 'Belum ada target'}
                        </p>
                      </div>
                      {m.progressPercentage !== null && (
                        <Badge variant="outline" className="shrink-0">
                          {m.progressPercentage}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Belum ada milestone" icon={Target} />
              )}
            </CardContent>
          </Card>

          {/* Recent Guidances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Riwayat Bimbingan
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  {data.guidances.completed}/{data.guidances.total} selesai
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.guidances.items.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.guidances.items.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {g.topic || 'Bimbingan'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateId(g.createdAt)}
                        </p>
                      </div>
                      <Badge className={GUIDANCE_STATUS_COLORS[g.status] || 'bg-gray-100 text-gray-700'}>
                        {g.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Belum ada bimbingan" icon={BookOpen} />
              )}
            </CardContent>
          </Card>

          {/* Seminars & Defences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seminars */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="h-4 w-4" />
                  Seminar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.seminars.length > 0 ? (
                  <div className="space-y-3">
                    {data.seminars.map((s) => (
                      <div key={s.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={s.result === 'Lulus' ? 'default' : 'outline'}>
                            {s.result || s.status}
                          </Badge>
                          {s.averageScore && (
                            <span className="text-sm font-bold">{s.averageScore}</span>
                          )}
                        </div>
                        {s.scheduledAt && (
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDateId(s.scheduledAt)}
                          </p>
                        )}
                        {s.room && (
                          <p className="text-xs text-muted-foreground">
                            Ruangan: {s.room}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Belum ada seminar" icon={GraduationCap} />
                )}
              </CardContent>
            </Card>

            {/* Defences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-4 w-4" />
                  Sidang
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.defences.length > 0 ? (
                  <div className="space-y-3">
                    {data.defences.map((d) => (
                      <div key={d.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={d.status === 'Lulus' ? 'default' : 'outline'}>
                            {d.status || 'Terjadwal'}
                          </Badge>
                          {d.averageScore && (
                            <span className="text-sm font-bold">{d.averageScore}</span>
                          )}
                        </div>
                        {d.scheduledAt && (
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDateId(d.scheduledAt)}
                          </p>
                        )}
                        {d.room && (
                          <p className="text-xs text-muted-foreground">
                            Ruangan: {d.room}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Belum ada sidang" icon={Award} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
