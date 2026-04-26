import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { StudentSeminarOverview } from '@/types/seminar.types';

export const StudentThesisSeminarChecklistRequirementsCard = ({ 
  checklist, 
  isRecap 
}: { 
  checklist: StudentSeminarOverview['checklist'];
  isRecap: boolean;
}) => {
  const metCount = Object.values(checklist).filter(v => v === true).length;
  const totalCount = Object.keys(checklist).length;
  const progress = (metCount / totalCount) * 100;

  const items = [
    { key: 'minGuidance', label: 'Minimal 16x Bimbingan Terverifikasi', status: checklist.minGuidance },
    { key: 'supervisorReady', label: 'Persetujuan Siap Seminar (Semua Pembimbing)', status: checklist.supervisorReady },
    { key: 'minAttendance', label: 'Kehadiran Seminar Hasil (Min. 10x)', status: checklist.minAttendance },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Persyaratan Seminar</span>
          <Badge variant={progress === 100 ? "default" : "outline"} className={progress === 100 ? "bg-green-600" : ""}>
            {metCount}/{totalCount} Terpenuhi
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-right text-muted-foreground font-medium">{progress.toFixed(0)}% Selesai</p>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.key} className="flex items-start gap-3 group">
              {item.status ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                <p className={`text-sm font-medium ${item.status ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {item.label}
                </p>
                {!item.status && !isRecap && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Segera lengkapi persyaratan ini
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
