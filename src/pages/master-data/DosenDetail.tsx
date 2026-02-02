import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useRole } from '@/hooks/shared/useRole';
import { getLecturerDetailAPI } from '@/services/admin.service';
import { useQuery } from '@tanstack/react-query';
import { toTitleCaseName, formatRoleName, formatDateId } from '@/lib/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  GraduationCap,
  FileText,
  Shield,
  Briefcase,
  Clock
} from 'lucide-react';

export default function DosenDetail() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { id } = useParams<{ id: string }>();

  const breadcrumbs = useMemo(() => [
    { label: 'Master Data', href: '/master-data/dosen' },
    { label: 'Data Dosen', href: '/master-data/dosen' },
    { label: 'Detail' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Dosen');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lecturer-detail', id],
    queryFn: () => getLecturerDetailAPI(id!).then((res) => res.data),
    enabled: !!id,
  });

  // Update breadcrumb with lecturer name
  useEffect(() => {
    if (data?.fullName) {
      setBreadcrumbs([
        { label: 'Master Data', href: '/master-data/dosen' },
        { label: 'Data Dosen', href: '/master-data/dosen' },
        { label: toTitleCaseName(data.fullName) },
      ]);
    }
  }, [data, setBreadcrumbs]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Memuat detail dosen...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
        <p className="text-muted-foreground mb-4">Gagal memuat data dosen. Silakan coba lagi.</p>
        <Button asChild variant="outline">
          <Link to="/master-data/dosen">
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
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link to="/master-data/dosen">
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
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bimbingan Aktif</p>
                <p className="text-2xl font-bold">{data.statistics.activeSupervising}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bimbingan Selesai</p>
                <p className="text-2xl font-bold">{data.statistics.completedSupervising}</p>
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
                <p className="text-sm text-muted-foreground">Total Bimbingan</p>
                <p className="text-2xl font-bold">{data.statistics.totalSupervising}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Briefcase className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Penguji</p>
                <p className="text-2xl font-bold">{data.statistics.examining}</p>
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
                <p className="text-xs text-muted-foreground">NIP</p>
                <p className="text-sm font-medium">{data.identityNumber || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Kelompok Keilmuan</p>
                <p className="text-sm font-medium">{data.lecturer.scienceGroup || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.roles.map((r) => (
                    <Badge key={r.id} variant="outline" className="text-xs">
                      {formatRoleName(r.name)}
                    </Badge>
                  ))}
                </div>
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

        {/* Right Column - Supervising & Examining */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Supervising */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Mahasiswa Bimbingan Aktif ({data.supervising.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.supervising.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {data.supervising.map((item) => (
                    <div key={item.thesisId} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm truncate">
                            {item.title || <span className="italic text-muted-foreground">Judul belum ditentukan</span>}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {toTitleCaseName(item.student.fullName)} ({item.student.nim})
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {formatRoleName(item.role)}
                          </Badge>
                          <Badge 
                            className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100"
                          >
                            {item.status || 'Berjalan'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  size="sm" 
                  title="Tidak Ada Bimbingan" 
                  description="Tidak ada mahasiswa bimbingan aktif" 
                />
              )}
            </CardContent>
          </Card>

          {/* Examining */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4" />
                Penguji Skripsi ({data.examining.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.examining.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {data.examining.map((item) => (
                    <div key={item.thesisId} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm truncate">
                            {item.title || <span className="italic text-muted-foreground">Judul belum ditentukan</span>}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {toTitleCaseName(item.student.fullName)} ({item.student.nim})
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {formatRoleName(item.role)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  size="sm" 
                  title="Tidak Ada Penguji" 
                  description="Tidak menjadi penguji skripsi manapun" 
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Guidances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Bimbingan Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentGuidances.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {data.recentGuidances.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {toTitleCaseName(g.studentName)} ({g.studentNim})
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {g.thesisTitle || 'Judul belum ditentukan'}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 ml-3">
                        {formatDateId(g.approvedDate)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  size="sm" 
                  title="Belum Ada Riwayat" 
                  description="Belum ada riwayat bimbingan" 
                />
              )}
            </CardContent>
          </Card>

          {/* Completed Supervising */}
          {data.completedSupervising.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Bimbingan Selesai ({data.completedSupervising.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {data.completedSupervising.map((item) => (
                    <div key={item.thesisId} className="p-3 border rounded-lg bg-green-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm truncate">{item.title || 'Judul tidak tersedia'}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {toTitleCaseName(item.student.fullName)} ({item.student.nim})
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 text-xs shrink-0">
                          Selesai
                        </Badge>
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
