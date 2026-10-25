import { toast } from 'sonner';
import { DocumentVerificationDialog, type VerificationItem } from '@/components/shared/DocumentVerificationDialog';
import { API_CONFIG } from '@/config/api';
import { useAdminDefenceDetail, useVerifyDefenceDocument } from '@/hooks/thesis-defence/useAdminThesisDefence';
import { toTitleCaseName } from '@/lib/text';
import type { AdminDefenceListItem } from '@/types/defence.types';

interface AdminThesisDefenceVerificationFormDialogProps {
  defence: AdminDefenceListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Admin verifies the Sidang registration documents one by one. */
export function AdminThesisDefenceVerificationFormDialog({ defence, open, onOpenChange }: AdminThesisDefenceVerificationFormDialogProps) {
  const { data: detail, isLoading } = useAdminDefenceDetail(open && defence ? defence.id : undefined);
  const verifyMutation = useVerifyDefenceDocument();

  const items: VerificationItem[] = (detail?.documentTypes ?? []).map((type) => {
    const doc = detail?.documents.find((d) => d.requirementId === type.id) ?? null;
    return {
      id: type.id,
      name: type.name,
      status: doc?.status ?? null,
      fileName: doc?.fileName,
      fileUrl: doc && defence ? API_CONFIG.ENDPOINTS.THESIS_DEFENCE.DOCUMENT_FILE(defence.id, type.id) : null,
      submittedAt: doc?.submittedAt,
      notes: doc?.notes,
    };
  });

  return (
    <DocumentVerificationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Verifikasi Dokumen Sidang"
      subtitle={detail ? `${toTitleCaseName(detail.student.name)} — ${detail.student.nim}` : null}
      items={items}
      isLoading={isLoading}
      isPending={verifyMutation.isPending}
      onDecide={async (item, action, notes) => {
        if (!defence) return;
        try {
          const result = await verifyMutation.mutateAsync({ defenceId: defence.id, requirementId: item.id, payload: { action, notes } });
          toast.success(action === 'approve' ? 'Dokumen disetujui' : 'Dokumen ditolak');
          if (result.defenceTransitioned) toast.success('Semua dokumen disetujui — sidang berstatus "Terverifikasi"');
          return { done: result.defenceTransitioned };
        } catch (error) {
          toast.error((error as Error).message || 'Gagal memverifikasi dokumen');
          throw error;
        }
      }}
    />
  );
}
