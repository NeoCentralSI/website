import { AlertTriangle } from "lucide-react";

import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import { toTitleCaseName } from "@/lib/text";
import type { AtRiskStudent } from "@/services/monitoring.service";
import { InactiveDaysText, MonitoringListCard, MonitoringListRow } from "./MonitoringListCard";

interface AtRiskStudentsCardProps {
  students: AtRiskStudent[] | undefined;
  isLoading: boolean;
}

/** "Mahasiswa Berisiko": running theses without activity for more than 120 days. */
export function AtRiskStudentsCard({ students, isLoading }: AtRiskStudentsCardProps) {
  const rows = students ?? [];

  return (
    <MonitoringListCard
      icon={AlertTriangle}
      iconClassName="text-red-500"
      title="Mahasiswa Berisiko"
      description="Tanpa aktivitas lebih dari 120 hari"
      count={rows.length}
      isLoading={isLoading}
      emptyDescription="Tidak ada mahasiswa berisiko."
    >
      {rows.map((student) => (
        <MonitoringListRow
          key={student.thesisId}
          name={toTitleCaseName(student.student.name)}
          identityNumber={student.student.nim}
          secondary={student.title ? <span title={student.title}>{student.title}</span> : undefined}
          trailing={
            <>
              <ThesisActivityBadge level={student.activityLevel ?? "at_risk"} className="text-[11px]" />
              <InactiveDaysText days={student.daysSinceActivity} />
            </>
          }
        />
      ))}
    </MonitoringListCard>
  );
}
