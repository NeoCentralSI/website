import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Loader2, Upload } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { formatAttendance } from '@/components/research-method/AssessmentCells';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useActiveAcademicYear } from '@/hooks/shared/useActiveAcademicYear';
import { useRole } from '@/hooks/shared/useRole';
import { useAttendance, useAttendanceUpload } from '@/hooks/research-method/useResearchMethod';
import { downloadAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import type { AttendancePreview } from '@/types/research-method.types';

const MAX_FILES = 2;

/** Why the chosen files cannot be read yet, or null. */
export function getFilesProblem(files: File[]): string | null {
  if (files.length === 0) return 'Pilih 1–2 berkas presensi (.xlsx atau .xls).';
  if (files.length > MAX_FILES) return `Maksimal ${MAX_FILES} berkas kelas per unggahan.`;
  if (files.some((f) => !/\.(xlsx|xls)$/i.test(f.name))) return 'Berkas presensi harus berupa .xlsx atau .xls.';
  return null;
}

/**
 * Metode Penelitian > Presensi (rencana 10.5): ekspor aplikasi presensi diunggah koordinator,
 * dipratinjau lebih dulu, lalu diterapkan. Presensi di bawah 75% membuat nilai proposal otomatis 0
 * (setelah proposal final ada); unggahan koreksi yang memenuhi membuka kembali nilai itu selama
 * TA masih fase proposal.
 */
export default function Attendance() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKoordinatorMetopen } = useRole();
  const { academicYear } = useActiveAcademicYear();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const yearId = academicYearId ?? academicYear?.id ?? null;
  const { data, isLoading, error } = useAttendance(yearId);
  const { preview, upload } = useAttendanceUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewResult, setPreviewResult] = useState<AttendancePreview | null>(null);
  const canUpload = isKoordinatorMetopen();
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

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Unggah Presensi Kelas</CardTitle>
            <CardDescription>
              Satu atau dua berkas kelas digabung per NIM. NIM yang muncul di dua berkas membatalkan unggahan. Ambang kehadiran 75%.
            </CardDescription>
          </div>
          <PeriodSelect value={yearId} onChange={(value) => { setAcademicYearId(value); reset(); }} />
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".xlsx,.xls"
            aria-label="Berkas presensi"
            disabled={!canUpload}
            onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setPreviewResult(null); }}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm disabled:opacity-60"
          />
          {files.length > 0 && filesProblem && <p className="text-xs text-destructive">{filesProblem}</p>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {uploadReason && <p className="mr-auto text-xs text-muted-foreground">{uploadReason}</p>}
            <span title={!canUpload ? uploadReason ?? undefined : filesProblem ?? undefined}>
              <Button
                variant="outline"
                size="sm"
                disabled={!canUpload || Boolean(filesProblem) || !yearId || preview.isPending}
                onClick={() => yearId && preview.mutate({ academicYearId: yearId, files }, { onSuccess: (r) => setPreviewResult(r.data) })}
              >
                {preview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Pratinjau
              </Button>
            </span>
            <span title={uploadReason ?? undefined}>
              <Button
                size="sm"
                disabled={Boolean(uploadReason) || !yearId || upload.isPending}
                onClick={() => yearId && upload.mutate({ academicYearId: yearId, files }, { onSuccess: reset })}
              >
                {upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Unggah dan Terapkan
              </Button>
            </span>
          </div>

          {previewResult && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Pratinjau {previewResult.sourceFiles.map((f) => f.originalName).join(' + ')}</p>
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
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presensi Berlaku {data?.academicYear.label}</CardTitle>
          <CardDescription>Unggahan terbaru yang dipakai penilaian proposal; unggahan sebelumnya disimpan sebagai riwayat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>
          ) : error ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat presensi.'}</p>
          ) : !data?.current ? (
            <EmptyState size="sm" title="Tidak Ada Data" description="Presensi periode ini belum diunggah." />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>Kelas {data.current.classCode ?? '-'}</span>
                <span>Diunggah {formatDateTimeWib(data.current.uploadedAt)}{data.current.uploadedBy?.fullName ? ` oleh ${formatLecturerName(data.current.uploadedBy.fullName)}` : ''}</span>
                {data.current.sourceFiles.map((file) => (
                  <Button key={file.index} variant="link" className="h-auto p-0" onClick={() => downloadAuthenticatedFileOrToast(file.url, file.originalName)}>
                    <Download className="mr-1 h-4 w-4" />{file.originalName}
                  </Button>
                ))}
              </div>
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">NIM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="w-28">Hadir</TableHead>
                    <TableHead className="w-28">Kehadiran</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.current.records ?? []).map((record) => (
                    <TableRow key={record.id ?? record.identityNumber}>
                      <TableCell>{record.identityNumber}</TableCell>
                      <TableCell className="whitespace-normal">
                        {record.studentName ?? '-'}
                        {!record.matched && <span className="ml-2 text-xs text-muted-foreground">(tidak dikenal)</span>}
                      </TableCell>
                      <TableCell>{record.presentCount} / {record.totalMeetings}</TableCell>
                      <TableCell>{formatAttendance(record.attendancePercentage)}</TableCell>
                      <TableCell>
                        {record.isEligible ? <Badge variant="success">Memenuhi</Badge> : <Badge variant="destructive">Di bawah 75%</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.history.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Riwayat: {data.history.map((h) => `${formatDateTimeWib(h.uploadedAt)} (${h.totals.totalRows} baris)`).join(' · ')}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
