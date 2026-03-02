import { CheckCircle2 } from 'lucide-react';
import type { AttendanceSummary } from '@/types/seminar.types';

interface AttendanceSummaryCardProps {
  summary: AttendanceSummary;
}

export function AttendanceSummaryCard({ summary }: AttendanceSummaryCardProps) {
  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50/50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-green-600">Kehadiran Seminar</p>
          <p className="text-3xl font-bold mt-1">
            {summary.attended} / {summary.required}
          </p>
          {summary.met ? (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Syarat Terpenuhi
            </p>
          ) : (
            <p className="text-sm text-amber-600 mt-1">
              Butuh {summary.required - summary.attended} lagi
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-green-600">Total Kehadiran</p>
          <p className="text-3xl font-bold mt-1">{summary.attended}</p>
          <p className="text-sm text-muted-foreground mt-1">Seminar dihadiri</p>
        </div>
      </div>
    </div>
  );
}
