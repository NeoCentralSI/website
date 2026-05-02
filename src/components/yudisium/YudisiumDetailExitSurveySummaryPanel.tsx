import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

interface Props {
  yudisiumId: string;
}

export function YudisiumDetailExitSurveySummaryPanel({ yudisiumId }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Laporan Exit Survey</h2>
          <p className="text-sm text-muted-foreground">Analisis dan ringkasan hasil survei kelulusan mahasiswa.</p>
        </div>
        <Button size="sm">
          <Download className="h-4 w-4 mr-2" />
          Ekspor PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistik Pengisian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Data statistik pengisian survei akan ditampilkan di sini.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ringkasan Jawaban</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Visualisasi ringkasan jawaban akan ditampilkan di sini.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
