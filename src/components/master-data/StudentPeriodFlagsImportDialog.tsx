import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActiveAcademicYear } from '@/hooks/shared/useActiveAcademicYear';
import { downloadAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { toTitleCaseName } from '@/lib/text';
import { applyPeriodFlagsImportAPI, PERIOD_FLAGS_TEMPLATE_URL, type PeriodFlagsImportPlan } from '@/services/admin.service';

/** Why the chosen file cannot be read yet, or null. */
export function getImportFileProblem(file: File | null): string | null {
  if (!file) return 'Pilih berkas .xlsx atau .csv terlebih dahulu.';
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return 'Berkas harus berupa .xlsx atau .csv.';
  return null;
}

/** The rows that were not written, one line each. */
export function importProblems(plan: PeriodFlagsImportPlan): string[] {
  return [
    ...plan.unknown.map((item) => `Baris ${item.row}: NIM ${item.nim} tidak dikenal.`),
    ...plan.invalid.map((item) => `Baris ${item.row}${item.nim ? ` (${item.nim})` : ''}: ${item.reason}`),
    ...(plan.nameMismatch ?? []).map((item) =>
      `Baris ${item.row}: nama "${item.name}" tidak cocok dengan NIM ${item.nim}${item.expected ? ` (${toTitleCaseName(item.expected)})` : ''}.`),
  ];
}

const SUMMARY: { key: keyof PeriodFlagsImportPlan['totals']; label: string; className: string }[] = [
  { key: 'changed', label: 'Berubah', className: 'text-green-600' },
  { key: 'unchanged', label: 'Sama', className: 'text-blue-600' },
  { key: 'unknownNim', label: 'NIM Tidak Dikenal', className: 'text-amber-600' },
  { key: 'invalid', label: 'Baris Tidak Valid', className: 'text-red-600' },
  { key: 'nameMismatch', label: 'Nama Tidak Cocok', className: 'text-red-600' },
];

/**
 * Data Master → Mahasiswa → Impor Keikutsertaan, in the form of the "Import Excel" modal of
 * Data TA: semester (default the active one), the template, the file, then "Mulai Import". The
 * file is imported at once and the modal shows what changed and what was skipped (unknown NIM,
 * invalid row, a name that does not match the NIM). The result is the Admin's (kept by the SIA
 * sync); importing the same file again changes nothing.
 */
export function StudentPeriodFlagsImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { academicYear } = useActiveAcademicYear();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PeriodFlagsImportPlan | null>(null);
  const [checked, setChecked] = useState(false);
  const yearId = academicYearId ?? academicYear?.id ?? null;

  const reset = () => {
    setFile(null);
    setResult(null);
    setChecked(false);
  };
  useEffect(() => { if (!open) { reset(); setAcademicYearId(null); } }, [open]);

  const apply = useMutation({
    mutationFn: () => applyPeriodFlagsImportAPI(yearId!, file!),
    onSuccess: (response) => {
      setResult(response.data);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-detail'] });
      toast.success(response.message ?? 'Keikutsertaan diimpor.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const fileProblem = getImportFileProblem(file);
  const yearProblem = yearId ? null : 'Pilih semester terlebih dahulu.';
  // The button is never disabled for a missing choice: the click says what is missing.
  const start = () => {
    setChecked(true);
    if (yearProblem || fileProblem) return;
    apply.mutate();
  };
  const problems = result ? importProblems(result) : [];

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!apply.isPending) onOpenChange(value); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Impor Keikutsertaan</DialogTitle>
          <DialogDescription>
            Metode Penelitian dan Tugas Akhir per mahasiswa untuk satu semester. Sel kosong tidak diubah.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!result ? (
            <>
              <div className="grid gap-2">
                <Label>Semester</Label>
                <PeriodSelect value={yearId} onChange={(id) => setAcademicYearId(id)} className="w-full" />
                {checked && yearProblem && <p role="alert" className="text-xs text-destructive">{yearProblem}</p>}
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Gunakan templat standar</p>
                    <p className="text-xs text-muted-foreground text-wrap">Kolom: NIM, Nama, Mengambil Metode Penelitian, Mengambil Tugas Akhir (Ya/Tidak)</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => void downloadAuthenticatedFileOrToast(PERIOD_FLAGS_TEMPLATE_URL, 'Templat-Keikutsertaan-Semester.xlsx')}>
                  <Download className="mr-2 h-4 w-4" /> Template
                </Button>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="period-flags-file">Pilih File Excel</Label>
                <Input
                  id="period-flags-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  aria-label="Berkas keikutsertaan"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  disabled={apply.isPending}
                />
                {file && (
                  <p className="text-xs text-muted-foreground">
                    File terpilih: <span className="font-medium text-foreground">{file.name}</span>
                  </p>
                )}
                {(checked || file) && fileProblem && <p role="alert" className="text-xs text-destructive">{fileProblem}</p>}
              </div>

              {apply.isPending && (
                <Alert>
                  <Upload className="h-4 w-4 animate-bounce" />
                  <AlertTitle>Sedang memproses...</AlertTitle>
                  <AlertDescription>Mohon tunggu, sistem sedang memvalidasi dan menyimpan data.</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="space-y-4" aria-label="Hasil impor">
              <p className="text-sm font-medium">{result.academicYear.label}</p>
              <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
                {SUMMARY.map((item) => (
                  <div key={item.key} className="rounded-lg border p-2">
                    <p className={`text-2xl font-bold ${item.className}`}>{result.totals[item.key] ?? 0}</p>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              {problems.length > 0 ? (
                <ScrollArea className="h-[180px] w-full rounded-md border bg-red-50/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                    <AlertCircle className="h-4 w-4" /> Baris yang dilewati:
                  </h4>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-red-600" aria-label="Baris yang dilewati">
                    {problems.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <CheckCircle2 className="mb-2 h-12 w-12 text-green-500" />
                  <p className="text-sm font-semibold text-green-700">Import Berhasil!</p>
                  <p className="text-xs text-muted-foreground">Seluruh baris diproses tanpa kendala.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => onOpenChange(false)} className="w-full">Selesai</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={apply.isPending}>Batal</Button>
              <Button onClick={start} disabled={apply.isPending}>
                {apply.isPending ? 'Memproses...' : 'Mulai Import'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
