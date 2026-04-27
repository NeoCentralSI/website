import { useEffect, useState } from 'react';
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
  useAddAdminThesisSeminarAudience,
  useAdminThesisSeminarAudienceStudentOptions,
  useAdminThesisSeminarAudiences,
  useDownloadAdminThesisSeminarAudienceTemplate,
  useExportAdminThesisSeminarAudiences,
  useImportAdminThesisSeminarAudiences,
  useRemoveAdminThesisSeminarAudience,
  useAdminThesisSeminarDetail,
} from '@/hooks/thesis-seminar/useAdminThesisSeminar';
import type { AdminThesisSeminarAudience, AdminThesisSeminarAudienceStudentOption } from '@/services/thesis-seminar/core.service';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';

import { AdminThesisSeminarAudienceTable } from '@/components/thesis-seminar/AdminThesisSeminarAudienceTable';
import { AdminThesisSeminarAudienceDialog } from '@/components/thesis-seminar/AdminThesisSeminarAudienceDialog';
import { AdminThesisSeminarAudienceImportDialog } from '@/components/thesis-seminar/AdminThesisSeminarAudienceImportDialog';

export default function AdminThesisSeminarArchiveDetail() {
  const { seminarId } = useParams<{ seminarId: string }>();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Queries
  const { data: seminarDetail, isLoading: isDetailLoading, refetch: refetchDetail } = useAdminThesisSeminarDetail(seminarId);
  const {
    data: audienceData,
    isLoading: isAudienceLoading,
    isFetching: isAudienceFetching,
    refetch: refetchAudiences,
  } = useAdminThesisSeminarAudiences(seminarId);
  const { data: studentOptionsData, refetch: refetchStudentOptions } = useAdminThesisSeminarAudienceStudentOptions(seminarId, seminarDetail?.isEditable ?? false);

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
  const addMut = useAddAdminThesisSeminarAudience();
  const removeMut = useRemoveAdminThesisSeminarAudience();
  const exportMut = useExportAdminThesisSeminarAudiences();
  const exportPdfMut = useExportAdminThesisSeminarAudiences();
  const exportTemplateMut = useDownloadAdminThesisSeminarAudienceTemplate();
  const importMut = useImportAdminThesisSeminarAudiences();

  const handleImport = async (file: File) => {
    const result = await importMut.mutateAsync({ seminarId: seminarId!, file });
    toast.success(`Import selesai: ${result.successCount} sukses, ${result.failed} gagal`);
    return result;
  };

  // Derived data
  const isEditable = seminarDetail?.isEditable ?? false;
  const rawAudienceRows: AdminThesisSeminarAudience[] = audienceData || [];
  const studentOptions: AdminThesisSeminarAudienceStudentOption[] = studentOptionsData || [];

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
                    <ThesisEventStatusBadge status={seminarDetail.status as any} />
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
        <AdminThesisSeminarAudienceTable
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
        <AdminThesisSeminarAudienceDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          studentOptions={studentOptions}
          isPending={addMut.isPending}
          onSubmit={(studentId) => addMut.mutate(studentId)}
        />

        <AdminThesisSeminarAudienceImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImport={handleImport}
          onDownloadTemplate={() => exportTemplateMut.mutate()}
          isImporting={importMut.isPending}
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
