import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTimeWib } from '@/lib/text';
import { getSiaSyncStatus, triggerSiaSync } from '@/services/sia.service';

const KEY = ['sia', 'sync-status'] as const;

/**
 * Sinkronisasi SIA (hanya membaca, rencana 10.6): kapan terakhir dijalankan dan berapa mahasiswa
 * yang sudah punya penanda semester berjalan (mengambil Metode Penelitian / Tugas Akhir).
 */
export function SiaSyncStatusCard({ canMutate = false }: { canMutate?: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: KEY, queryFn: getSiaSyncStatus });
  const sync = useMutation({
    mutationFn: triggerSiaSync,
    onSuccess: () => {
      toast.success('Sinkronisasi SIA selesai.');
      queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const coverage = data?.periodSnapshots ?? null;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Sinkronisasi SIA</CardTitle>
          <CardDescription>
            NeoCentral hanya membaca SIA. Penanda per semester dipakai untuk kelayakan Metode Penelitian dan KRS Tugas Akhir.
          </CardDescription>
        </div>
        {canMutate && (
          <Button size="sm" variant="outline" disabled={sync.isPending} onClick={() => sync.mutate()}>
            {sync.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Jalankan Sinkronisasi
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">Memuat…</p>
        ) : error ? (
          <p className="text-destructive">{error instanceof Error ? error.message : 'Gagal memuat status.'}</p>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Terakhir dijalankan</p>
              <p className="font-medium">{data?.lastRun ? formatDateTimeWib(data.lastRun) : 'Belum pernah'}</p>
              {data?.error ? <p className="text-xs text-destructive">{data.error}</p> : null}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mahasiswa dengan penanda semester berjalan</p>
              <p className="font-medium">{coverage ? `${coverage.studentsWithFlags} dari ${coverage.totalStudents}` : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mengambil Metode Penelitian / Tugas Akhir</p>
              <p className="font-medium">{coverage ? `${coverage.takingResearchMethod} / ${coverage.takingThesisCourse}` : '-'}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
