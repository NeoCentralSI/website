import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { Spinner } from '@/components/ui/spinner';
import { useEvaluationContext } from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { LecturerThesisGuidanceEvaluationFormDialog } from './LecturerThesisGuidanceEvaluationFormDialog';

/**
 * Loads the thesis context and opens the existing "Isi Evaluasi" form (Paket E5, 3.4: from the
 * "Isi Evaluasi" icon of Mahasiswa Bimbingan).
 */
export function EvaluationFormLauncher({ thesisId, onClose }: { thesisId: string; onClose: () => void }) {
  const { data: context, isLoading } = useEvaluationContext(thesisId);
  if (isLoading || !context) {
    return (
      <RecordDetailDialog open onOpenChange={(open) => { if (!open) onClose(); }} title="Isi Evaluasi">
        <div className="flex justify-center py-6"><Spinner className="h-6 w-6" /></div>
      </RecordDetailDialog>
    );
  }
  return <LecturerThesisGuidanceEvaluationFormDialog open onOpenChange={(open) => { if (!open) onClose(); }} context={context} />;
}
