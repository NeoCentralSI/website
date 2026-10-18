import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Loader2, Paperclip, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useActiveAcademicYear } from '@/hooks/shared/useActiveAcademicYear';
import { downloadAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import {
  applyPeriodFlagsImportAPI,
  PERIOD_FLAGS_TEMPLATE_URL,
  previewPeriodFlagsImportAPI,
  type PeriodFlagsImportPlan,
} from '@/services/admin.service';

const flagLabel = (value: boolean | null) => (value === null ? '-' : value ? 'Ya' : 'Tidak');

/** Why the chosen file cannot be read yet, or null. */
export function getImportFileProblem(file: File | null): string | null {
  if (!file) return 'Pilih berkas .xlsx atau .csv terlebih dahulu.';
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return 'Berkas harus berupa .xlsx atau .csv.';
  return null;
}

/**
 * Paket P9 (K36): Data Master → Mahasiswa → Impor Keikutsertaan. Semester (default the active one),
 * template, file, Pratinjau, then Terapkan. Nothing is stored before Terapkan; problem rows are
 * reported and do not stop the rest. The result is the Admin's (kept by the SIA sync).
 */
export function StudentPeriodFlagsImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { academicYear } = useActiveAcademicYear();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [plan, setPlan] = useState<PeriodFlagsImportPlan | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const yearId = academicYearId ?? academicYear?.id ?? null;

  const reset = () => {
    setFile(null);
    setPlan(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  useEffect(() => { if (!open) { reset(); setAcademicYearId(null); } }, [open]);

  const preview = useMutation({
    mutationFn: () => previewPeriodFlagsImportAPI(yearId!, file!),
    onSuccess: (result) => setPlan(result.data),
    onError: (error: Error) => toast.error(error.message),
  });
  const apply = useMutation({
    mutationFn: () => applyPeriodFlagsImportAPI(yearId!, file!),
    onSuccess: (result) => {
      toast.success(result.message ?? 'Keikutsertaan diimpor.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-detail'] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const fileProblem = getImportFileProblem(file);
  const previewReason = !yearId ? 'Pilih semester terlebih dahulu.' : fileProblem;
  const applyReason = previewReason ?? (!plan ? 'Pratinjau berkas terlebih dahulu.' : plan.totals.changed === 0 ? 'Tidak ada perubahan.' : null);
  const busy = preview.isPending || apply.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Impor Keikutsertaan</DialogTitle>
          <DialogDescription>Mengambil Metode Penelitian dan Mengambil Tugas Akhir per mahasiswa untuk satu semester. Sel kosong tidak diubah.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Semester</Label>
            <PeriodSelect value={yearId} onChange={(id) => { setAcademicYearId(id); setPlan(null); }} />
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            aria-label="Berkas keikutsertaan"
            onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPlan(null); }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => void downloadAuthenticatedFileOrToast(PERIOD_FLAGS_TEMPLATE_URL, 'Templat-Keikutsertaan-Semester.xlsx')}>
              <Download className="mr-2 h-4 w-4" />Unduh Templat
            </Button>
            <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              <Paperclip className="mr-2 h-4 w-4" />Pilih Berkas
            </Button>
            {file && <span className="min-w-0 truncate text-xs text-muted-foreground" title={file.name}>{file.name}</span>}
          </div>
          {file && fileProblem && <p className="text-xs text-destructive">{fileProblem}</p>}
        </div>

        {plan && (
          <div className="space-y-3 rounded-lg border p-3 text-sm" aria-label="Pratinjau impor">
            <p className="font-medium">Pratinjau {plan.academicYear.label} · belum disimpan</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning">Berubah: {plan.totals.changed}</Badge>
              <Badge variant="outline">Sama: {plan.totals.unchanged}</Badge>
              <Badge variant="outline">NIM tidak dikenal: {plan.totals.unknownNim}</Badge>
              <Badge variant={plan.totals.invalid ? 'destructive' : 'outline'}>Baris tidak valid: {plan.totals.invalid}</Badge>
            </div>
            {plan.changes.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto" aria-label="Baris yang berubah">
                {plan.changes.map((change) => (
                  <li key={change.row} className="text-xs">
                    <span className="font-medium">{change.nim}</span> {change.fullName ?? ''}: Metode Penelitian {flagLabel(change.before.eligibleResearchMethod)} → {flagLabel(change.after.eligibleResearchMethod)},
                    {' '}Tugas Akhir {flagLabel(change.before.takingThesisCourse)} → {flagLabel(change.after.takingThesisCourse)}
                  </li>
                ))}
              </ul>
            )}
            {plan.unknown.length > 0 && (
              <p className="text-xs text-muted-foreground">NIM tidak dikenal: {plan.unknown.map((u) => `${u.nim} (baris ${u.row})`).join(', ')}</p>
            )}
            {plan.invalid.length > 0 && (
              <ul className="space-y-0.5 text-xs text-destructive" aria-label="Baris tidak valid">
                {plan.invalid.map((item) => <li key={item.row}>Baris {item.row}{item.nim ? ` (${item.nim})` : ''}: {item.reason}</li>)}
              </ul>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Batal</Button>
          <span title={previewReason ?? undefined} className="inline-flex">
            <Button size="sm" variant="outline" disabled={Boolean(previewReason) || busy} onClick={() => preview.mutate()}>
              {preview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Pratinjau
            </Button>
          </span>
          <span title={applyReason ?? undefined} className="inline-flex">
            <Button size="sm" disabled={Boolean(applyReason) || busy} onClick={() => apply.mutate()}>
              {apply.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Terapkan
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
