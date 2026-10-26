import { toast } from 'sonner';
import { DocumentVerificationDialog, type VerificationItem } from '@/components/shared/DocumentVerificationDialog';
import { toApiFilePath } from '@/components/thesis/useDocumentViewer';
import { useAdminThesisSeminarDetail, useVerifyAdminThesisSeminarDocument } from '@/hooks/thesis-seminar/useAdminThesisSeminar';
import { toTitleCaseName } from '@/lib/text';
import type { AdminSeminarListItem } from '@/types/seminar.types';

interface AdminThesisSeminarVerificationModalProps {
  seminar: AdminSeminarListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Admin verifies the Seminar Hasil registration documents one by one. */
export function AdminThesisSeminarVerificationModal({ seminar, open, onOpenChange }: AdminThesisSeminarVerificationModalProps) {
  const { data: detail, isLoading } = useAdminThesisSeminarDetail(open && seminar ? seminar.id : undefined);
  const verifyMutation = useVerifyAdminThesisSeminarDocument();

  const items: VerificationItem[] = (detail?.documentTypes ?? []).map((type) => {
    const doc = detail?.documents.find((d) => d.requirementId === type.id) ?? null;
    return {
      id: type.id,
      name: type.name,
      status: doc?.status ?? null,
      fileName: doc?.fileName,
      fileUrl: doc?.filePath ? toApiFilePath(doc.filePath) : null,
      submittedAt: doc?.submittedAt,
      notes: doc?.notes,
    };
  });

  return (
    <DocumentVerificationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Verifikasi Dokumen Seminar Hasil"
      subtitle={detail ? `${toTitleCaseName(detail.student.name)} — ${detail.student.nim}` : null}
      items={items}
      isLoading={isLoading}
      isPending={verifyMutation.isPending}
      onDecide={async (item, action, notes) => {
        if (!seminar) return;
        try {
          const result = await verifyMutation.mutateAsync({ seminarId: seminar.id, requirementId: item.id, payload: { action, notes } });
          toast.success(action === 'approve' ? 'Dokumen disetujui' : 'Dokumen ditolak');
          if (result.seminarTransitioned) toast.success('Semua dokumen disetujui — seminar berstatus "Terverifikasi"');
          return { done: result.seminarTransitioned };
        } catch (error) {
          toast.error((error as Error).message || 'Gagal memverifikasi dokumen');
          throw error;
        }
      }}
    />
  );
}
