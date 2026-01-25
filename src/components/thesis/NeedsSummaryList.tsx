import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Edit3, AlertCircle, Target, ArrowRight } from "lucide-react";
import { getGuidancesNeedingSummary, type GuidanceNeedingSummary } from "@/services/studentGuidance.service";
import { toTitleCaseName } from "@/lib/text";

export default function NeedsSummaryList() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["needs-summary"],
    queryFn: getGuidancesNeedingSummary,
  });

  // Don't show loading state to avoid multiple spinners on page
  // This is an optional component that shows pending summaries
  if (isLoading || error) {
    return null;
  }

  const guidances = data?.guidances || [];

  if (guidances.length === 0) {
    return null; // Don't show anything if no pending summaries
  }

  return (
    <>
      <Alert variant="default" className="border-amber-200 bg-amber-50/80 [&>svg]:text-amber-600">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-amber-800 font-semibold">
          Bimbingan Perlu Diisi Catatan
          <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 hover:bg-amber-100">
            {guidances.length}
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-3">
          <p className="text-amber-700 text-sm mb-3">
            Lengkapi catatan bimbingan berikut agar dosen dapat melakukan approval.
          </p>
          <div className="space-y-2">
            {guidances.map((guidance: GuidanceNeedingSummary, index: number) => (
              <div key={guidance.id}>
                {index > 0 && <Separator className="my-2" />}
                <div className="flex items-start justify-between p-3 rounded-lg border bg-white/80 shadow-sm">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-sm text-foreground">
                          {guidance.approvedDateFormatted || "-"}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                        {guidance.type || "online"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>{toTitleCaseName(guidance.supervisorName || "-")}</span>
                    </div>
                    {guidance.milestoneName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-3.5 w-3.5" />
                        <span>{guidance.milestoneName}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/tugas-akhir/bimbingan/student/session/${guidance.id}`)}
                    className="shrink-0"
                  >
                    <Edit3 className="h-4 w-4 mr-1.5" />
                    Isi Catatan
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </>
  );
}
