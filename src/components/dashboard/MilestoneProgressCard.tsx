
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getStudentProgressDetail } from '@/services/studentGuidance.service';
import { getMilestones } from '@/services/milestone.service';
import EmptyState from '@/components/ui/empty-state';

interface MilestoneProgressCardProps {
  className?: string;
}

export function MilestoneProgressCard({ className }: MilestoneProgressCardProps) {
  // 1. Fetch Thesis ID first
  const { data: thesisData, isLoading: isThesisLoading } = useQuery({
    queryKey: ['student-progress-detail'],
    queryFn: getStudentProgressDetail,
  });

  const thesisId = thesisData?.thesisId;

  // 2. Fetch Milestones & Progress if thesisId exists
  const { data: milestoneData, isLoading: isMilestoneLoading } = useQuery({
    queryKey: ['milestones', thesisId],
    queryFn: () => getMilestones(thesisId!),
    enabled: !!thesisId,
  });

  const progress = milestoneData?.progress;
  const milestones = milestoneData?.milestones;

  // Filter next active milestones (not completed)
  const nextMilestones = milestones
    ?.filter(m => m.status !== 'completed')
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const isLoading = isThesisLoading || (!!thesisId && isMilestoneLoading);

  if (isLoading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle>Milestone Tugas Akhir</CardTitle>
          <CardDescription>Progress pengerjaan tugas akhir</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!thesisId) {
    return (
       <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle>Milestone Tugas Akhir</CardTitle>
          <CardDescription>Progress pengerjaan tugas akhir</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center min-h-[200px]">
          <EmptyState
            title="Belum ada Tugas Akhir"
            description="Anda belum terdaftar dalam tugas akhir apapun."
            size="sm"
            className="py-0"
          />
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return null; // Should not happen if thesisId exists but better safe
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Milestone Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pb-6 min-h-0 flex flex-col justify-center">
        <div className="flex flex-col items-center justify-center gap-5">
          
          {/* Circular Progress */}
          <div className="relative flex items-center justify-center w-28 h-28">
             <CircularProgress percentage={progress.percentComplete} />
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold text-primary">{Math.round(progress.percentComplete)}%</span>
                <span className="text-xs text-muted-foreground">Total</span>
             </div>
          </div>
          
          {/* Ongoing Indicator */}
          <div className="w-full space-y-3">
             {nextMilestones && nextMilestones.length > 0 ? (
                <div className="space-y-2">
                   <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate pr-2 max-w-[200px]" title={nextMilestones[0].title}>
                        {nextMilestones[0].title}
                      </span>
                      <Badge variant="secondary" className="text-[10px] h-5">
                         Proses
                      </Badge>
                   </div>
                   {/* Indikator horizontal "ongoing" - using indeterminate or fixed for visual */}
                   <Progress value={35} className="h-2" />
                   <p className="text-xs text-muted-foreground text-right w-full">Sedang dikerjakan</p>
                </div>
             ) : (
                <div className="text-center py-2 bg-green-50 rounded-md border border-green-100">
                  <p className="text-sm font-medium text-green-700">Semua Milestone Selesai</p>
                </div>
             )}
          </div>

          <Button variant="ghost" className="w-full text-xs" asChild>
            <Link to="/tugas-akhir/bimbingan/milestone">
              Lihat Detail <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>

        </div>
      </CardContent>
    </Card>
  );
}

function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 50;
  const stroke = 6;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="w-full h-full">
      <svg
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        className="w-full h-full -rotate-90"
      >
        <circle
          className="stroke-muted/30"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className="stroke-primary transition-all duration-1000 ease-out"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
    </div>
  );
}

