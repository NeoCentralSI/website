import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, XCircle } from 'lucide-react';
import { checkThesisDeletionNotification } from '@/services/notification.service';
import { formatDateId } from '@/lib/text';

interface ThesisDeletedAlertProps {
  className?: string;
}

/**
 * Alert component shown when student's thesis has been deleted (e.g., due to FAILED status)
 * Shows on all thesis tabs when student has no thesis but has a deletion notification.
 */
export function ThesisDeletedAlert({ className }: ThesisDeletedAlertProps) {
  const { data } = useQuery({
    queryKey: ['check-thesis-deleted'],
    queryFn: checkThesisDeletionNotification,
    staleTime: 5 * 60 * 1000,
  });

  const notification = data?.data?.notification;
  const isFailedDeletion = notification?.title?.includes('Batas Waktu Terlampaui');

  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-6 ${className || ''}`}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-red-800">
            {isFailedDeletion 
              ? 'Tugas Akhir Dihapus (Batas Waktu Terlampaui)'
              : 'Tugas Akhir Anda Telah Dihapus'
            }
          </h3>
          <p className="text-red-700">
            {notification?.message || 'Data tugas akhir Anda telah dihapus oleh administrator.'}
          </p>
          {notification?.createdAt && (
            <p className="text-sm text-red-600">
              Dihapus pada: {formatDateId(notification.createdAt)}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 max-w-md">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 text-left">
            <p className="font-medium">Langkah Selanjutnya:</p>
            <p>
              Silakan daftar kembali tugas akhir dengan memilih topik baru melalui Departemen.
              {isFailedDeletion && (
                <> Pastikan untuk menyelesaikan tugas akhir dalam batas waktu yang ditentukan.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if student has a thesis deletion notification
 */
export function useHasThesisDeleted() {
  const { data, isLoading } = useQuery({
    queryKey: ['check-thesis-deleted'],
    queryFn: checkThesisDeletionNotification,
    staleTime: 5 * 60 * 1000,
  });

  return { 
    hasDeletedThesis: data?.data?.hasDeletedThesis ?? false, 
    isLoading 
  };
}
