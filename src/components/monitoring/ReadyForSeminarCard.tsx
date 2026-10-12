import { CheckCircle2, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDateTimeWib, toTitleCaseName } from "@/lib/text";
import type { ReadyForSeminarStudent } from "@/services/monitoring.service";
import { MonitoringListCard, MonitoringListRow } from "./MonitoringListCard";

interface ReadyForSeminarCardProps {
  students: ReadyForSeminarStudent[] | undefined;
  isLoading: boolean;
}

/** "Siap Seminar": theses whose supervisors have all approved seminar readiness. */
export function ReadyForSeminarCard({ students, isLoading }: ReadyForSeminarCardProps) {
  const rows = students ?? [];

  return (
    <MonitoringListCard
      icon={GraduationCap}
      iconClassName="text-amber-500"
      title="Siap Seminar"
      description="Mahasiswa yang sudah mendapat persetujuan seminar dari pembimbing"
      count={rows.length}
      isLoading={isLoading}
      emptyDescription="Belum ada mahasiswa yang siap seminar."
    >
      {rows.map((student) => (
        <MonitoringListRow
          key={student.thesisId}
          name={toTitleCaseName(student.student.name)}
          identityNumber={student.student.nim}
          secondary={student.title ? <span title={student.title}>{student.title}</span> : undefined}
          trailing={
            <>
              <Badge className="whitespace-nowrap bg-amber-100 text-amber-800 hover:bg-amber-100">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Acc Seminar
              </Badge>
              {student.approvedAt && (
                <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTimeWib(student.approvedAt)}</span>
              )}
            </>
          }
        />
      ))}
    </MonitoringListCard>
  );
}
