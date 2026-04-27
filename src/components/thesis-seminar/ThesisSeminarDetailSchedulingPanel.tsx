import { AdminThesisSeminarSchedulingSection } from '@/components/thesis-seminar/AdminThesisSeminarSchedulingSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRole } from '@/hooks/shared/useRole';
import { Calendar, MapPin, Clock, Video } from 'lucide-react';
import { formatDateOnlyId, toTitleCaseName } from '@/lib/text';

function extractTime(iso: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

interface Props {
  seminarId: string;
  detail: any;
}

export function ThesisSeminarDetailSchedulingPanel({ seminarId, detail }: Props) {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6">
      {/* 1. View Only Content (For everyone) */}
      <ViewerSchedulingContent detail={detail} />

      {/* 2. Admin Scheduling Management (Always visible for now, or just for Admin if you prefer, but the user said "biarkan saja komponen itu saling menimpa") */}
      {/* Based on "biarkan saja komponen itu saling menimpa", I will show both if Admin or Dosen or anyone can see it */}
      <div className="pt-6 border-t border-dashed">
        <h3 className="text-lg font-semibold mb-4 px-1">Manajemen Penjadwalan (Admin View)</h3>
        <AdminThesisSeminarSchedulingSection seminarId={seminarId} isEditable={isAdmin()} />
      </div>
    </div>
  );
}

function ViewerSchedulingContent({ detail }: { detail: any }) {
  const dateStr = detail.date ? formatDateOnlyId(detail.date) : 'Belum dijadwalkan';
  const timeStr = detail.startTime && detail.endTime 
    ? `${extractTime(detail.startTime)} – ${extractTime(detail.endTime)}`
    : 'Belum ditentukan';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Informasi Jadwal Seminar (Viewer View)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
            <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Tanggal</p>
              <p className="font-medium">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
            <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Waktu</p>
              <p className="font-medium">{timeStr}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
            {detail.isOnline ? (
              <Video className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Lokasi</p>
              {detail.isOnline ? (
                <div className="space-y-1">
                  <p className="font-medium text-green-600">Seminar Daring</p>
                  {detail.meetingLink ? (
                    <a href={detail.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                      {detail.meetingLink}
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Link belum tersedia</p>
                  )}
                </div>
              ) : (
                <p className="font-medium">{detail.room?.name || 'Belum ditentukan'}</p>
              )}
            </div>
          </div>
        </div>

        {detail.examiners?.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Dosen Penguji</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detail.examiners.map((ex: any) => (
                <div key={ex.id} className="text-sm p-2 rounded border bg-background">
                  <span className="text-muted-foreground">Penguji {ex.order}:</span>{' '}
                  <span className="font-medium">{toTitleCaseName(ex.lecturerName)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
