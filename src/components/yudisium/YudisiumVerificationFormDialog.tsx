import { toast } from 'sonner';
import { DocumentVerificationDialog, type VerificationItem } from '@/components/shared/DocumentVerificationDialog';
import { API_CONFIG } from '@/config/api';
import { useYudisiumParticipantDetail, useVerifyYudisiumDocument } from '@/hooks/yudisium/useYudisiumParticipants';
import { toTitleCaseName } from '@/lib/text';
import type { AdminYudisiumParticipant } from '@/types/admin-yudisium.types';

interface YudisiumVerificationFormDialogProps {
  participant: AdminYudisiumParticipant | null;
  yudisiumId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Admin verifies the yudisium requirement documents one by one. */
export function YudisiumVerificationFormDialog({ participant, yudisiumId, open, onOpenChange }: YudisiumVerificationFormDialogProps) {
  const { data: detail, isLoading } = useYudisiumParticipantDetail(yudisiumId, open && participant ? participant.id : '');
  const verifyMutation = useVerifyYudisiumDocument(yudisiumId);

  const items: VerificationItem[] = (detail?.documents ?? []).map((entry) => ({
    id: entry.requirementId,
    name: entry.requirementName,
    status: entry.status,
    fileName: entry.document?.fileName,
    fileUrl: entry.document && participant ? API_CONFIG.ENDPOINTS.YUDISIUM.REQUIREMENT_FILE(yudisiumId, participant.id, entry.requirementId) : null,
    submittedAt: entry.submittedAt,
    notes: entry.notes,
  }));

  return (
    <DocumentVerificationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Verifikasi Dokumen Yudisium"
      subtitle={detail ? `${toTitleCaseName(detail.studentName)} — ${detail.studentNim}` : null}
      items={items}
      isLoading={isLoading}
      isPending={verifyMutation.isPending}
      onDecide={async (item, action, notes) => {
        if (!participant) return;
        try {
          const result = await verifyMutation.mutateAsync({ participantId: participant.id, requirementId: item.id, payload: { action, notes } });
          toast.success(action === 'approve' ? 'Dokumen disetujui' : 'Dokumen ditolak');
          if (result.participantTransitioned) toast.success('Semua dokumen disetujui — peserta berstatus "Menunggu Validasi CPL"');
          return { done: result.participantTransitioned };
        } catch (error) {
          toast.error((error as Error).message || 'Gagal memverifikasi dokumen');
          throw error;
        }
      }}
    />
  );
}
