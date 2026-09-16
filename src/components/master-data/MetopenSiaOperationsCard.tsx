import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Info, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Spinner } from '@/components/ui/spinner';
import { toTitleCaseName } from '@/lib/text';
import {
  getMetopenSiaOperations,
  releaseWaitingKrsBooking,
  triggerSiaSync,
  type MetopenSiaOperationRow,
} from '@/services/sia.service';

const OPERATIONS_KEY = ['sia', 'metopen-operations'] as const;

function StudentCell({ row }: { row: MetopenSiaOperationRow }) {
  return (
    <div>
      <p className="text-sm font-medium">{toTitleCaseName(row.studentName) || '-'}</p>
      <p className="text-xs text-muted-foreground">{row.identityNumber || row.studentId || '-'}</p>
    </div>
  );
}

function krsLabel(value: boolean | null | undefined) {
  if (value === true) return 'KRS TA true';
  if (value === false) return 'KRS TA false';
  return 'KRS TA belum observasi';
}

interface MetopenSiaOperationsCardProps {
  canMutate?: boolean;
}

export function MetopenSiaOperationsCard({ canMutate = false }: MetopenSiaOperationsCardProps) {
  const queryClient = useQueryClient();
  const [releaseTarget, setReleaseTarget] = useState<MetopenSiaOperationRow | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: OPERATIONS_KEY,
    queryFn: getMetopenSiaOperations,
  });

  const syncMutation = useMutation({
    mutationFn: triggerSiaSync,
    onSuccess: () => {
      toast.success('Sinkronisasi SIA dijalankan');
      void queryClient.invalidateQueries({ queryKey: OPERATIONS_KEY });
    },
    onError: (syncError: Error) => toast.error(syncError.message),
  });

  const releaseMutation = useMutation({
    mutationFn: (requestId: string) => releaseWaitingKrsBooking(requestId),
    onSuccess: () => {
      toast.success('Booking menunggu KRS TA dilepas');
      setReleaseTarget(null);
      void queryClient.invalidateQueries({ queryKey: OPERATIONS_KEY });
    },
    onError: (releaseError: Error) => toast.error(releaseError.message),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Data akademik SIA</CardTitle>
            <CardDescription>
              SIA hanya sensor KRS dan eligibility. NeoCentral yang menutup Metopel dan
              memutuskan promosi. Observasi menempel ke tahun ajaran aktif
              {data?.activeYear ? ` (${data.activeYear.label})` : ''}.
            </CardDescription>
          </div>
          {canMutate && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sinkronkan SIA
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.sync?.error ? (
          <Alert variant="destructive">
            <AlertTitle>Sinkronisasi terakhir gagal</AlertTitle>
            <AlertDescription>{data.sync.error}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sync terakhir: {data?.sync?.lastRun ? new Date(data.sync.lastRun).toLocaleString('id-ID') : 'belum ada'}.
            {data?.coverage
              ? ` Snapshot periode ${data.coverage.coverageLabel ?? `${data.coverage.studentsWithSnapshot}/${data.coverage.totalStudents}`}.`
              : ''}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-5 w-5" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">
            {(error as Error).message || 'Gagal memuat daftar operasi Metopel/SIA.'}
          </p>
        ) : (
          <>
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Menunggu konfirmasi KRS TA</h3>
                <Badge variant="secondary">{data?.waitingKrs.length ?? 0}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Sudah lulus Metopel. Booking tidak dilepas otomatis hanya karena KRS belum true.
              </p>
              {(data?.waitingKrs.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada mahasiswa menunggu KRS TA.</p>
              ) : (
                <div className="space-y-2">
                  {data?.waitingKrs.map((row) => (
                    <div
                      key={row.requestId ?? row.thesisId}
                      className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <StudentCell row={row} />
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{krsLabel(row.takingThesisCourse)}</Badge>
                        {canMutate && row.requestId && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setReleaseTarget(row)}
                          >
                            Lepas booking
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Eksepsi SIA</h3>
                <Badge variant="secondary">{data?.exceptions.length ?? 0}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Gagal Metopel tetapi KRS TA SIA true. Bukan arsip, bukan beban aktif TA; mahasiswa mengulang.
              </p>
              {(data?.exceptions.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada eksepsi SIA.</p>
              ) : (
                <div className="space-y-2">
                  {data?.exceptions.map((row) => (
                    <div key={row.thesisId} className="rounded-md border p-3">
                      <StudentCell row={row} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.periodClosed ? 'Tutup periode. ' : ''}
                        {row.attendanceAutoZeroed ? 'Auto-zero presensi. ' : ''}
                        Status: {row.requestStatus ?? '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {(data?.missingAcademicYear.length ?? 0) > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Thesis tanpa tahun ajaran</AlertTitle>
                <AlertDescription>
                  {data?.missingAcademicYear.length} thesis Metopel tidak terikat tahun ajaran.
                  Jangan dinilai di tahun baru sampai data diperbaiki.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>

      <AlertDialog open={Boolean(releaseTarget)} onOpenChange={(open) => !open && setReleaseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lepas booking menunggu KRS TA?</AlertDialogTitle>
            <AlertDialogDescription>
              {toTitleCaseName(releaseTarget?.studentName) || 'Mahasiswa ini'} sudah lulus Metopel
              tetapi KRS TA belum dikonfirmasi. Lepas manual hanya jika observasi SIA tidak akan
              menjadi true. Mahasiswa tidak naik arsip Tugas Akhir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={releaseMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={releaseMutation.isPending || !releaseTarget?.requestId}
              onClick={(event) => {
                event.preventDefault();
                if (releaseTarget?.requestId) {
                  releaseMutation.mutate(releaseTarget.requestId);
                }
              }}
            >
              {releaseMutation.isPending ? 'Melepas...' : 'Lepas booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
