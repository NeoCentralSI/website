import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loading } from "@/components/ui/spinner";
import { ProposalVersionHistory } from "@/components/thesis/ProposalVersionHistory";
import { getStudentSupervisors } from "@/services/studentGuidance.service";
import { AlertCircle } from "lucide-react";

interface MetopenProposalTabProps {
  readOnly: boolean;
}

export function MetopenProposalTab({ readOnly }: MetopenProposalTabProps) {
  const { data: supervisorsData, isLoading } = useQuery({
    queryKey: ["student-supervisors"],
    queryFn: getStudentSupervisors,
  });

  const thesisId = supervisorsData?.thesisId ?? null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Memuat data proposal..." />
      </div>
    );
  }

  if (!thesisId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Proposal belum tersedia</AlertTitle>
        <AlertDescription>
          Proposal final memerlukan tugas akhir aktif dengan pembimbing resmi. Lengkapi pengajuan
          pembimbing di tab Cari Pembimbing atau Overview terlebih dahulu.
        </AlertDescription>
      </Alert>
    );
  }

  return <ProposalVersionHistory thesisId={thesisId} readOnly={readOnly} />;
}
