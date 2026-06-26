import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useActiveAcademicYear } from '@/hooks/shared/useActiveAcademicYear';
import {
  metopenTitleService,
  type PendingTitleReportRow,
} from '@/services/metopenTitle.service';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RefreshButton } from '@/components/ui/refresh-button';
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
import { Check } from 'lucide-react';
import { formatDateId } from '@/lib/text';

function semesterLabel(semester: string | undefined) {
  if (semester === 'ganjil') return 'Ganjil';
  if (semester === 'genap') return 'Genap';
  return semester ?? '-';
}

export function TitleApprovalQueuePanel() {
  const queryClient = useQueryClient();
  const { academicYear: activeYear, label: activeYearLabel } = useActiveAcademicYear();
  const [filterActiveYearOnly, setFilterActiveYearOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const academicYearParam = filterActiveYearOnly ? activeYear?.id : undefined;

  const listQuery = useQuery({
    queryKey: ['kadep', 'title-reports', 'pending', academicYearParam ?? 'all'],
    queryFn: () => metopenTitleService.getPendingTitleReports(academicYearParam),
    enabled: !filterActiveYearOnly || !!activeYear?.id,
  });

  const rows = useMemo(() => listQuery.data?.data ?? [], [listQuery.data?.data]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const [acceptRow, setAcceptRow] = useState<PendingTitleReportRow | null>(null);

  const reviewMutation = useMutation({
    mutationFn: (args: { thesisId: string; action: 'accept'; notes?: string | null }) =>
      metopenTitleService.reviewTitleReport(args.thesisId, {
        action: args.action,
        notes: args.notes,
      }),
    onSuccess: () => {
      toast.success('Judul disahkan.');
      void queryClient.invalidateQueries({ queryKey: ['kadep', 'title-reports'] });
      setAcceptRow(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal memproses');
    },
  });

  const columns: Column<PendingTitleReportRow>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      render: (r) => (
        <div>
          <div className="font-medium">{r.studentName}</div>
          <div className="text-xs text-muted-foreground">{r.studentNim}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Judul',
      render: (r) => <span className="text-sm line-clamp-2">{r.title || '—'}</span>,
    },
    {
      key: 'supervisors',
      header: 'Dosen',
      render: (r) => <span className="text-sm text-muted-foreground">{r.supervisors}</span>,
    },
    {
      key: 'year',
      header: 'Tahun akademik',
      render: (r) => {
        const ay = r.academicYear;
        if (!ay) return '—';
        return (
          <span className="text-sm">
            {semesterLabel(ay.semester)} {ay.year ?? ''}
          </span>
        );
      },
    },
    {
      key: 'submittedAt',
      header: 'Diperbarui',
      render: (r) => <span className="text-sm">{formatDateId(r.submittedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={reviewMutation.isPending}
            onClick={() => setAcceptRow(r)}
          >
            <Check className="h-3.5 w-3.5" />
            Sahkan
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Antrean pengesahan judul</h2>
          <p className="text-sm text-muted-foreground">
            Thesis dengan proposal final yang sudah siap dinilai dan disahkan. Proposal final tidak ditolak pada tahap
            ini; koreksi substansi dilakukan lewat logbook atau update progres sebelum final.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-active-year"
              checked={filterActiveYearOnly}
              onCheckedChange={(v) => {
                setFilterActiveYearOnly(v === true);
                setPage(1);
              }}
              disabled={!activeYear?.id}
            />
            <Label htmlFor="filter-active-year" className="text-sm font-normal cursor-pointer">
              Hanya tahun aktif{activeYearLabel ? ` (${activeYearLabel})` : ''}
            </Label>
          </div>
          <RefreshButton
            onClick={() => void listQuery.refetch()}
            isRefreshing={listQuery.isFetching}
          />
        </div>
      </div>

      {filterActiveYearOnly && !activeYear?.id ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Tahun akademik aktif belum tersedia. Nonaktifkan filter atau set tahun aktif di administrasi.
        </div>
      ) : (
        <CustomTable
          columns={columns}
          data={pagedRows}
          loading={listQuery.isLoading}
          isRefreshing={listQuery.isFetching && !listQuery.isLoading}
          total={rows.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          emptyText="Tidak ada pengajuan judul yang menunggu pengesahan."
          rowKey={(r) => r.thesisId}
        />
      )}

      <AlertDialog open={!!acceptRow} onOpenChange={(open) => !open && setAcceptRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sahkan judul tugas akhir?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Mahasiswa: <strong>{acceptRow?.studentName}</strong>
              </span>
              <span className="block text-foreground">{acceptRow?.title || '—'}</span>
              <span className="block text-xs">
                Surat persetujuan judul akan dibuat di latar belakang setelah persetujuan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reviewMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={reviewMutation.isPending}
              onClick={() => {
                if (!acceptRow) return;
                reviewMutation.mutate({ thesisId: acceptRow.thesisId, action: 'accept' });
              }}
            >
              {reviewMutation.isPending ? 'Memproses…' : 'Ya, sahkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
