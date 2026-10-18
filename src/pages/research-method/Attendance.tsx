import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Loader2, Paperclip, Upload } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { formatAttendance } from '@/components/research-method/AssessmentCells';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { PageHeading } from '@/components/shared/PageHeading';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshButton } from '@/components/ui/refresh-button';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useActiveAcademicYear } from '@/hooks/shared/useActiveAcademicYear';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { useRole } from '@/hooks/shared/useRole';
import { useAttendance, useAttendanceUpload } from '@/hooks/research-method/useResearchMethod';
import { downloadAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { DateTimeCell, TruncatedText } from '@/lib/guidanceCells';
import { BADGE_COLUMN_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import { formatDateTimeWib, formatLecturerName, toTitleCaseName } from '@/lib/text';
import type { AttendanceImport, AttendancePreview, AttendanceRow } from '@/types/research-method.types';

const MAX_FILES = 2;

/** Why the chosen files cannot be read yet, or null. */
export function getFilesProblem(files: File[]): string | null {
  if (files.length === 0) return 'Pilih 1–2 berkas presensi (.xlsx atau .xls).';
  if (files.length > MAX_FILES) return `Maksimal ${MAX_FILES} berkas kelas per unggahan.`;
  if (files.some((f) => !/\.(xlsx|xls)$/i.test(f.name))) return 'Berkas presensi harus berupa .xlsx atau .xls.';
  return null;
}

/** Presensi rows: below 75% first (they decide a zero), then unknown NIMs, then the rest. */
type RecordStatus = 'below' | 'unknown' | 'eligible';
const RECORD_STATUS_ORDER: RecordStatus[] = ['below', 'unknown', 'eligible'];
const RECORD_STATUS_LABELS: Record<RecordStatus, string> = { below: 'Di Bawah 75%', unknown: 'Tidak Dikenal', eligible: 'Memenuhi' };
const RECORD_STATUS_VARIANTS = { below: 'destructive', unknown: 'outline', eligible: 'success' } as const;
const recordStatus = (row: AttendanceRow): RecordStatus => (row.matched === false ? 'unknown' : row.isEligible ? 'eligible' : 'below');

const TABS = [
  { value: 'berlaku', label: 'Presensi Berlaku' },
  { value: 'riwayat', label: 'Riwayat Unggahan' },
];

/**
 * Metode Penelitian > Presensi (rencana 10.5; Paket P8): ekspor aplikasi presensi diunggah
 * koordinator, dipratinjau lebih dulu, lalu diterapkan. Presensi di bawah 75% membuat nilai
 * proposal otomatis 0 (setelah proposal final ada); unggahan koreksi yang memenuhi membuka
 * kembali nilai itu selama TA masih fase proposal. Paket P9 (9): the period select beside the
 * title, Pilih Berkas as a Button, and two panels with one table each.
 */
export default function Attendance() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isResearchMethodCoordinator } = useRole();
  const { academicYear } = useActiveAcademicYear();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const yearId = academicYearId ?? academicYear?.id ?? null;
  const attendance = useAttendance(yearId);
  const data = attendance.data;
  const { preview, upload } = useAttendanceUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewResult, setPreviewResult] = useState<AttendancePreview | null>(null);
  const [status, setStatus] = useState<RecordStatus | ''>('');
  const [tab, setTab] = useState('berlaku');
  const canUpload = isResearchMethodCoordinator();
  const filesProblem = getFilesProblem(files);
  const uploadReason = !canUpload ? 'Hanya Koordinator Metode Penelitian yang mengunggah presensi.' : filesProblem ?? (!previewResult ? 'Pratinjau berkas terlebih dahulu.' : null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Metode Penelitian' }, { label: 'Presensi' }]);
    setTitle('Presensi');
  }, [setBreadcrumbs, setTitle]);

  const reset = () => {
    setFiles([]);
    setPreviewResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const records = useMemo(() => {
    const rank = (row: AttendanceRow) => RECORD_STATUS_ORDER.indexOf(recordStatus(row));
    const sorted = [...(data?.current?.records ?? [])].sort((a, b) => rank(a) - rank(b) || a.identityNumber.localeCompare(b.identityNumber));
    return status ? sorted.filter((row) => recordStatus(row) === status) : sorted;
  }, [data, status]);
  const recordTable = useLocalTable(records, (row, term) => haystack(row.identityNumber, row.studentName).includes(term));
  const historyTable = useLocalTable(data?.history ?? [], (row, term) => haystack(row.classCode, row.uploadedBy?.fullName).includes(term), 5);

  const recordColumns: Column<AttendanceRow>[] = [
    { key: 'nim', header: 'NIM', width: 140, className: CLIP_CELL, render: (row) => <span className="whitespace-nowrap">{row.identityNumber}</span> },
    { key: 'name', header: 'Nama', className: CLIP_CELL, render: (row) => <TruncatedText text={toTitleCaseName(row.studentName) || '-'} className="max-w-full" /> },
    { key: 'present', header: 'Hadir', width: 110, className: CLIP_CELL, render: (row) => <span className="whitespace-nowrap">{row.presentCount ?? '-'} / {row.totalMeetings ?? '-'}</span> },
    { key: 'percent', header: 'Kehadiran', width: 120, className: CLIP_CELL, render: (row) => formatAttendance(row.attendancePercentage) },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.attendanceStatus,
      className: CLIP_CELL,
      render: (row) => {
        const value = recordStatus(row);
        return <Badge variant={RECORD_STATUS_VARIANTS[value]} className="whitespace-nowrap">{RECORD_STATUS_LABELS[value]}</Badge>;
      },
      filter: {
        type: 'select',
        value: status,
        onChange: (value) => { setStatus(value as RecordStatus | ''); recordTable.resetPage(); },
        options: [{ label: 'Semua', value: '' }, ...RECORD_STATUS_ORDER.map((value) => ({ label: RECORD_STATUS_LABELS[value], value }))],
      },
    },
  ];

  const historyColumns: Column<AttendanceImport>[] = [
    { key: 'uploadedAt', header: 'Diunggah', width: DATE_COLUMN_WIDTH, className: CLIP_CELL, render: (row) => <DateTimeCell date={row.uploadedAt} /> },
    { key: 'by', header: 'Oleh', className: CLIP_CELL, render: (row) => <TruncatedText text={formatLecturerName(row.uploadedBy?.fullName) || '-'} className="max-w-full" /> },
    { key: 'class', header: 'Kelas', width: 120, className: CLIP_CELL, render: (row) => row.classCode ?? '-' },
    { key: 'rows', header: 'Baris', width: 150, className: CLIP_CELL, render: (row) => <span className="whitespace-nowrap">{row.totals.totalRows} baris · {row.totals.eligibleRows} memenuhi</span> },
    {
      key: 'files',
      header: 'Berkas',
      width: 110,
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          {row.sourceFiles.map((file) => (
            <TableIconAction key={file.index} icon={Download} label={`Unduh ${file.originalName}`} onClick={() => downloadAuthenticatedFileOrToast(file.url, file.originalName)} />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Presensi" subtitle="Presensi kelas Metode Penelitian">
        <PeriodSelect value={yearId} onChange={(value) => { setAcademicYearId(value); reset(); }} />
      </PageHeading>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unggah Presensi Kelas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".xlsx,.xls"
            aria-label="Berkas presensi"
            className="hidden"
            disabled={!canUpload}
            onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setPreviewResult(null); }}
          />
          {files.length > 0 && filesProblem && <p className="text-xs text-destructive">{filesProblem}</p>}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {files.length > 0 && <span className="mr-auto min-w-0 truncate text-xs text-muted-foreground">{files.map((f) => f.name).join(', ')}</span>}
              <span title={!canUpload ? uploadReason ?? undefined : undefined} className="inline-flex">
                <Button variant="outline" size="sm" disabled={!canUpload} onClick={() => inputRef.current?.click()}>
                  <Paperclip className="mr-2 h-4 w-4" />Pilih Berkas
                </Button>
              </span>
              <span title={!canUpload ? uploadReason ?? undefined : filesProblem ?? undefined} className="inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canUpload || Boolean(filesProblem) || !yearId || preview.isPending}
                  onClick={() => yearId && preview.mutate({ academicYearId: yearId, files }, { onSuccess: (r) => setPreviewResult(r.data) })}
                >
                  {preview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Pratinjau
                </Button>
              </span>
              <span title={uploadReason ?? undefined} className="inline-flex">
                <Button
                  size="sm"
                  disabled={Boolean(uploadReason) || !yearId || upload.isPending}
                  onClick={() => yearId && upload.mutate({ academicYearId: yearId, files }, { onSuccess: reset })}
                >
                  {upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Unggah dan Terapkan
                </Button>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {previewResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pratinjau {previewResult.sourceFiles.map((f) => f.originalName).join(' + ')}</CardTitle>
            <CardDescription>Belum disimpan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {previewResult.totals.totalRows} baris · {previewResult.totals.matchedRows} cocok dengan mahasiswa · {previewResult.totals.eligibleRows} memenuhi 75%
              {' · '}{previewResult.totals.willAutoZeroCount ?? 0} akan bernilai 0 · {previewResult.totals.willSkipFinalizedCount ?? 0} sudah final (dilewati)
            </p>
            {previewResult.willAutoZero.length > 0 && (
              <p className="text-destructive">
                Nilai otomatis 0: {previewResult.willAutoZero.map((r) => `${r.studentName ?? r.identityNumber} (${formatAttendance(r.attendancePercentage)})`).join(', ')}
              </p>
            )}
            {previewResult.unmatchedRows.length > 0 && (
              <p className="text-muted-foreground">Tidak dikenal: {previewResult.unmatchedRows.map((r) => r.identityNumber).join(', ')}</p>
            )}
          </CardContent>
        </Card>
      )}

      <LocalTabsNav tabs={TABS} activeTab={tab} onTabChange={setTab} />
      {tab === 'berlaku' ? (
        attendance.error ? (
          <p className="text-sm text-destructive">{attendance.error instanceof Error ? attendance.error.message : 'Gagal memuat presensi.'}</p>
        ) : (
          <CustomTable
            columns={recordColumns}
            {...recordTable.tableProps}
            loading={attendance.isLoading}
            isRefreshing={attendance.isFetching && !attendance.isLoading}
            subtleRefresh
            enableColumnFilters
            tableClassName="table-fixed"
            searchPlaceholder="Cari NIM atau nama..."
            emptyText={recordTable.search || status ? 'Tidak ditemukan' : 'Presensi periode ini belum diunggah.'}
            rowKey={(row) => row.id ?? row.identityNumber}
            actions={(
              <>
                {data?.current?.sourceFiles.map((file) => (
                  <Button
                    key={file.index}
                    variant="outline"
                    size="sm"
                    title={`Kelas ${data.current?.classCode ?? '-'} · diunggah ${formatDateTimeWib(data.current?.uploadedAt)}`}
                    onClick={() => downloadAuthenticatedFileOrToast(file.url, file.originalName)}
                  >
                    <Download className="mr-2 h-4 w-4" />{file.originalName}
                  </Button>
                ))}
                <RefreshButton onClick={() => void attendance.refetch()} isRefreshing={attendance.isFetching && !attendance.isLoading} />
              </>
            )}
          />
        )
      ) : (
        <CustomTable
          columns={historyColumns}
          {...historyTable.tableProps}
          loading={attendance.isLoading}
          tableClassName="table-fixed"
          emptyText={historyTable.search ? 'Tidak ditemukan' : 'Belum ada unggahan sebelumnya pada periode ini.'}
          rowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
