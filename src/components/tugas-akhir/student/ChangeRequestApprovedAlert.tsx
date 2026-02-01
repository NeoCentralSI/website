import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { checkApprovedWithDeletedThesis } from '@/services/thesisChangeRequest.service';

interface ChangeRequestApprovedAlertProps {
  className?: string;
}

/**
 * Alert component shown when student's change request has been approved
 * and thesis data has been deleted. Shows on all guidance tabs.
 */
export function ChangeRequestApprovedAlert({ className }: ChangeRequestApprovedAlertProps) {
  return (
    <div className={`rounded-lg border border-green-200 bg-green-50 p-6 ${className || ''}`}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <RefreshCw className="h-8 w-8 text-green-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-green-800">
            Permintaan Pergantian Disetujui
          </h3>
          <p className="text-green-700">
            Permintaan pergantian topik/pembimbing Anda telah disetujui.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 max-w-md">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 text-left">
            <p className="font-medium">Langkah Selanjutnya:</p>
            <p>
              Data tugas akhir Anda sebelumnya telah dihapus. Silakan daftar kembali 
              tugas akhir dengan topik/pembimbing baru melalui Departemen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if student has an approved change request where thesis was deleted
 */
export function useHasApprovedChangeRequest() {
  const { data: hasApprovedRequest = false, isLoading } = useQuery({
    queryKey: ['check-approved-change-request'],
    queryFn: checkApprovedWithDeletedThesis,
    staleTime: 5 * 60 * 1000,
  });

  return { hasApprovedRequest, isLoading };
}
