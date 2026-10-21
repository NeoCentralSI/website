import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Loading } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Button } from '@/components/ui/button';
import { Eye, FileDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { generateAttendanceLogPdf } from '@/services/thesis-seminar/student.service';
import { cn } from '@/lib/utils';
import type { AttendanceHistoryResponse, AttendanceRecord } from '@/types/seminar.types';
import {
  ThesisStudentInfoCell,
} from '@/components/shared/ThesisTableCells';
import { ThesisSeminarDateCell } from '@/components/thesis-seminar/atoms/ThesisSeminarScheduleCell';
import { ThesisSeminarLecturerCell } from '@/components/thesis-seminar/atoms/ThesisSeminarPersonnelCells';

interface StudentThesisSeminarAttendanceHistoryPanelProps {
  attendance?: AttendanceHistoryResponse;
  isLoading: boolean;
  isFetching: boolean;
}

function extractTimeUTC(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function getSeminarEndDateTime(row: AttendanceRecord): Date | null {
  if (!row.date) return null;

  const date = new Date(row.date);
  if (Number.isNaN(date.getTime())) return null;

  const end = new Date(date);
  const endTime = extractTimeUTC(row.seminarEndTime);

  if (!endTime) {
    end.setHours(23, 59, 59, 999);
    return end;
  }

  const [hours, minutes] = endTime.split(':').map(Number);
  end.setHours(hours, minutes, 0, 0);
  return end;
}

export function StudentThesisSeminarAttendanceHistoryPanel({
  attendance,
  isLoading,
  isFetching,
}: StudentThesisSeminarAttendanceHistoryPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const selectedRecords = (attendance?.records ?? []).filter((row) => row.isPresent && selectedIds.has(row.seminarId));

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase();
    const safeRecords = attendance?.records ?? [];
    return safeRecords.filter(
      (r) =>
        r.presenterName.toLowerCase().includes(q) ||
        r.thesisTitle.toLowerCase().includes(q)
    );
  }, [attendance?.records, search]);

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const selectablePage = pagedRecords.filter((row) => row.isPresent);
  const allSelected = selectablePage.length > 0 && selectablePage.every((row) => selectedIds.has(row.seminarId));
  const someSelected = selectablePage.some((row) => selectedIds.has(row.seminarId));
  const toggleSelection = (ids: string[], checked: boolean) => setSelectedIds((previous) => {
    const next = new Set(previous);
    ids.forEach((id) => checked ? next.add(id) : next.delete(id));
    return next;
  });
  const handleExport = async () => {
    if (!selectedRecords.length || isExporting) return;
    setIsExporting(true);
    try {
      const blob = await generateAttendanceLogPdf(selectedRecords.map((row) => row.seminarId));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Daftar_Kehadiran_Seminar_Hasil.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat PDF daftar kehadiran');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle data refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['student-seminar', 'attendance'] });
  };

  const getAttendanceStatus = (row: AttendanceRecord) => {
    // If approved, strictly "Hadir"
    if (row.isPresent) {
      return { variant: 'success' as const, text: 'Hadir' };
    }

    const now = new Date();
    const seminarDeadline = getSeminarEndDateTime(row);
    const isFinalized =
      ['passed', 'passed_with_revision', 'failed'].includes(row.seminarStatus || '') ||
      Boolean(row.seminarResultFinalizedAt);

    if (isFinalized && (!seminarDeadline || now >= seminarDeadline)) {
      return { variant: 'destructive' as const, text: 'Tidak Hadir' };
    }

    return { variant: 'warning' as const, text: 'Menunggu Verifikasi' };
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-320px)] items-center justify-center">
        <Loading size="lg" text="Memuat riwayat kehadiran..." />
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Data riwayat kehadiran belum tersedia.
      </div>
    );
  }

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'select',
      width: 40,
      header: <Checkbox aria-label="Pilih semua kehadiran pada halaman ini" disabled={!selectablePage.length || isExporting}
        checked={allSelected || (someSelected ? 'indeterminate' : false)}
        onCheckedChange={(checked) => toggleSelection(selectablePage.map((row) => row.seminarId), checked === true)} />,
      render: (row) => <Checkbox aria-label={`Pilih kehadiran seminar ${row.presenterName}`}
        disabled={!row.isPresent || isExporting} checked={row.isPresent && selectedIds.has(row.seminarId)}
        title={!row.isPresent ? 'Kehadiran belum diverifikasi hadir' : undefined}
        onCheckedChange={(checked) => toggleSelection([row.seminarId], checked === true)} />,
    },
    {
      key: 'presenter',
      header: 'Presenter',
      width: 160,
      render: (row) => (
        <ThesisStudentInfoCell
          name={row.presenterName}
          nim={row.presenterNim || '-'}
        />
      ),
    },
    {
      key: 'thesis',
      header: 'Judul TA',
      render: (row) => <div title={row.thesisTitle} className="line-clamp-2 whitespace-normal break-words text-sm font-medium">{row.thesisTitle}</div>,
    },
    {
      key: 'date',
      header: 'Tanggal',
      width: 110,
      render: (row) => <ThesisSeminarDateCell date={row.date} />,
    },
    {
      key: 'status',
      header: 'Status Kehadiran',
      width: 150,
      render: (row) => {
        const status = getAttendanceStatus(row);
        return (
          <Badge
            variant={status.variant}
            className={cn(
              "font-medium",
              status.variant === 'success' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200",
              status.variant === 'warning' && "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200",
              status.variant === 'destructive' && "bg-rose-100 text-rose-700 hover:bg-rose-100/80 border-rose-200"
            )}
          >
            {status.text}
          </Badge>
        );
      },
    },
    {
      key: 'verifiedBy',
      header: 'Diverifikasi Oleh',
      width: 160,
      render: (row) => (
        <ThesisSeminarLecturerCell
          name={row.approvedBy || '-'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 64,
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(`/tugas-akhir/seminar-hasil/${row.seminarId}`)}
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CustomTable
        tableClassName="table-fixed"
        data={pagedRecords}
        rowKey={(row) => row.seminarId}
        columns={columns}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        emptyText="Belum ada riwayat kehadiran seminar hasil"
        page={page}
        pageSize={pageSize}
        total={filteredRecords.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        actions={
          <div className="flex items-center justify-end gap-2">
            <Badge variant="secondary">{selectedRecords.length} Dipilih</Badge>
            <Button onClick={handleExport} disabled={!selectedRecords.length || isExporting}>
              <FileDown className="h-4 w-4" />
              {isExporting ? 'Membuat PDF...' : 'Cetak Daftar Kehadiran'}
            </Button>
            <RefreshButton
              onClick={handleRefresh}
              isRefreshing={isFetching && !isLoading}
              className="shrink-0"
            />
          </div>
        }
      />
    </div>
  );
}
