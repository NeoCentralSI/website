import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Home, Mail } from 'lucide-react';
import { checkApprovedWithDeletedThesis } from '@/services/thesisChangeRequest.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Kadep contact info - TODO: fetch from backend if available
const KADEP_EMAIL = 'kadep.informatika@pnj.ac.id';

interface ChangeRequestApprovedAlertProps {
  className?: string;
}

/**
 * Alert component shown when student's change request has been approved
 * and thesis data has been deleted. Shows on all guidance tabs.
 */
export function ChangeRequestApprovedAlert({ className }: ChangeRequestApprovedAlertProps) {
  const navigate = useNavigate();

  const handleEmailKadep = () => {
    const subject = encodeURIComponent('Pendaftaran Ulang Tugas Akhir - Pergantian Topik/Pembimbing');
    const body = encodeURIComponent(
      `Yth. Ketua Departemen,\n\nSaya ingin mendaftar kembali tugas akhir setelah pengajuan pergantian topik/pembimbing saya disetujui.\n\nTerima kasih.`
    );
    window.open(`mailto:${KADEP_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className={`flex items-center justify-center min-h-[calc(100vh-200px)] p-4 ${className || ''}`}>
      <Card className="max-w-md w-full border-green-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-800">
            Pergantian Disetujui
          </CardTitle>
          <CardDescription className="text-base">
            Permintaan pergantian topik/pembimbing Anda telah disetujui oleh Ketua Departemen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Langkah selanjutnya:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">1.</span>
                <span>Hubungi Ketua Departemen untuk pendaftaran ulang</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">2.</span>
                <span>Daftar tugas akhir dengan topik/pembimbing baru</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">3.</span>
                <span>Pastikan memenuhi persyaratan yang diperlukan</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Kembali ke Home
            </Button>
            <Button
              variant="default"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={handleEmailKadep}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Kadep
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Silakan hubungi Ketua Departemen untuk proses pendaftaran ulang tugas akhir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to check if student has an approved change request where thesis was deleted
 */
export function useHasApprovedChangeRequest(enabled: boolean = true) {
  const { data: hasApprovedRequest = false, isLoading } = useQuery({
    queryKey: ['check-approved-change-request'],
    queryFn: checkApprovedWithDeletedThesis,
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  return { hasApprovedRequest, isLoading };
}
