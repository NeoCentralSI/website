import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, User, Calendar, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshButton } from '@/components/ui/refresh-button';
import {
  getSeminarResultsAPI,
  getSeminarResultStudentOptionsAPI,
  getSeminarResultAudienceLinksAPI,
  assignSeminarResultAudiencesAPI,
  removeSeminarResultAudienceLinkAPI,
  getSeminarResultDetailAPI,
} from '@/services/admin.service';
import type { SeminarResultAudienceLink, SeminarResultStudentOption, SeminarResult } from '@/services/admin.service';
import { SeminarStatusBadge } from '@/components/seminar/SeminarStatusBadge';

import { ThesisSeminarAudienceTable } from '@/components/thesis-seminar/admin/ThesisSeminarAudienceTable';
import { ThesisSeminarAudienceAssignDialog } from '@/components/thesis-seminar/admin/ThesisSeminarAudienceAssignDialog';

type AudienceLinksResponse = Awaited<ReturnType<typeof getSeminarResultAudienceLinksAPI>>;
type AssignAudienceResponse = Awaited<ReturnType<typeof assignSeminarResultAudiencesAPI>>;

export default function ThesisSeminarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  useEffect(() => setPage(1), [search]);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [deleteLink, setDeleteLink] = useState<{ seminarId: string; studentId: string } | null>(null);

  // Queries
  const { data: seminarDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['seminar-result-detail', id],
    queryFn: () => getSeminarResultDetailAPI(id!).then(res => res.data),
    enabled: !!id,
  });

  const { data: audienceData, isLoading, isFetching, refetch: refetchAudiences } = useQuery({
    queryKey: ['seminar-result-audience-links', { page, pageSize, search }],
    queryFn: () => getSeminarResultAudienceLinksAPI({ page, pageSize, search }),
    placeholderData: (previousData: AudienceLinksResponse | undefined) => previousData,
  });

  const { data: studentOptionsData } = useQuery({
    queryKey: ['seminar-result-student-options'],
    queryFn: getSeminarResultStudentOptionsAPI,
  });

  const { data: seminarSelectData } = useQuery({
    queryKey: ['seminar-results-select-options'],
    queryFn: () => getSeminarResultsAPI({ page: 1, pageSize: 500, search: '' }),
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Tugas Akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
      { label: 'Arsip', href: '/tugas-akhir/seminar-hasil/arsip' },
      { label: 'Detail' },
    ]);
    setTitle('Detail Arsip Seminar Hasil');
  }, [setBreadcrumbs, setTitle]);

  useEffect(() => {
    if (seminarDetail) {
      setBreadcrumbs([
        { label: 'Tugas Akhir' },
        { label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
        { label: 'Arsip', href: '/tugas-akhir/seminar-hasil/arsip' },
        { label: `${seminarDetail.student.fullName}` },
      ]);
    }
  }, [seminarDetail, setBreadcrumbs]);

  // Mutations
  const assignMut = useMutation({
    mutationFn: (payload: { studentId: string; seminarIds: string[] }) =>
      assignSeminarResultAudiencesAPI(payload),
    onSuccess: (res: AssignAudienceResponse) => {
      const detail = res.data;
      const summaries = [
        `Berhasil ditautkan: ${detail.created}`,
        `Skip duplikat: ${detail.skippedDuplicate}`,
        `Skip seminar milik sendiri: ${detail.skippedOwnSeminarIds.length}`,
      ];
      toast.success(summaries.join(' | '));
      setIsAssignOpen(false);
      queryClient.invalidateQueries({ queryKey: ['seminar-result-audience-links'] });
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal mengaitkan audience seminar');
    },
  });

  const removeMut = useMutation({
    mutationFn: ({ seminarId, studentId }: { seminarId: string; studentId: string }) =>
      removeSeminarResultAudienceLinkAPI(seminarId, studentId),
    onSuccess: () => {
      toast.success('Relasi audience seminar berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['seminar-result-audience-links'] });
      setDeleteLink(null);
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal menghapus relasi audience');
    },
  });

  // Derived data
  const audienceRows: SeminarResultAudienceLink[] = audienceData?.links || [];
  const audienceTotal = audienceData?.meta?.total || 0;
  const studentOptions: SeminarResultStudentOption[] = studentOptionsData?.data || [];
  const seminarOptions: SeminarResult[] = seminarSelectData?.seminars || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link to="/tugas-akhir/seminar-hasil/arsip">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detail Arsip Seminar</h1>
            <p className="text-muted-foreground truncate max-w-[600px]" title={seminarDetail?.thesisTitle}>
              {seminarDetail?.thesisTitle || 'Memuat data thesis...'}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Info Cards */}
      {seminarDetail && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-slate-100">
                  <User className="h-5 w-5 text-slate-950" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mahasiswa</p>
                  <p className="text-xl font-bold truncate">{seminarDetail.student.fullName}</p>
                  <p className="text-xs text-muted-foreground">{seminarDetail.student.nim}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-slate-100">
                  <Calendar className="h-5 w-5 text-slate-950" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Waktu & Tempat</p>
                  <p className="text-xl font-bold">
                    {seminarDetail.date ? format(new Date(seminarDetail.date), 'd MMM yyyy', { locale: idLocale }) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {seminarDetail.room?.name || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-slate-100">
                  <Users className="h-5 w-5 text-slate-950" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status & Audience</p>
                  <div className="flex items-center gap-2 mt-1">
                    <SeminarStatusBadge status={seminarDetail.status as any} />
                    <Badge variant="outline" className="h-6">
                      {seminarDetail.audienceCount} Audience
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <ThesisSeminarAudienceTable
          data={audienceRows}
          loading={isLoading}
          isRefreshing={isFetching && !isLoading}
          page={page}
          pageSize={pageSize}
          total={audienceTotal}
          searchValue={search}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSearchChange={setSearch}
          onDelete={setDeleteLink}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAssignOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Kaitkan Audience
              </Button>
              <RefreshButton
                onClick={() => {
                  refetchDetail();
                  refetchAudiences();
                }}
                isRefreshing={isFetching && !isLoading}
              />
            </div>
          }
        />

        <ThesisSeminarAudienceAssignDialog
          open={isAssignOpen}
          onOpenChange={setIsAssignOpen}
          studentOptions={studentOptions}
          seminarOptions={seminarOptions}
          isPending={assignMut.isPending}
          onSubmit={(payload) => assignMut.mutate(payload)}
        />

        <AlertDialog open={Boolean(deleteLink)} onOpenChange={(open) => !open && setDeleteLink(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Relasi Audience</AlertDialogTitle>
              <AlertDialogDescription>
                Relasi mahasiswa dengan seminar hasil akan dihapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removeMut.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={removeMut.isPending || !deleteLink}
                onClick={() => deleteLink && removeMut.mutate(deleteLink)}
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
