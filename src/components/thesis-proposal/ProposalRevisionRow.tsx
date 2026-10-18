import { FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { openAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import { getProposalRevisionStatusLabel, getProposalRevisionStatusVariant } from '@/lib/thesisLabels';
import type { ProposalRevision } from '@/types/thesis-proposal.types';

/** One upload of a revised proposal with its review notes (the Pembimbing 1's review card). */
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
