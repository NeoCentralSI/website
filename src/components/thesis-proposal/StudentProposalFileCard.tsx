import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Eye, FileText, Loader2, Send, Upload, X } from 'lucide-react';

import { SoftWarning } from '@/components/shared/SoftWarning';
import AuthenticatedDocumentPreviewDialog from '@/components/thesis/AuthenticatedDocumentPreviewDialog';
import { Button } from '@/components/ui/button';
import { useSubmitProposalRevision } from '@/hooks/thesis-proposal/useProposalRevision';
import { useSubmitFinalProposal } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import { cn } from '@/lib/utils';
import type { FinalProposalAttempt, ProposalRevision, StudentProposalOverview } from '@/types/thesis-proposal.types';

const MAX_SIZE_MB = 10;
const LABELS = { final: 'Proposal Final', revision: 'Proposal Revisi' } as const;
export const NOT_OPEN_YET = 'Terbuka setelah penetapan pembimbing';

/** Why the chosen file is refused before it is sent, or null. */
export function getProposalFileProblem(file: File | null, kind: 'final' | 'revision' = 'final'): string | null {
  if (!file) return 'Pilih berkas PDF terlebih dahulu.';
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') return `${LABELS[kind]} harus berupa berkas PDF.`;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Ukuran berkas maksimal ${MAX_SIZE_MB} MB.`;
  return null;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '-';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

type Tone = 'done' | 'failed' | 'waiting' | 'none';
interface FileStatus { text: string; tone: Tone }

/** The assessment status of the current attempt, as the student reads it. */
export function getFinalProposalStatus(attempt: FinalProposalAttempt | null): FileStatus {
  if (!attempt?.file?.url) return { text: 'Belum diajukan', tone: 'none' };
  if (attempt.isFinalized && attempt.result === 'passed') return { text: `Lulus · ${attempt.finalScore ?? '-'}`, tone: 'done' };
  if (attempt.isFinalized && attempt.result === 'failed') return { text: `Tidak Lulus · ${attempt.finalScore ?? '-'}`, tone: 'failed' };
  if (attempt.supervisorScored && !attempt.coordinatorScored) return { text: 'Menunggu nilai koordinator', tone: 'waiting' };
  if (attempt.coordinatorScored && !attempt.supervisorScored) return { text: 'Menunggu nilai pembimbing', tone: 'waiting' };
  return { text: 'Menunggu penilaian', tone: 'waiting' };
}

export function getRevisionStatus(revision: ProposalRevision | null): FileStatus {
  if (!revision) return { text: 'Belum diajukan', tone: 'none' };
  if (revision.status === 'approved') return { text: 'Disetujui Pembimbing 1', tone: 'done' };
  if (revision.status === 'revision_requested') return { text: 'Perlu revisi', tone: 'failed' };
  return { text: 'Menunggu Pembimbing 1', tone: 'waiting' };
}

const TONE_ICON: Record<Tone, string> = {
  done: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  failed: 'border-red-200 bg-red-50 text-red-600',
  waiting: 'border-blue-200 bg-blue-50 text-blue-600',
  none: 'border-primary/20 bg-primary/5 text-primary',
};
const TONE_CHIP: Record<Tone, string> = {
  done: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  waiting: 'bg-amber-50 text-amber-700',
  none: 'bg-muted text-muted-foreground',
};
const OUTLINE_PRIMARY = 'border-primary/40 text-primary hover:border-primary hover:bg-primary/5 hover:text-primary';

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-[7px] border border-gray-200 bg-muted p-[8px_12px] text-xs text-muted-foreground">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/** File information stays above the card footer: icon, name and status. */
function FileRow({ title, fileName, meta, status, actions }: {
  title: string;
  fileName?: string | null;
  meta?: string | null;
  status: FileStatus;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-[10px] rounded-[7px] border border-gray-200 bg-card p-[9px_10px]">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', TONE_ICON[status.tone])}>
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
          <span className={cn('inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', TONE_CHIP[status.tone])}>{status.text}</span>
          {fileName && <span className="min-w-0 truncate text-[11px] font-medium text-slate-500" title={fileName}>{fileName}</span>}
        </div>
        {meta && <div className="mt-0.5 text-[11px] text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
    </div>
  );
}

/**
 * The card "Proposal Final" (or "Proposal Revisi" for a thesis repeating its proposal), in the
 * form of the seminar document card, with one difference: a chosen file is not sent at once.
 * The student picks a file, reviews it (name, size, open in the viewer), then "Ajukan" sends it.
 * The card shows the file already sent and the assessment status. Before the supervisor
 * assignment it holds one line.
 */
export function StudentProposalFileCard({ overview, kind }: { overview: StudentProposalOverview; kind: 'final' | 'revision' }) {
  const submitFinal = useSubmitFinalProposal();
  const submitRevision = useSubmitProposalRevision();
  const submit = kind === 'final' ? submitFinal : submitRevision;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [viewer, setViewer] = useState<{ name: string; path: string } | null>(null);
  const localUrl = useMemo(() => (file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl); }, [localUrl]);

  const final = overview.finalProposal;
  const revision = overview.proposalRevision;
  const current = kind === 'final' ? final.current : null;
  const currentRevision = kind === 'revision' ? revision.current : null;
  const sent = kind === 'final'
    ? (current?.file?.url ? { name: current.file.fileName ?? 'Proposal final.pdf', url: current.file.url, at: current.file.submittedAt } : null)
    : (currentRevision ? { name: currentRevision.file.fileName, url: currentRevision.file.url, at: currentRevision.file.submittedAt } : null);
  const blockReason = kind === 'final' ? (final.blockReason ?? (!overview.assignment?.assigned ? NOT_OPEN_YET : null)) : revision.blockReason;
  const status = kind === 'final' ? getFinalProposalStatus(current) : getRevisionStatus(currentRevision);
  const fileProblem = file ? getProposalFileProblem(file, kind) : null;

  const choose = () => inputRef.current?.click();
  const clear = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const send = () => {
    if (!file || fileProblem) return;
    submit.mutate(file, { onSuccess: clear });
  };

  return (
    <section aria-label={`Kartu ${LABELS[kind]}`} className="flex flex-1 flex-col gap-3 rounded-[10px] border border-gray-200 bg-card p-[16px_18px]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-foreground">{LABELS[kind]}</div>
        <span className="text-xs text-muted-foreground">PDF, maks. {MAX_SIZE_MB} MB</span>
      </div>

        <div className="flex flex-col gap-1.5">
          {blockReason && !file && <Notice>{blockReason}</Notice>}
          <FileRow
            title={sent ? `${LABELS[kind]} diajukan` : LABELS[kind]}
            fileName={sent?.name}
            meta={sent?.at ? `Diajukan ${formatDateTimeWib(sent.at)}` : null}
            status={status}
            actions={<>
          {sent && (
            <Button type="button" variant="outline" size="sm" className={OUTLINE_PRIMARY} onClick={() => setViewer({ name: sent.name, path: sent.url })}>
              <Eye className="mr-2 h-4 w-4" />Lihat
            </Button>
          )}
          {!file && (
            <span title={blockReason ?? undefined} className="inline-flex">
              <Button type="button" variant="outline" size="sm" className={OUTLINE_PRIMARY} disabled={Boolean(blockReason) || submit.isPending} onClick={choose}>
                <Upload className="mr-2 h-4 w-4" />{sent ? 'Ganti Berkas' : 'Pilih Berkas'}
              </Button>
            </span>
          )}
          {file && (
            <>
              {localUrl && (
                <Button type="button" variant="outline" size="sm" className={OUTLINE_PRIMARY} onClick={() => setViewer({ name: file.name, path: localUrl })}>
                  <Eye className="mr-2 h-4 w-4" />Lihat
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" disabled={submit.isPending} onClick={clear} aria-label="Batalkan pilihan berkas">
                <X className="mr-1 h-4 w-4" />Batal
              </Button>
              <Button type="button" size="sm" disabled={Boolean(fileProblem) || submit.isPending} onClick={send}>
                {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Ajukan
              </Button>
            </>
          )}
            </>}
          />

          {file && (
            <FileRow
              title="Berkas yang akan diajukan"
              fileName={file.name}
              meta={formatFileSize(file.size)}
              status={fileProblem ? { text: 'Tidak bisa diajukan', tone: 'failed' } : { text: 'Belum dikirim', tone: 'none' }}
            />
          )}
          {fileProblem && <p className="text-xs text-destructive">{fileProblem}</p>}

          {currentRevision?.reviewNotes && (
            currentRevision.status === 'revision_requested' ? (
              <SoftWarning title={`Catatan ${currentRevision.reviewerName ? formatLecturerName(currentRevision.reviewerName) : 'Pembimbing 1'}`}>
                {currentRevision.reviewNotes}
              </SoftWarning>
            ) : (
              <p className="whitespace-pre-line rounded-md bg-muted/50 px-2 py-1.5 text-xs">
                <span className="font-medium">Catatan {currentRevision.reviewerName ? formatLecturerName(currentRevision.reviewerName) : 'Pembimbing 1'}:</span>{' '}
                {currentRevision.reviewNotes}
              </p>
            )
          )}
        </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        aria-label={`Berkas ${LABELS[kind].toLowerCase()}`}
        disabled={Boolean(blockReason) || submit.isPending}
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <AuthenticatedDocumentPreviewDialog
        open={Boolean(viewer)}
        onOpenChange={(value) => { if (!value) setViewer(null); }}
        fileName={viewer?.name}
        filePath={viewer?.path}
      />
    </section>
  );
}
