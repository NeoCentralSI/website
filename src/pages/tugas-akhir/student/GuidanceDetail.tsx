import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useStudentGuidanceDetail } from '@/hooks/guidance';
import { GuidanceRescheduleDialog } from '@/components/thesis/GuidanceRescheduleDialog';
import { GuidanceCancelDialog } from '@/components/thesis/GuidanceCancelDialog';
import { GuidanceNotesDialog } from '@/components/thesis/GuidanceNotesDialog';

export default function GuidanceDetailPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { guidanceId } = useParams();
  const navigate = useNavigate();

  const { guidance, isLoading, reschedule, cancel, updateNotes } = useStudentGuidanceDetail(guidanceId);

  const breadcrumb = useMemo(
    () => [{ label: 'Tugas Akhir' }, { label: 'Bimbingan', href: '/tugas-akhir/bimbingan' }, { label: 'Detail' }],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  return (
    <div className="p-4">
      <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4">
        Kembali
      </Button>

      <Card className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : guidance ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Pembimbing</div>
                <div className="font-medium">{guidance.supervisorName || guidance.supervisorId}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium capitalize">{guidance.status}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Terjadwal</div>
                <div className="font-medium">
                  {guidance.approvedDateFormatted ||
                    guidance.requestedDateFormatted ||
                    (guidance.requestedDate ? new Date(guidance.requestedDate).toLocaleString() : '-')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lokasi</div>
                <div className="font-medium">{guidance.location || '-'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Catatan</div>
              <div className="text-sm whitespace-pre-wrap">{guidance.notes || '-'}</div>
            </div>

            <div className="flex gap-2 pt-2">
              <GuidanceRescheduleDialog onReschedule={reschedule} />
              <GuidanceCancelDialog onCancel={cancel} />
              <GuidanceNotesDialog initialNotes={guidance.notes ?? ''} onUpdate={updateNotes} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Data tidak ditemukan</div>
        )}
      </Card>
    </div>
  );
}
