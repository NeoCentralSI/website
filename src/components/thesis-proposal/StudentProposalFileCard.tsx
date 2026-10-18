import { useRef, useState } from 'react';
import { FileText, Loader2, Paperclip, Upload } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubmitProposalRevision } from '@/hooks/thesis-proposal/useProposalRevision';
import { useSubmitFinalProposal } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { openAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import { getProposalRevisionStatusLabel, getProposalRevisionStatusVariant } from '@/lib/thesisLabels';
import type { StudentProposalOverview } from '@/types/thesis-proposal.types';

const MAX_SIZE_MB = 50;
const LABELS = { final: 'Proposal Final', revision: 'Proposal Revisi' } as const;

/** Why the chosen file is refused before it is sent, or null. */
export function getProposalFileProblem(file: File | null, kind: 'final' | 'revision' = 'final'): string | null {
  if (!file) return 'Pilih berkas PDF terlebih dahulu.';
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') return `${LABELS[kind]} harus berupa berkas PDF.`;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Ukuran berkas maksimal ${MAX_SIZE_MB} MB.`;
  return null;
}

function FileLink({ name, url }: { name: string | null; url: string | null }) {
  if (!url) return null;
  return (
    <Button variant="link" className="h-auto justify-start p-0 text-left" onClick={() => openAuthenticatedFileOrToast(url)}>
      <FileText className="mr-1.5 h-4 w-4 shrink-0" />
      <span className="break-all">{name ?? 'Berkas'}</span>
    </Button>
  );
}

/**
 * Paket P9 (2): the right-hand card "Proposal Final" (or "Proposal Revisi" for a thesis repeating
 * its proposal): the current file, then Pilih Berkas (outline) and the main action. Why the
 * action is disabled is in its tooltip; earlier attempts are in the Informasi Proposal modal.
 */
export function StudentProposalFileCard({ overview, kind }: { overview: StudentProposalOverview; kind: 'final' | 'revision' }) {
  const submitFinal = useSubmitFinalProposal();
  const submitRevision = useSubmitProposalRevision();
  const submit = kind === 'final' ? submitFinal : submitRevision;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const final = overview.finalProposal;
  const revision = overview.proposalRevision;
  const current = kind === 'final' ? final.current : null;
  const currentRevision = kind === 'revision' ? revision.current : null;
  const hasFile = kind === 'final' ? Boolean(current?.file?.url) : Boolean(currentRevision);
  const blockReason = kind === 'final' ? final.blockReason : revision.blockReason;
  const replaces = kind === 'final' ? hasFile : revision.replacesCurrent;
  const label = `${replaces ? 'Ganti' : 'Ajukan'} ${LABELS[kind]}`;
  const fileProblem = file ? getProposalFileProblem(file, kind) : null;
  const disabledReason = blockReason ?? (file ? fileProblem : 'Pilih berkas PDF terlebih dahulu.');

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
    <div className="space-y-3 rounded-[10px] border border-gray-200 bg-card p-[16px_18px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-base font-semibold text-foreground">{LABELS[kind]}</div>
        {kind === 'revision' && currentRevision ? (
          <Badge variant={getProposalRevisionStatusVariant(currentRevision.status)}>{getProposalRevisionStatusLabel(currentRevision.status)}</Badge>
        ) : hasFile ? (
          <Badge variant="success">Sudah Diajukan</Badge>
        ) : (
          <Badge variant="outline">Belum Diajukan</Badge>
        )}
      </div>

      {current?.file?.url && (
        <div className="text-sm">
          <FileLink name={current.file.fileName} url={current.file.url} />
          {current.file.submittedAt && <p className="text-xs text-muted-foreground">Diunggah {formatDateTimeWib(current.file.submittedAt)}</p>}
        </div>
      )}
      {currentRevision && (
        <div className="space-y-1 text-sm">
          <FileLink name={currentRevision.file.fileName} url={currentRevision.file.url} />
          <p className="text-xs text-muted-foreground">Diunggah {formatDateTimeWib(currentRevision.file.submittedAt)}</p>
          {currentRevision.reviewNotes && (
            <p className="whitespace-pre-line rounded-md bg-muted/50 px-2 py-1.5 text-xs">
              <span className="font-medium">Catatan {currentRevision.reviewerName ? formatLecturerName(currentRevision.reviewerName) : 'Pembimbing 1'}:</span>{' '}
              {currentRevision.reviewNotes}
            </p>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        aria-label={`Berkas ${LABELS[kind].toLowerCase()}`}
        disabled={Boolean(blockReason) || submit.isPending}
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
        {file && <span className="mr-auto min-w-0 truncate text-xs text-muted-foreground" title={file.name}>{file.name}</span>}
        <span title={blockReason ?? undefined} className="inline-flex">
          <Button size="sm" variant="outline" disabled={Boolean(blockReason) || submit.isPending} onClick={() => inputRef.current?.click()}>
            <Paperclip className="mr-2 h-4 w-4" />Pilih Berkas
          </Button>
        </span>
        <span title={disabledReason ?? undefined} className="inline-flex">
          <Button size="sm" disabled={Boolean(disabledReason) || submit.isPending} onClick={send}>
            {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {label}
          </Button>
        </span>
      </div>
      {fileProblem && <p className="text-xs text-destructive">{fileProblem}</p>}
    </div>
  );
}
