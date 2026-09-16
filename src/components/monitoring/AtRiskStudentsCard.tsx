import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toTitleCaseName } from "@/lib/text";
import type { AtRiskStudent } from "@/services/monitoring.service";

interface AtRiskStudentsCardProps {
  students: AtRiskStudent[] | undefined;
  isLoading: boolean;
  showViewAll?: boolean;
}

export function AtRiskStudentsCard({ students, isLoading, showViewAll = true }: AtRiskStudentsCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Mahasiswa Berisiko
          </CardTitle>
          <CardDescription>Tidak ada aktivitas lebih dari 4 bulan</CardDescription>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <Loading text="Memuat mahasiswa berisiko..." />
        </CardContent>
      </Card>
    );
  }

  const displayStudents = students?.slice(0, 5) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Mahasiswa Berisiko
            </CardTitle>
            <CardDescription>Tidak ada aktivitas lebih dari 4 bulan</CardDescription>
          </div>
          {showViewAll && students && students.length > 5 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/tugas-akhir/monitoring?rating=AT_RISK")}
            >
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        {displayStudents.length === 0 ? (
          <EmptyState
            size="sm"
            title="Tidak ada mahasiswa berisiko"
            description="Semua mahasiswa memiliki aktivitas bimbingan yang memadai."
          />
        ) : (
          <div className="space-y-3 pr-2">
            {displayStudents.map((student) => (
              <div
                key={student.thesisId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {toTitleCaseName(student.student.name)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {student.student.nim}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {student.title}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <Badge variant="destructive" className="whitespace-nowrap">
                    <Clock className="h-3 w-3 mr-1" />
                    {student.daysSinceActivity} hari
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {student.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
