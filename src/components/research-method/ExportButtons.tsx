import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { downloadAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { passedTitlesUrl, scoreRecapUrl } from '@/services/research-method/research-method.service';

const NO_PERIOD = 'Pilih periode terlebih dahulu.';

/**
 * Ekspor Metode Penelitian (10.6): rekap nilai dalam templat SIA dan daftar judul TA yang lulus,
 * yang dimasukkan ke SIA secara manual. NeoCentral tidak pernah mengirim ke SIA.
 */
export function ExportButtons({ academicYearId }: { academicYearId: string | null | undefined }) {
  const reason = academicYearId ? undefined : NO_PERIOD;
  return (
    <>
      <span title={reason} className="inline-flex">
        <Button
          variant="outline"
          size="sm"
          disabled={!academicYearId}
          onClick={() => academicYearId && downloadAuthenticatedFileOrToast(scoreRecapUrl(academicYearId), 'Rekap-Nilai-Metode-Penelitian.xlsx')}
        >
          <Download className="mr-2 h-4 w-4" />Rekap Nilai
        </Button>
      </span>
      <span title={reason} className="inline-flex">
        <Button
          variant="outline"
          size="sm"
          disabled={!academicYearId}
          onClick={() => academicYearId && downloadAuthenticatedFileOrToast(passedTitlesUrl(academicYearId), 'Judul-TA-Lulus-Metode-Penelitian.xlsx')}
        >
          <Download className="mr-2 h-4 w-4" />Judul TA Lulus
        </Button>
      </span>
    </>
  );
}
