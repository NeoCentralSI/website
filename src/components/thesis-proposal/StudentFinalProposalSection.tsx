import { useRef, useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyProposalOverview, useSubmitFinalProposal } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { openAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatDateTimeWib } from '@/lib/text';
import { getResearchMethodResultLabel, getResearchMethodResultVariant } from '@/lib/thesisLabels';
import type { FinalProposalAttempt } from '@/types/thesis-proposal.types';

const MAX_SIZE_MB = 50;

/** Why the chosen file is refused before it is sent, or null. */
export function getFileProblem(file: File | null): string | null {
  if (!file) return 'Pilih berkas PDF terlebih dahulu.';
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') return 'Proposal final harus berupa berkas PDF.';
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Ukuran berkas maksimal ${MAX_SIZE_MB} MB.`;
  return null;
}

function AttemptFile({ attempt }: { attempt: FinalProposalAttempt }) {
  if (!attempt.file?.url) return <span className="text-muted-foreground">Belum diunggah</span>;
  return (
    <Button variant="link" className="h-auto p-0 text-left" onClick={() => openAuthenticatedFileOrToast(attempt.file?.url)}>
      <FileText className="mr-1.5 h-4 w-4 shrink-0" />
      <span className="break-all">{attempt.file.fileName ?? 'Proposal final'}</span>
    </Button>
  );
}

/**
 * Bagian "Proposal Final" di Tugas Akhir > Proposal (10.3): satu berkas per percobaan penilaian
 * (per semester). Bisa diganti sampai penilaian periode itu dimulai; percobaan semester lalu
 * tetap tersimpan sebagai riwayat.
 */
export function StudentFinalProposalSection() {
  const { data, isLoading } = useMyProposalOverview();
  const submit = useSubmitFinalProposal();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  if (isLoading || !data?.thesis) return null;
  const state = data.finalProposal;
  const current = state.current;
  const hasFile = Boolean(current?.file?.url);
  const fileProblem = file ? getFileProblem(file) : null;
  const blockReason = state.blockReason;
  const label = hasFile ? 'Ganti Proposal Final' : 'Ajukan Proposal Final';

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
          Proposal Final
          {hasFile ? <Badge variant="success">Sudah Diajukan</Badge> : <Badge variant="outline">Belum Diajukan</Badge>}
        </CardTitle>
        <CardDescription>
          Proposal final {state.academicYear?.label ?? 'periode berjalan'} dinilai pembimbing dan koordinator Metode Penelitian.
          Berkas dapat diganti sampai penilaian dimulai. Draf proposal dibawa sebagai lampiran sesi bimbingan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {current && (
          <div className="grid gap-2 md:grid-cols-[10rem_1fr]">
            <span className="text-muted-foreground">Berkas</span>
            <AttemptFile attempt={current} />
            {current.file?.submittedAt && (
              <>
                <span className="text-muted-foreground">Diunggah</span>
                <span>{formatDateTimeWib(current.file.submittedAt)}</span>
              </>
            )}
          </div>
        )}

        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            aria-label="Berkas proposal final"
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
            <p className="font-medium">Percobaan Sebelumnya</p>
            <ul className="divide-y rounded-lg border">
              {state.history.map((attempt) => (
                <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block font-medium">{attempt.academicYear.label ?? '-'}</span>
                    <AttemptFile attempt={attempt} />
                  </span>
                  {attempt.result ? (
                    <Badge variant={getResearchMethodResultVariant(attempt.result)}>
                      {getResearchMethodResultLabel(attempt.result)}{attempt.finalScore != null ? ` · ${attempt.finalScore}` : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Belum Final</Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
