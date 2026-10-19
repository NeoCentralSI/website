import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { Spinner } from '@/components/ui/spinner';
import { useThesisChangeContext } from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { ThesisChangeRequestFormDialog } from './ThesisChangeRequestFormDialog';
import { ThesisChangeRequestDetailDialog } from './ThesisChangeRequestViews';

function LoadingDialog({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <RecordDetailDialog open onOpenChange={(open) => { if (!open) onClose(); }} title={title}>
      <div className="flex justify-center py-6"><Spinner className="h-6 w-6" /></div>
    </RecordDetailDialog>
  );
}

/**
 * "Ajukan Perubahan" from a row of Mahasiswa Bimbingan opens the same form as
 * the Perubahan Tugas Akhir card of the student detail, with the thesis context loaded here.
 */
export function ThesisChangeRequestFormLauncher({ thesisId, onClose }: { thesisId: string; onClose: () => void }) {
  const { data: context, isLoading } = useThesisChangeContext(thesisId);
  if (isLoading || !context) return <LoadingDialog title="Ajukan Perubahan" onClose={onClose} />;
  return <ThesisChangeRequestFormDialog open onOpenChange={(open) => { if (!open) onClose(); }} context={context} />;
}

/** The marker of a row with a running request opens that request's detail. */
export function OpenThesisChangeRequestLauncher({ thesisId, onClose }: { thesisId: string; onClose: () => void }) {
  const { data: context, isLoading } = useThesisChangeContext(thesisId);
  if (isLoading || !context) return <LoadingDialog title="Detail Pengajuan Perubahan" onClose={onClose} />;
  return <ThesisChangeRequestDetailDialog request={context.openRequest} onClose={onClose} />;
}
