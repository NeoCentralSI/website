import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { toTitleCaseName, formatDateOnlyId } from '@/lib/text';
import { ExternalLink, Users, Calendar, MapPin, Video, FileText } from 'lucide-react';
import type { StudentSeminarOverview } from '@/types/seminar.types';

export const StudentThesisSeminarIdentityCard = ({ seminar, onClick }: { seminar: NonNullable<StudentSeminarOverview['seminar']>; onClick: () => void }) => {
  const isOnline = !seminar.room && !!seminar.meetingLink;

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-primary"
      onClick={onClick}
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">Seminar Hasil Aktif</CardTitle>
          <p className="text-sm text-muted-foreground">Detail pendaftaran dan pelaksanaan seminar Anda</p>
        </div>
        <ThesisEventStatusBadge status={seminar.status} size="lg" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Schedule */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">Jadwal</span>
            </div>
            {seminar.date ? (
              <div>
                <p className="font-bold">{formatDateOnlyId(seminar.date)}</p>
                <p className="text-sm text-muted-foreground">
                  {seminar.startTime && seminar.endTime ? `${new Date(seminar.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(seminar.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} WIB` : '-'}
                </p>
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">Menunggu penjadwalan</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              {isOnline ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              <span className="text-xs font-semibold uppercase">Lokasi</span>
            </div>
            {seminar.room ? (
              <p className="font-bold">{seminar.room.name}</p>
            ) : isOnline ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Daring</Badge>
            ) : (
              <p className="text-sm italic text-muted-foreground">Belum ditentukan</p>
            )}
          </div>

          {/* Examiners */}
          <div className="space-y-2 lg:col-span-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">Tim Penguji</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {seminar.examiners.length > 0 ? (
                seminar.examiners.map((ex) => (
                  <Badge key={ex.id} variant="secondary" className="px-2 py-1">
                    <span className="text-muted-foreground mr-1.5 font-normal">P{ex.order}</span>
                    {toTitleCaseName(ex.lecturerName)}
                  </Badge>
                ))
              ) : (
                <p className="text-sm italic text-muted-foreground">Menunggu penetapan penguji</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end">
          <div className="flex items-center text-sm font-semibold text-primary">
            Lihat Detail Lengkap <ExternalLink className="ml-2 h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
