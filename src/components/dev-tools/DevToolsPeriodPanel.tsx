import { useEffect, useState } from 'react';
import { CalendarRange, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useDevToolsAcademicYears, useDevToolsMutations } from '@/hooks/dev-tools/useDevTools';
import { triggerSiaSync } from '@/services/sia.service';
import type { CloseMetopenPeriodResult } from '@/types/devTools.types';

export function DevToolsPeriodPanel() {
  const mutations = useDevToolsMutations();
  const { data: years, isLoading } = useDevToolsAcademicYears();
  const [closedYearId, setClosedYearId] = useState('');
  const [result, setResult] = useState<CloseMetopenPeriodResult | null>(null);
  const [forceOpen, setForceOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!closedYearId && years?.length) {
      const inactive = years.find((year) => !year.isActive) ?? years[0];
      if (inactive) setClosedYearId(inactive.id);
    }
  }, [closedYearId, years]);

  const selectedYear = years?.find((year) => year.id === closedYearId);
  const selectedIsActive = Boolean(selectedYear?.isActive);

  const runClose = async (dryRun: boolean, force = false) => {
    if (!closedYearId) return;
    if (!dryRun && selectedIsActive && !force) {
      setForceOpen(true);
      return;
    }
    const data = await mutations.closeMetopenPeriod(closedYearId, dryRun, force);
    if (data) setResult(data);
  };

  const runSiaSync = async () => {
    setSyncing(true);
    try {
      await triggerSiaSync();
      toast.success('Sync SIA dijalankan lewat colokan observasi yang sama dengan produksi.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menjalankan sync SIA');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            Skenario tutup periode Metopel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
            <li>Set eligible Metopen pada tab Mahasiswa (snapshot SIA tidak diubah oleh tutup periode).</li>
            <li>Pastikan thesis in-flight terikat tahun lama (pilih tahun di panel thesis mahasiswa). Itu rakit skenario, bukan perbaikan hidup.</li>
            <li>Jalankan dry-run, lalu eksekusi tutup periode. Job tahun ajaran memakai service yang sama dan mengulang close yang gagal.</li>
            <li>Toggle MK TA pada tab Mahasiswa menempel ke tahun aktif. True + lulus Metopel = promosi TA, bukan menu arsip dari KRS saja.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={syncing || mutations.isSubmitting} onClick={() => void runSiaSync()}>
              {syncing ? <Spinner className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Jalankan sync seperti SIA
            </Button>
          </div>
          {isLoading ? <Spinner className="h-5 w-5" /> : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <Label>Tahun ajaran yang ditutup</Label>
                <Select value={closedYearId} onValueChange={setClosedYearId}>
                  <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Pilih tahun" /></SelectTrigger>
                  <SelectContent>
                    {(years ?? []).map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.label}{year.isActive ? ' (Aktif sekarang)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedIsActive && (
                  <p className="text-xs text-amber-700">Tahun aktif butuh force + konfirmasi kedua.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled={mutations.isSubmitting || !closedYearId} onClick={() => void runClose(true)}>
                  Dry-run
                </Button>
                <Button disabled={mutations.isSubmitting || !closedYearId} onClick={() => void runClose(false)}>
                  Tutup periode
                </Button>
              </div>
            </div>
          )}
          {result && (
            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2">
              <p>
                {result.dryRun ? 'Dry-run' : 'Eksekusi'} {result.yearLabel}: diperiksa {result.counts.examined},
                {' '}nilai 0 {result.counts.zeroed}
                {typeof result.counts.ungradedFinal === 'number'
                  ? ` (final belum dinilai ${result.counts.ungradedFinal}, belum submit final ${result.counts.noFinalProposal ?? 0})`
                  : ''}
                {', '}dilepas {result.counts.released}, ditutup {result.counts.closed},
                dilewati {result.counts.skipped}.
              </p>
              {result.items.slice(0, 12).map((item, index) => (
                <p key={`${item.thesisId}-${item.requestId ?? index}`}>
                  {item.studentName || item.identityNumber || item.thesisId}: {item.currentStatus ?? '-'} → {item.nextStatus ?? item.skipReason ?? item.scoreAction}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={forceOpen} onOpenChange={setForceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup tahun ajaran yang sedang aktif?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini menutup penilaian in-flight pada tahun operasional. Hanya untuk merakit skenario.
              Konfirmasi kedua ini mengirim force=true ke server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setForceOpen(false);
                void runClose(false, true);
              }}
            >
              Force tutup tahun aktif
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
