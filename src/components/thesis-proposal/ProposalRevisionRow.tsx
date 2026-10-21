import { Badge } from '@/components/ui/badge';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import { getProposalRevisionStatusLabel, getProposalRevisionStatusVariant } from '@/lib/thesisLabels';
import type { ProposalRevision } from '@/types/thesis-proposal.types';
import { ProposalFileChip } from './ProposalFileChip';

/**
 * One upload of a revised proposal: the file as a chip that opens the viewer, its status and
 * date, and the review notes. `actions` sit at the right of the file line.
 */
export function RevisionRow({ revision, actions }: { revision: ProposalRevision; actions?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <ProposalFileChip url={revision.file.url} fileName={revision.file.fileName} className="max-w-[260px]" />
        <Badge variant={getProposalRevisionStatusVariant(revision.status)}>{getProposalRevisionStatusLabel(revision.status)}</Badge>
        <span className="text-xs text-muted-foreground">Diunggah {formatDateTimeWib(revision.file.submittedAt)}</span>
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
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
