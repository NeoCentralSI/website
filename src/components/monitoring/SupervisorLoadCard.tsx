import { useState } from "react";
import { Eye, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRoleName, toTitleCaseName } from "@/lib/text";
import type { SupervisorLoad } from "@/services/monitoring.service";
import { MonitoringListCard, MonitoringListRow } from "./MonitoringListCard";

interface SupervisorLoadCardProps {
  loads: SupervisorLoad[] | undefined;
  isLoading: boolean;
}

/** "Beban Bimbingan": active supervised students per lecturer, with the list behind the eye. */
export function SupervisorLoadCard({ loads, isLoading }: SupervisorLoadCardProps) {
  const [selectedLoad, setSelectedLoad] = useState<SupervisorLoad | null>(null);
  const rows = loads ?? [];

  return (
    <>
      <MonitoringListCard
        icon={Users}
        iconClassName="text-sky-500"
        title="Beban Bimbingan"
        description="Jumlah mahasiswa bimbingan aktif per dosen"
        count={rows.length}
        isLoading={isLoading}
        emptyDescription="Belum ada data beban bimbingan."
      >
        {rows.map((load) => (
          <MonitoringListRow
            key={load.lecturerId}
            name={toTitleCaseName(load.lecturerName)}
            identityNumber={load.lecturerNip}
            trailing={
              <div className="flex items-center gap-1">
                <Badge className="whitespace-nowrap bg-sky-100 text-sky-800 hover:bg-sky-100">
                  {load.studentCount} mahasiswa
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedLoad(load)}
                  aria-label={`Lihat mahasiswa bimbingan ${load.lecturerName}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            }
          />
        ))}
      </MonitoringListCard>

      <Dialog open={!!selectedLoad} onOpenChange={(open) => !open && setSelectedLoad(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedLoad ? toTitleCaseName(selectedLoad.lecturerName) : "Mahasiswa Bimbingan"}</DialogTitle>
            <DialogDescription>
              {selectedLoad?.studentCount ?? 0} mahasiswa bimbingan aktif
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              {selectedLoad?.students.map((student) => (
                <div key={student.thesisId} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium [overflow-wrap:anywhere]">{toTitleCaseName(student.name)}</p>
                      <p className="text-sm text-muted-foreground">{student.nim}</p>
                    </div>
                    {student.role && (
                      <Badge variant="outline" className="whitespace-nowrap">
                        {formatRoleName(student.role)}
                      </Badge>
                    )}
                  </div>
                  {student.thesisTitle && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {student.thesisTitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
