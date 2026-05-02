import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, Upload, FileCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDownloadDraftSk, useUploadSkResmi } from '@/hooks/yudisium/useYudisiumParticipants';
import { useRole } from '@/hooks/shared';
import { ROLES } from '@/lib/roles';
import type { YudisiumEvent } from '@/services/yudisium/yudisium.service';

interface Props {
  detail: YudisiumEvent;
}

export function YudisiumDetailSkPanel({ detail }: Props) {
  const { hasAnyRole } = useRole();
  const [skModalOpen, setSkModalOpen] = useState(false);
  const [skFile, setSkFile] = useState<File | null>(null);
  const [skEventDate, setSkEventDate] = useState('');
  const [skDecreeNumber, setSkDecreeNumber] = useState('');
  const [skDecreeIssuedAt, setSkDecreeIssuedAt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const draftSkMutation = useDownloadDraftSk();
  const uploadSkMutation = useUploadSkResmi(detail.id);

  const canManageSkActions = hasAnyRole([
    ROLES.KETUA_DEPARTEMEN,
    ROLES.SEKRETARIS_DEPARTEMEN,
    ROLES.KOORDINATOR_YUDISIUM,
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>SK Yudisium</CardTitle>
              <CardDescription>Kelola draf dan unggahan SK resmi yudisium</CardDescription>
            </div>
            {canManageSkActions && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSkFile(null);
                    setSkEventDate('');
                    setSkDecreeNumber('');
                    setSkDecreeIssuedAt('');
                    setSkModalOpen(true);
                  }}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Upload SK Resmi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => draftSkMutation.mutate(detail.id)}
                  disabled={draftSkMutation.isPending}
                >
                  <FileDown className="mr-1 h-4 w-4" />
                  {draftSkMutation.isPending ? 'Mengunduh...' : 'Generate Draft SK'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">Status Dokumen SK</p>
              <p className="text-sm text-muted-foreground">
                {detail.status === 'finalized' 
                  ? 'SK Resmi telah diunggah dan periode telah diselesaikan.' 
                  : 'SK Resmi belum diunggah atau periode masih dalam proses.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={skModalOpen} onOpenChange={setSkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload SK Resmi</DialogTitle>
            <DialogDescription>
              Unggah file SK resmi beserta informasi terkait pelaksanaan yudisium.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>File SK (PDF)</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setSkFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label>Tanggal Pelaksanaan Yudisium</Label>
              <Input
                type="date"
                value={skEventDate}
                onChange={(e) => setSkEventDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Nomor SK</Label>
              <Input
                type="text"
                placeholder="Contoh: SK/001/2026"
                value={skDecreeNumber}
                onChange={(e) => setSkDecreeNumber(e.target.value)}
              />
            </div>
            <div>
              <Label>Tanggal SK Ditetapkan</Label>
              <Input
                type="date"
                value={skDecreeIssuedAt}
                onChange={(e) => setSkDecreeIssuedAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (!skFile) return;
                uploadSkMutation.mutate(
                  {
                    file: skFile,
                    eventDate: skEventDate,
                    decreeNumber: skDecreeNumber,
                    decreeIssuedAt: skDecreeIssuedAt,
                  },
                  { onSuccess: () => setSkModalOpen(false) }
                );
              }}
              disabled={
                uploadSkMutation.isPending || 
                !skFile || 
                !skEventDate || 
                !skDecreeNumber || 
                !skDecreeIssuedAt
              }
            >
              {uploadSkMutation.isPending ? 'Mengunggah...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
