import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateOnlyId } from '@/lib/text';
import type { YudisiumEvent } from '@/services/yudisium/yudisium.service';

interface Props {
  detail: YudisiumEvent;
  onUpdate?: () => void;
}

export function YudisiumDetailIdentityPanel({ detail }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identitas Yudisium</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nama Periode</p>
            <p className="text-base">{detail.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Rentang Pendaftaran</p>
            <p className="text-base">
              {formatDateOnlyId(detail.registrationOpenDate)} — {formatDateOnlyId(detail.registrationCloseDate)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tanggal Yudisium</p>
            <p className="text-base">{formatDateOnlyId(detail.eventDate) || '-'}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ruangan</p>
            <p className="text-base">{detail.room?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Form Exit Survey</p>
            <p className="text-base">{detail.exitSurveyForm?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Catatan</p>
            <p className="text-base">{detail.notes || '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
