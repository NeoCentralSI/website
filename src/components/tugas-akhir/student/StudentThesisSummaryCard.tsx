import type { ReactNode } from "react";
import { BookOpen, GraduationCap, Mail, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThesisStatusBadge } from "@/components/shared/ThesisStatusBadge";
import { formatRoleName, formatLecturerName } from "@/lib/text";
import type { MyThesisDetail } from "@/services/studentGuidance.service";

type Supervisor = MyThesisDetail["supervisors"][number];

/** Pembimbing 1 first, then the others by role name. */
function bySupervisorRole(a: Supervisor, b: Supervisor) {
  const key = (role: string | null) => (role ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return key(a.role).localeCompare(key(b.role));
}

export interface StudentThesisSummaryCardProps {
  thesis: MyThesisDetail;
  /** "Ajukan Perubahan" in the card header, and its reason under the header. */
  headerAction?: ReactNode;
  headerNote?: ReactNode;
  /** "Riwayat perubahan judul (N)" under the title and topic. */
  titleExtras?: ReactNode;
  /** "Riwayat pembimbing (N)" under the supervisors. */
  supervisorExtras?: ReactNode;
  /** The running change request as one status line, and "Riwayat evaluasi (N)". */
  footer?: ReactNode;
}

/** "Informasi Tugas Akhir": title, topic, status badge, and every supervisor with their role. */
export function StudentThesisSummaryCard({ thesis, headerAction, headerNote, titleExtras, supervisorExtras, footer }: StudentThesisSummaryCardProps) {
  const supervisors = [...thesis.supervisors].sort(bySupervisorRole);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Informasi Tugas Akhir</CardTitle>
              <CardDescription>Judul, topik, status, dan pembimbing</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThesisStatusBadge status={thesis.status} onLeave={thesis.supervisionClock?.isPaused} />
            {headerAction}
          </div>
        </div>
        {headerNote}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-relaxed [overflow-wrap:anywhere]">
            {thesis.title || "Judul belum diatur"}
          </h3>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4 shrink-0" />
            <span>Topik: <span className="font-medium text-foreground">{thesis.topic?.name ?? "Belum dipilih"}</span></span>
          </p>
          {titleExtras}
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <GraduationCap className="h-4 w-4" /> Dosen Pembimbing
          </p>
          {supervisors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pembimbing.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {supervisors.map((supervisor) => (
                <li key={supervisor.id} className="space-y-1.5 rounded-lg border p-3">
                  <Badge variant="outline" className="text-xs">{formatRoleName(supervisor.role)}</Badge>
                  <p className="text-sm font-medium leading-tight">{formatLecturerName(supervisor.name) || "-"}</p>
                  {supervisor.email && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate" title={supervisor.email}>{supervisor.email}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {supervisorExtras}
        </div>

        {footer && (
          <>
            <Separator />
            <div className="space-y-2">{footer}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
