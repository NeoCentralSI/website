import { useEffect, useMemo, type ReactNode } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useRole } from '@/hooks/shared/useRole';
import { getStudentDetailAPI } from '@/services/admin.service';
import { useQuery } from '@tanstack/react-query';
import { toTitleCaseName, formatRoleName, formatDateId } from '@/lib/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
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
  Shield
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'Berjalan': 'bg-blue-100 text-blue-700 border-blue-200',
  'Selesai': 'bg-green-100 text-green-700 border-green-200',
  'Dibatalkan': 'bg-red-100 text-red-700 border-red-200',
  'Menunggu': 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const MILESTONE_STATUS_ICONS: Record<string, ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  not_started: <Clock className="h-4 w-4 text-gray-300" />,
  revision_needed: <AlertTriangle className="h-4 w-4 text-red-500" />,
  pending_review: <Clock className="h-4 w-4 text-yellow-500" />,
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

  const activeThesis = data.theses.find((t) => t.status !== 'Selesai' && t.status !== 'Dibatalkan');
  const completedTheses = data.theses.filter((t) => t.status === 'Selesai');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link to="/master-data/mahasiswa">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{toTitleCaseName(data.fullName)}</h1>
            <p className="text-muted-foreground">
              {data.identityNumber} • {data.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={data.isVerified ? 'default' : 'secondary'}>
            {data.isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
          </Badge>
          <Badge variant="outline" className={data.student.status === 'Aktif' ? 'border-green-500 text-green-600' : ''}>
            {data.student.status || 'Tidak diketahui'}
          </Badge>
        </div>
      </div>

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
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Skripsi</p>
                <p className="text-xl font-bold">{data.theses.length}</p>
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
          </CardContent>
        </Card>

        {/* Right Column - Thesis Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Thesis */}
          {activeThesis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4" />
                  Skripsi Aktif
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {activeThesis.title || <span className="italic text-muted-foreground">Judul belum ditentukan</span>}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={STATUS_COLORS[activeThesis.status || ''] || 'bg-gray-100 text-gray-700'}>
                      {activeThesis.status || 'Tidak diketahui'}
                    </Badge>
                    {activeThesis.topic && (
                      <Badge variant="outline">{activeThesis.topic}</Badge>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress Milestone</span>
                    <span className="font-bold text-primary">{activeThesis.milestones.progress}%</span>
                  </div>
                  <Progress value={activeThesis.milestones.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {activeThesis.milestones.completed} dari {activeThesis.milestones.total} milestone selesai
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Mulai</p>
                    <p className="font-medium">{activeThesis.startDate ? formatDateId(activeThesis.startDate) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deadline</p>
                    <p className="font-medium">{activeThesis.deadlineDate ? formatDateId(activeThesis.deadlineDate) : '-'}</p>
                  </div>
                </div>

                {/* Supervisors */}
                {activeThesis.supervisors.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Pembimbing
                    </p>
                    <div className="space-y-2">
                      {activeThesis.supervisors.map((sup, idx) => (
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

                {/* Examiners */}
                {activeThesis.examiners.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Penguji
                    </p>
                    <div className="space-y-2">
                      {activeThesis.examiners.map((ex, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div>
                            <p className="text-sm font-medium">{toTitleCaseName(ex.fullName)}</p>
                            <p className="text-xs text-muted-foreground">{ex.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {formatRoleName(ex.role)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {activeThesis.milestones.items.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Milestone ({activeThesis.milestones.completed}/{activeThesis.milestones.total})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {activeThesis.milestones.items.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                          {MILESTONE_STATUS_ICONS[m.status] || <Clock className="h-4 w-4 text-gray-300" />}
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

                {/* Seminars & Defences */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Seminar</p>
                    {activeThesis.seminars.length > 0 ? (
                      <div className="space-y-1">
                        {activeThesis.seminars.map((s) => (
                          <div key={s.id} className="p-2 bg-muted rounded-md">
                            <p className="text-sm font-medium capitalize">{s.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.result || s.status} {s.score ? `- Nilai: ${s.score}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        size="sm" 
                        title="Belum Ada Seminar" 
                        description="Belum ada seminar terdaftar" 
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Sidang</p>
                    {activeThesis.defences.length > 0 ? (
                      <div className="space-y-1">
                        {activeThesis.defences.map((d) => (
                          <div key={d.id} className="p-2 bg-muted rounded-md">
                            <p className="text-sm font-medium">{d.result || d.status}</p>
                            <p className="text-xs text-muted-foreground">
                              {d.score ? `Nilai: ${d.score}` : 'Belum ada nilai'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        size="sm" 
                        title="Belum Ada Sidang" 
                        description="Belum ada sidang terdaftar" 
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Active Thesis */}
          {!activeThesis && (
            <Card>
              <CardContent className="py-12">
                <EmptyState 
                  title="Tidak Ada Skripsi Aktif" 
                  description="Mahasiswa ini belum memiliki skripsi yang sedang berjalan" 
                />
              </CardContent>
            </Card>
          )}

          {/* Completed Theses */}
          {completedTheses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Skripsi Selesai ({completedTheses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedTheses.map((thesis) => (
                    <div key={thesis.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{thesis.title || 'Judul tidak tersedia'}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-green-100 text-green-700">Selesai</Badge>
                        {thesis.topic && <Badge variant="outline">{thesis.topic}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
