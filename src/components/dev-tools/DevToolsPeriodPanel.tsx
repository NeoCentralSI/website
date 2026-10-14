import { useState } from 'react';
import { CalendarRange, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { triggerSiaSync } from '@/services/sia.service';

/**
 * Period tools. SIA is read only (plan 10.6): the sync stores the per-semester flags of the
 * running semester. There is no "close Research Method period" step any more (K2): an
 * attempt that did not pass stays on record and the student retakes next semester.
 */
export function DevToolsPeriodPanel() {
  const [syncing, setSyncing] = useState(false);

  const runSiaSync = async () => {
    setSyncing(true);
    try {
      await triggerSiaSync();
      toast.success('Sinkronisasi SIA dijalankan.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menjalankan sinkronisasi SIA');
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
            Sinkronisasi SIA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Sinkronisasi hanya membaca SIA dan menyimpan penanda semester berjalan (mengambil Metode Penelitian,
            mengambil Tugas Akhir). Penanda satu mahasiswa bisa diubah di tab Mahasiswa.
          </p>
          <Button variant="outline" size="sm" disabled={syncing} onClick={() => void runSiaSync()}>
            {syncing ? <Spinner className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Jalankan Sinkronisasi SIA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
