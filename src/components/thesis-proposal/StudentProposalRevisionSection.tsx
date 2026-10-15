import { useRef, useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubmitProposalRevision } from '@/hooks/thesis-proposal/useProposalRevision';
import { useMyProposalOverview } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { openAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import { getProposalRevisionStatusLabel, getProposalRevisionStatusVariant } from '@/lib/thesisLabels';
import type { ProposalRevision } from '@/types/thesis-proposal.types';

const MAX_SIZE_MB = 50;

/** Why the chosen file is refused before it is sent, or null. */
export function getRevisionFileProblem(file: File | null): string | null {
  if (!file) return 'Pilih berkas PDF terlebih dahulu.';
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') return 'Proposal revisi harus berupa berkas PDF.';
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Ukuran berkas maksimal ${MAX_SIZE_MB} MB.`;
  return null;
}

export function RevisionRow({ revision }: { revision: ProposalRevision }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="link" className="h-auto p-0 text-left" onClick={() => openAuthenticatedFileOrToast(revision.file.url)}>
          <FileText className="mr-1.5 h-4 w-4 shrink-0" />
          <span className="break-all">{revision.file.fileName}</span>
        </Button>
        <Badge variant={getProposalRevisionStatusVariant(revision.status)}>{getProposalRevisionStatusLabel(revision.status)}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">Diunggah {formatDateTimeWib(revision.file.submittedAt)}</p>
      {revision.reviewNotes && (
        <p className="whitespace-pre-line rounded-md bg-muted/50 px-2 py-1.5 text-xs">
          <span className="font-medium">
            Catatan {revision.reviewerName ? formatLecturerName(revision.reviewerName) : 'Pembimbing 1'}
            {revision.reviewedAt ? ` (${formatDateTimeWib(revision.reviewedAt)})` : ''}:
          </span>{' '}
          {revision.reviewNotes}
        </p>
      )}
    </div>
  );
}

/**
 * Bagian "Proposal Revisi" di Tugas Akhir > Proposal (Lanjutan Paket P): hanya untuk TA yang
 * dikembalikan ke proposal oleh evaluasi bimbingan ("Mengulang Proposal"). Mahasiswa mengunggah
 * proposal revisi; Pembimbing 1 menyetujui (TA kembali ke Penelitian) atau meminta revisi. Tidak
 * melalui kelas, presensi, maupun Penilaian Proposal Metode Penelitian.
 */
export function StudentProposalRevisionSection() {
  const { data, isLoading } = useMyProposalOverview();
  const submit = useSubmitProposalRevision();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const state = data?.proposalRevision;
  if (isLoading || !data?.thesis || !state?.applicable) return null;
  const current = state.current;
  const fileProblem = file ? getRevisionFileProblem(file) : null;
  const blockReason = state.blockReason;
  const label = state.replacesCurrent ? 'Ganti Proposal Revisi' : 'Ajukan Proposal Revisi';

  const send = () => {
    if (!file || fileProblem) return;
    submit.mutate(file, {
      onSuccess: () => {
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Proposal Revisi
          {current ? (
            <Badge variant={getProposalRevisionStatusVariant(current.status)}>{getProposalRevisionStatusLabel(current.status)}</Badge>
          ) : (
            <Badge variant="outline">Belum Diajukan</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Tugas akhir Anda mengulang proposal berdasarkan evaluasi bimbingan. Unggah proposal revisi untuk ditinjau Pembimbing 1;
          setelah disetujui, tugas akhir kembali ke fase Penelitian dan masa bimbingan dihitung ulang. Tidak perlu kelas, presensi,
          maupun Penilaian Proposal Metode Penelitian.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {current && <RevisionRow revision={current} />}

        <div className="space-y-2 rounded-lg border border-dashed p-3">
          {current?.status === 'revision_requested' && (
            <p className="text-xs text-muted-foreground">Perbaiki proposal sesuai catatan di atas, lalu unggah versi barunya.</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            aria-label="Berkas proposal revisi"
            disabled={Boolean(blockReason) || submit.isPending}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm disabled:opacity-60"
          />
          {fileProblem && <p className="text-xs text-destructive">{fileProblem}</p>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {blockReason && <p className="mr-auto text-xs text-muted-foreground">{blockReason}</p>}
            <span title={blockReason ?? (file ? undefined : 'Pilih berkas PDF terlebih dahulu.')}>
              <Button size="sm" disabled={Boolean(blockReason) || !file || Boolean(fileProblem) || submit.isPending} onClick={send}>
                {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {label}
              </Button>
            </span>
          </div>
        </div>

        {state.history.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">Unggahan Sebelumnya</p>
            <ul className="divide-y rounded-lg border">
              {state.history.map((revision) => (
                <li key={revision.id} className="px-3 py-2">
                  <RevisionRow revision={revision} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
