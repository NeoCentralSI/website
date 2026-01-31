import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import type { ReadyForSeminarStudent } from "@/services/monitoring.service";
import Lottie from "lottie-react";
import emptyAnimation from "@/assets/lottie/empty.json";

interface ReadyForSeminarCardProps {
  students: ReadyForSeminarStudent[] | undefined;
  isLoading: boolean;
  showViewAll?: boolean;
}

export function ReadyForSeminarCard({ students, isLoading, showViewAll = true }: ReadyForSeminarCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-amber-500" />
            Siap Seminar
          </CardTitle>
          <CardDescription>Mahasiswa yang siap mengikuti seminar</CardDescription>
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

  const displayStudents = students?.slice(0, 3) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-amber-500" />
              Siap Seminar
            </CardTitle>
            <CardDescription>Mahasiswa yang siap mengikuti seminar</CardDescription>
          </div>
          {showViewAll && students && students.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/monitoring/ready-seminar")}
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
            <p className="text-sm text-muted-foreground mt-2">Belum ada mahasiswa siap seminar</p>
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
                  <Badge className="bg-amber-100 text-amber-800 whitespace-nowrap">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Acc Seminar
                  </Badge>
                  {student.approvedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDateId(student.approvedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
