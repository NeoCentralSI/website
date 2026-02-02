import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Home, Mail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getMyChangeRequests } from '@/services/thesisChangeRequest.service';
import { formatDateId, toTitleCaseName } from '@/lib/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Kadep contact info - TODO: fetch from backend if available
const KADEP_EMAIL = 'kadep.informatika@pnj.ac.id';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  topic: 'Ganti Topik',
  supervisor: 'Ganti Dosen Pembimbing',
  both: 'Ganti Topik & Dosen Pembimbing',
};

const STATUS_CONFIG = {
  pending: {
    label: 'Menunggu Persetujuan',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  approved: {
    label: 'Disetujui',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Ditolak',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
};

interface ThesisPendingChangeAlertProps {
  className?: string;
}

/**
 * Alert component shown when student has pending change request (topic/supervisor change)
 * Shows status of the change request and next steps.
 */
export function ThesisPendingChangeAlert({ className }: ThesisPendingChangeAlertProps) {
  const navigate = useNavigate();
  const { data: requests } = useQuery({
    queryKey: ['my-change-requests'],
    queryFn: getMyChangeRequests,
    staleTime: 5 * 60 * 1000,
  });

  // Get the latest pending request (should only be one at a time)
  const pendingRequest = requests?.find((r) => r.status === 'pending');
  
  if (!pendingRequest) return null;

  const statusConfig = STATUS_CONFIG[pendingRequest.status];
  const StatusIcon = statusConfig.icon;

  const handleEmailKadep = () => {
    const subject = encodeURIComponent(`Pertanyaan Pengajuan ${REQUEST_TYPE_LABELS[pendingRequest.requestType]}`);
    const body = encodeURIComponent(
      `Yth. Ketua Departemen,\n\nSaya ingin menanyakan status pengajuan ${REQUEST_TYPE_LABELS[pendingRequest.requestType].toLowerCase()} saya.\n\nTerima kasih.`
    );
    window.open(`mailto:${KADEP_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  // Get approval status summary
  const approvals = pendingRequest.approvals || [];
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const totalApprovals = approvals.length;

  return (
    <div className={`flex items-center justify-center min-h-[calc(100vh-200px)] p-4 ${className || ''}`}>
      <Card className="max-w-md w-full border-yellow-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl text-yellow-800">
            Pengajuan {REQUEST_TYPE_LABELS[pendingRequest.requestType]}
          </CardTitle>
          <CardDescription className="text-base">
            Pengajuan Anda sedang dalam proses review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge className={`${statusConfig.color} gap-1`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Request Details */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipe Pengajuan:</span>
              <span className="font-medium">{REQUEST_TYPE_LABELS[pendingRequest.requestType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diajukan:</span>
              <span className="font-medium">{formatDateId(pendingRequest.createdAt)}</span>
            </div>
            {totalApprovals > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Persetujuan:</span>
                <span className="font-medium">{approvedCount} / {totalApprovals} dosen</span>
              </div>
            )}
          </div>

          {/* Approval Progress */}
          {approvals.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status Persetujuan Dosen:</p>
              <div className="space-y-1.5">
                {approvals.map((approval) => {
                  const approvalStatus = STATUS_CONFIG[approval.status];
                  const ApprovalIcon = approvalStatus.icon;
                  return (
                    <div key={approval.id} className="flex items-center justify-between text-sm">
                      <span>{toTitleCaseName(approval.lecturer.user.fullName)}</span>
                      <Badge variant="outline" className={`${approvalStatus.color} gap-1 text-xs`}>
                        <ApprovalIcon className="h-3 w-3" />
                        {approvalStatus.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reason */}
          {pendingRequest.reason && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Alasan Pengajuan:</p>
              <p className="text-sm bg-muted/50 rounded p-2">{pendingRequest.reason}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">
              Pengajuan Anda akan diproses setelah mendapat persetujuan dari semua dosen pembimbing dan Ketua Departemen.
            </p>
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
            Hubungi Ketua Departemen jika ada pertanyaan mengenai pengajuan Anda.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to check if student has pending change request
 */
export function useHasPendingChangeRequest() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-change-requests'],
    queryFn: getMyChangeRequests,
    staleTime: 5 * 60 * 1000,
  });

  const pendingRequest = data?.find((r) => r.status === 'pending');

  return { 
    hasPendingRequest: !!pendingRequest,
    pendingRequest,
    isLoading 
  };
}
