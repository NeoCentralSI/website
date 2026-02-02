import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { XCircle, Home, Mail } from 'lucide-react';
import { checkThesisDeletionNotification } from '@/services/notification.service';
import { formatDateId } from '@/lib/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Kadep contact info - TODO: fetch from backend if available
const KADEP_EMAIL = 'kadep.informatika@pnj.ac.id';

interface ThesisDeletedAlertProps {
  className?: string;
}

/**
 * Alert component shown when student's thesis has been deleted (e.g., due to FAILED status)
 * Shows on all thesis tabs when student has no thesis but has a deletion notification.
 */
export function ThesisDeletedAlert({ className }: ThesisDeletedAlertProps) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['check-thesis-deleted'],
    queryFn: checkThesisDeletionNotification,
    staleTime: 5 * 60 * 1000,
  });

  const notification = data?.data?.notification;
  const isFailedDeletion = notification?.title?.includes('Batas Waktu Terlampaui');

  const handleEmailKadep = () => {
    const subject = encodeURIComponent('Konsultasi Tugas Akhir - Pendaftaran Ulang');
    const body = encodeURIComponent(
      `Yth. Ketua Departemen,\n\nSaya ingin berkonsultasi mengenai pendaftaran ulang tugas akhir.\n\nTerima kasih.`
    );
    window.open(`mailto:${KADEP_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className={`flex items-center justify-center min-h-[calc(100vh-200px)] p-4 ${className || ''}`}>
      <Card className="max-w-md w-full border-red-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-800">
            {isFailedDeletion 
              ? 'Tugas Akhir Dihapus'
              : 'Tugas Akhir Telah Dihapus'
            }
          </CardTitle>
          <CardDescription className="text-base text-red-700">
            {notification?.message || 'Data tugas akhir Anda telah dihapus oleh administrator.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notification?.createdAt && (
            <p className="text-sm text-center text-muted-foreground">
              Dihapus pada: {formatDateId(notification.createdAt)}
            </p>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Langkah selanjutnya:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">1.</span>
                <span>Hubungi Ketua Departemen untuk konsultasi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">2.</span>
                <span>Daftar kembali tugas akhir dengan memilih topik baru</span>
              </li>
              {isFailedDeletion && (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">3.</span>
                  <span>Pastikan menyelesaikan dalam batas waktu yang ditentukan</span>
                </li>
              )}
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
            Silakan hubungi Ketua Departemen jika membutuhkan bantuan lebih lanjut.
          </p>
        </CardContent>
      </Card>
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
