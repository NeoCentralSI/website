import { CheckCircle2, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { toTitleCaseName } from "@/lib/text";
import type { ReadyToRegisterStudent, ThesisEventKind } from "@/services/monitoring.service";
import { MonitoringListCard, MonitoringListRow } from "./MonitoringListCard";
import { THESIS_EVENT_COPY } from "./thesis-event-copy";

interface ReadyToRegisterCardProps {
  kind: ThesisEventKind;
  students: ReadyToRegisterStudent[] | undefined;
  isLoading: boolean;
}

/**
 * "Siap Mendaftar": theses whose supervisors have all approved readiness for the seminar or
 * the defence and that have no registration yet.
 */
export function ReadyToRegisterCard({ kind, students, isLoading }: ReadyToRegisterCardProps) {
  const rows = students ?? [];
  const copy = THESIS_EVENT_COPY[kind];

  return (
    <MonitoringListCard
      icon={GraduationCap}
      iconClassName="text-amber-500"
      title="Siap Mendaftar"
      description={`Semua pembimbing sudah menyetujui kesiapan ${copy.noun}, tetapi mahasiswa belum mendaftar`}
      count={rows.length}
      isLoading={isLoading}
      emptyDescription={`Belum ada mahasiswa yang siap mendaftar ${copy.noun}.`}
    >
      {rows.map((student) => (
        <MonitoringListRow
          key={student.thesisId}
          name={toTitleCaseName(student.student.name)}
          identityNumber={student.student.nim}
          secondary={student.title ? <span title={student.title}>{student.title}</span> : undefined}
          trailing={
            <Badge className="whitespace-nowrap bg-amber-100 text-amber-800 hover:bg-amber-100">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {copy.readyBadge}
            </Badge>
          }
        />
      ))}
    </MonitoringListCard>
  );
}
