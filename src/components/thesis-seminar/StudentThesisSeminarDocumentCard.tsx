import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StudentThesisSeminarDocumentCard = ({ allChecklistMet }: { allChecklistMet: boolean }) => {
  const documents = [
    { id: 1, name: 'Laporan Tugas Akhir', status: 'verified', updatedAt: '2024-03-20' },
    { id: 2, name: 'Slide Presentasi', status: 'pending', updatedAt: '2024-03-21' },
    { id: 3, name: 'Draft Jurnal TEKNOSI', status: 'not_submitted', updatedAt: '-' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Terverifikasi</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Menunggu</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-[10px]">Ditolak</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground">Belum Unggah</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Kelengkapan Berkas</span>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!allChecklistMet && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs mb-2">
            <strong>Catatan:</strong> Unggah berkas hanya dapat dilakukan setelah semua persyaratan checklist terpenuhi.
          </div>
        )}

        <div className="space-y-3">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className={cn(
                "p-3 border rounded-lg flex items-center justify-between transition-colors",
                doc.status === 'not_submitted' ? "bg-muted/30" : "bg-background"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-muted rounded-md shrink-0">
                  {getStatusIcon(doc.status)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">Terakhir diunggah: {doc.updatedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusLabel(doc.status)}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  disabled={!allChecklistMet}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button 
          className="w-full mt-2" 
          variant="outline" 
          disabled={!allChecklistMet}
        >
          Unggah Sekaligus (ZIP)
        </Button>
      </CardContent>
    </Card>
  );
};
