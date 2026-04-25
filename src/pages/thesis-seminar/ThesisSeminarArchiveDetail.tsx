import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, User, Calendar, MapPin, Users, Download, FileDown, Upload } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshButton } from '@/components/ui/refresh-button';
import {
  getSeminarResultDetailAPI,
  getSeminarAudiencesAPI,
  getStudentOptionsForAudienceAPI,
  addSeminarAudienceAPI,
  removeSeminarAudienceAPI,
  importSeminarAudiencesAPI,
  exportSeminarAudiencesAPI,
  exportSeminarAudiencesPdfAPI,
  exportSeminarAudienceTemplateAPI,
} from '@/services/thesis-seminar/admin.service';
import type { SeminarAudience, SeminarAudienceStudentOption, SeminarAudienceImportResult } from '@/services/thesis-seminar/admin.service';
import { SeminarStatusBadge } from '@/components/seminar/SeminarStatusBadge';

import { ThesisSeminarAudienceTable } from '@/components/thesis-seminar/admin/ThesisSeminarAudienceTable';
import { ThesisSeminarAudienceDialog } from '@/components/thesis-seminar/admin/ThesisSeminarAudienceDialog';
import { ThesisSeminarAudienceImportDialog } from '@/components/thesis-seminar/admin/ThesisSeminarAudienceImportDialog';

export default function ThesisSeminarArchiveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Queries
  const { data: seminarDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['seminar-result-detail', id],
    queryFn: () => getSeminarResultDetailAPI(id!).then((res) => res.data),
    enabled: !!id,
  });

  const {
    data: audienceData,
    isLoading: isAudienceLoading,
    isFetching: isAudienceFetching,
    refetch: refetchAudiences,
  } = useQuery({
    queryKey: ['seminar-audiences', id],
    queryFn: () => getSeminarAudiencesAPI(id!),
    enabled: !!id,
  });

  const { data: studentOptionsData, refetch: refetchStudentOptions } = useQuery({
    queryKey: ['seminar-audience-student-options', id],
    queryFn: () => getStudentOptionsForAudienceAPI(id!),
    enabled: !!id && (seminarDetail?.isEditable ?? false),
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
        { label: seminarDetail.student.fullName },
      ]);
    }
  }, [seminarDetail, setBreadcrumbs]);

  // Mutations
  const addMut = useMutation({
    mutationFn: (studentId: string) => addSeminarAudienceAPI(id!, studentId),
    onSuccess: () => {
      toast.success('Audience berhasil ditambahkan');
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ['seminar-audiences', id] });
      queryClient.invalidateQueries({ queryKey: ['seminar-audience-student-options', id] });
      queryClient.invalidateQueries({ queryKey: ['seminar-result-detail', id] });
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal menambahkan audience');
    },
  });

  const removeMut = useMutation({
    mutationFn: (studentId: string) => removeSeminarAudienceAPI(id!, studentId),
    onSuccess: () => {
      toast.success('Audience berhasil dihapus');
      setDeleteStudentId(null);
      queryClient.invalidateQueries({ queryKey: ['seminar-audiences', id] });
      queryClient.invalidateQueries({ queryKey: ['seminar-audience-student-options', id] });
      queryClient.invalidateQueries({ queryKey: ['seminar-result-detail', id] });
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal menghapus audience');
    },
  });

  const exportMut = useMutation({
    mutationFn: () => exportSeminarAudiencesAPI(id!),
    onError: (error: unknown) => toast.error((error as Error).message || 'Gagal mengekspor data'),
  });

  const exportPdfMut = useMutation({
    mutationFn: () => exportSeminarAudiencesPdfAPI(id!),
    onError: (error: unknown) => toast.error((error as Error).message || 'Gagal mengekspor PDF'),
  });

  const exportTemplateMut = useMutation({
    mutationFn: () => exportSeminarAudienceTemplateAPI(id!),
    onError: (error: unknown) => toast.error((error as Error).message || 'Gagal mengunduh template'),
  });

  const handleImport = async (file: File): Promise<SeminarAudienceImportResult> => {
    const result = await importSeminarAudiencesAPI(id!, file);
    if (result.successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['seminar-audiences', id] });
      queryClient.invalidateQueries({ queryKey: ['seminar-audience-student-options', id] });
      queryClient.invalidateQueries({ queryKey: ['seminar-result-detail', id] });
    }
    toast.success(`Import selesai: ${result.successCount} sukses, ${result.failed} gagal`);
    return result;
  };

  // Derived data
  const isEditable = seminarDetail?.isEditable ?? false;
  const rawAudienceRows: SeminarAudience[] = audienceData?.data || [];
  const studentOptions: SeminarAudienceStudentOption[] = studentOptionsData?.data || [];

  const audienceRows = search
    ? rawAudienceRows.filter((r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.nim.toLowerCase().includes(search.toLowerCase())
    )
    : rawAudienceRows;

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
                  <p className="text-sm text-muted-foreground">Waktu &amp; Tempat</p>
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
                  <p className="text-sm text-muted-foreground">Status &amp; Audience</p>
                  <div className="flex items-center gap-2 mt-1">
                    <SeminarStatusBadge status={seminarDetail.status as any} />
                    <Badge variant="outline" className="h-6">
                      {seminarDetail.audienceCount} Audience
                    </Badge>
                  </div>
                  {!isEditable && (
                    <p className="text-xs text-amber-600 mt-1">Tidak bisa mengelola audience karena seminar hasil ini bukan data dari pengarsipan manual</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audience Table */}
      <div className="space-y-4">
        <ThesisSeminarAudienceTable
          data={audienceRows}
          loading={isAudienceLoading}
          isRefreshing={isAudienceFetching && !isAudienceLoading}
          isEditable={isEditable}
          onDelete={setDeleteStudentId}
          searchValue={search}
          onSearchChange={setSearch}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {isEditable && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" /> Import
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={exportMut.isPending || exportPdfMut.isPending}>
                    <Download className="w-4 h-4 mr-2" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportMut.mutate()}>
                    <FileDown className="w-4 h-4 mr-2" /> Export Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportPdfMut.mutate()}>
                    <FileDown className="w-4 h-4 mr-2" /> Export PDF/Presentasi (.html)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {isEditable && (
                <>
                  <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Data
                  </Button>
                </>
              )}
              <RefreshButton
                onClick={() => {
                  refetchDetail();
                  refetchAudiences();
                  refetchStudentOptions();
                }}
                isRefreshing={isAudienceFetching && !isAudienceLoading}
              />
            </div>
          }
        />

        {/* Dialogs */}
        <ThesisSeminarAudienceDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          studentOptions={studentOptions}
          isPending={addMut.isPending}
          onSubmit={(studentId) => addMut.mutate(studentId)}
        />

        <ThesisSeminarAudienceImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImport={handleImport}
          onDownloadTemplate={() => exportTemplateMut.mutate()}
          isImporting={false}
        />

        <AlertDialog open={Boolean(deleteStudentId)} onOpenChange={(open) => !open && setDeleteStudentId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Audience Seminar</AlertDialogTitle>
              <AlertDialogDescription>
                Mahasiswa ini akan dihapus dari daftar audience seminar. Lanjutkan?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removeMut.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={removeMut.isPending || !deleteStudentId}
                onClick={() => deleteStudentId && removeMut.mutate(deleteStudentId)}
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
