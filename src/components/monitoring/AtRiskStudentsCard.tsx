import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toTitleCaseName } from "@/lib/text";
import type { AtRiskStudent } from "@/services/monitoring.service";
import Lottie from "lottie-react";
import emptyAnimation from "@/assets/lottie/empty.json";

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
          <CardDescription>Tidak ada aktivitas lebih dari 2 bulan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
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
            <CardDescription>Tidak ada aktivitas lebih dari 2 bulan</CardDescription>
          </div>
          {showViewAll && students && students.length > 5 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/monitoring/at-risk")}
            >
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        {displayStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Lottie 
              animationData={emptyAnimation} 
              loop 
              className="w-24 h-24 opacity-70" 
            />
            <p className="text-sm text-muted-foreground mt-2">Tidak ada mahasiswa berisiko</p>
          </div>
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
