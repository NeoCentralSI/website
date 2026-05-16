import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Users, UserRoundCheck } from "lucide-react";
import { toTitleCaseName } from "@/lib/text";
import type { SupervisorLoad } from "@/services/monitoring.service";

interface SupervisorLoadCardProps {
  loads: SupervisorLoad[] | undefined;
  isLoading: boolean;
}

export function SupervisorLoadCard({ loads, isLoading }: SupervisorLoadCardProps) {
  const [selectedLoad, setSelectedLoad] = useState<SupervisorLoad | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-500" />
            Beban Bimbingan
          </CardTitle>
          <CardDescription>Jumlah mahasiswa bimbingan per dosen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayLoads = loads?.slice(0, 8) ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-500" />
            Beban Bimbingan
          </CardTitle>
          <CardDescription>Jumlah mahasiswa bimbingan per dosen</CardDescription>
        </CardHeader>
        <CardContent className="max-h-80 overflow-y-auto">
          {displayLoads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <UserRoundCheck className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada data beban bimbingan</p>
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {displayLoads.map((load) => (
                <div
                  key={load.lecturerId}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{toTitleCaseName(load.lecturerName)}</p>
                    <p className="text-sm text-muted-foreground">{load.lecturerNip || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="whitespace-nowrap bg-sky-100 text-sky-800">
                      {load.studentCount} mhs
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                      <p className="font-medium">{toTitleCaseName(student.name)}</p>
                      <p className="text-sm text-muted-foreground">{student.nim}</p>
                    </div>
                    {student.role && (
                      <Badge variant="outline" className="whitespace-nowrap">
                        {student.role}
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
