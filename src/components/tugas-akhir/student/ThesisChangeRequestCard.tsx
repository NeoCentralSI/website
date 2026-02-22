import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw, Users } from 'lucide-react';
import {
  submitChangeRequest,
  getMyChangeRequests,
  type SubmitChangeRequestDto,
} from '@/services/thesisChangeRequest.service';
import { getTopics } from '@/services/topic.service';
import { formatDateId, toTitleCaseName } from '@/lib/text';



const STATUS_CONFIG = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Ditolak', color: 'bg-red-500 text-white', icon: XCircle },
};

const APPROVAL_STATUS_CONFIG = {
  pending: { label: 'Menunggu', icon: Clock, color: 'text-yellow-600' },
  approved: { label: 'Disetujui', icon: CheckCircle, color: 'text-green-600' },
  rejected: { label: 'Ditolak', icon: XCircle, color: 'text-red-600' },
};

interface ThesisChangeRequestCardProps {
  thesisId: string;
  className?: string;
}

export function ThesisChangeRequestCard({ thesisId, className }: ThesisChangeRequestCardProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [requestType] = useState<'topic' | 'supervisor' | 'both'>('topic');
  const [reason, setReason] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTopicId, setNewTopicId] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-change-requests', thesisId],
    queryFn: getMyChangeRequests,
    enabled: !!thesisId,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['thesis-topics'],
    queryFn: getTopics,
    enabled: showForm,
  });

  const submitMutation = useMutation({
    mutationFn: (data: SubmitChangeRequestDto) => submitChangeRequest(data),
    onSuccess: () => {
      toast.success('Permintaan pergantian berhasil diajukan');
      queryClient.invalidateQueries({ queryKey: ['my-change-requests'] });
      setShowForm(false);
      setReason('');
      setNewTitle('');
      setNewTopicId('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengajukan permintaan');
    },
  });

  const hasPendingRequest = requests.some((r) => r.status === 'pending');

  const handleSubmit = () => {
    if (reason.length < 20) {
      toast.error('Alasan minimal 20 karakter');
      return;
    }
    if (newTitle.length < 5) {
      toast.error('Judul baru minimal 5 karakter');
      return;
    }
    if (!newTopicId) {
      toast.error('Topik baru harus dipilih');
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSubmit = () => {
    submitMutation.mutate({ requestType, reason, newTitle, newTopicId });
    setShowConfirmDialog(false);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Pergantian Topik
          </CardTitle>
          <CardDescription>
            Ajukan permintaan pergantian topik tugas akhir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Perhatian!</p>
              <p>
                Jika permintaan disetujui, <strong>tugas akhir lama akan dibatalkan</strong> dan
                tugas akhir baru akan otomatis dibuat dengan topik dan judul yang Anda pilih.
              </p>
            </div>
          </div>

          {/* History */}
          {requests.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Riwayat Permintaan</h4>
              <div className="space-y-2">
                {requests.map((request) => {
                  const status = STATUS_CONFIG[request.status];
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={request.id}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Pergantian Topik</span>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs mb-1">
                        Diajukan: {formatDateId(request.createdAt)}
                      </p>
                      <p className="text-muted-foreground line-clamp-2">{request.reason}</p>

                      {/* Approval tracking for each request */}
                      {request.approvals && request.approvals.length > 0 && (
                        <div className="mt-2 rounded border bg-muted/30 p-2">
                          <p className="text-xs font-medium mb-1 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Status Pembimbing:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {request.approvals.map((approval) => {
                              const config = APPROVAL_STATUS_CONFIG[approval.status];
                              const ApprovalIcon = config.icon;
                              return (
                                <div key={approval.id} className="flex items-center gap-1 text-xs">
                                  <ApprovalIcon className={`h-3 w-3 ${config.color}`} />
                                  <span>{toTitleCaseName(approval.lecturer?.user?.fullName || '')}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {request.status === 'rejected' && request.reviewNotes && (
                        <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                          <strong>Alasan Penolakan:</strong> {request.reviewNotes}
                        </div>
                      )}
                      {request.status === 'approved' && (
                        <div className="mt-2 rounded bg-green-50 p-2 text-xs text-green-700">
                          Permintaan disetujui. Tugas akhir baru Anda telah aktif.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form */}
          {!hasPendingRequest && (
            <>
              {!showForm ? (
                <Button onClick={() => setShowForm(true)} className="w-full">
                  Ajukan Permintaan Pergantian
                </Button>
              ) : (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-3">
                    <Label>Jenis Pergantian</Label>
                    <div className="flex items-start space-x-3 p-3 border rounded-md bg-muted/50">
                      <div className="grid gap-0.5">
                        <Label className="font-medium">
                          Pergantian Topik
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Ganti topik penelitian dengan tetap mempertahankan pembimbing (memulai ulang proses tugas akhir).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* New Title Input */}
                  <div className="space-y-2">
                    <Label htmlFor="newTitle">Judul Baru (min. 5 karakter)</Label>
                    <Input
                      id="newTitle"
                      placeholder="Masukkan judul tugas akhir baru..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {newTitle.length}/500 karakter
                    </p>
                  </div>

                  {/* Topic Select */}
                  <div className="space-y-2">
                    <Label>Topik Baru</Label>
                    <Select value={newTopicId} onValueChange={setNewTopicId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih topik baru..." />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reason Textarea */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Alasan Pergantian (min. 20 karakter)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Jelaskan alasan Anda mengajukan pergantian..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="min-h-24"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {reason.length}/1000 karakter
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setReason('');
                        setNewTitle('');
                        setNewTopicId('');
                      }}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={reason.length < 20 || newTitle.length < 5 || !newTopicId || submitMutation.isPending}
                      className="flex-1"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Mengajukan...
                        </>
                      ) : (
                        'Ajukan Permintaan'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {hasPendingRequest && (
            <div className="space-y-3">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
                <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-800">
                  Permintaan Anda sedang menunggu persetujuan.
                </p>
              </div>

              {/* Approval Tracking for pending request */}
              {(() => {
                const pendingRequest = requests.find(r => r.status === 'pending');
                if (!pendingRequest?.approvals?.length) return null;

                const allApproved = pendingRequest.approvals.every(a => a.status === 'approved');

                return (
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Status Persetujuan
                    </p>
                    <div className="space-y-2">
                      {pendingRequest.approvals.map((approval) => {
                        const config = APPROVAL_STATUS_CONFIG[approval.status];
                        const ApprovalIcon = config.icon;
                        return (
                          <div key={approval.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <ApprovalIcon className={`h-4 w-4 ${config.color}`} />
                              <span>{toTitleCaseName(approval.lecturer?.user?.fullName || '')}</span>
                            </div>
                            <Badge variant={approval.status === 'approved' ? 'default' : approval.status === 'rejected' ? 'destructive' : 'outline'} className="text-xs">
                              {config.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    {allApproved && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md text-blue-800 text-xs flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Semua pembimbing telah menyetujui. Menunggu persetujuan Ketua Departemen.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pengajuan</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Anda akan mengajukan permintaan <strong>Pergantian Topik</strong>.</p>
              <p className="text-sm">
                <strong>Judul baru:</strong> {newTitle}
              </p>
              <p className="text-sm">
                <strong>Topik baru:</strong> {topics.find(t => t.id === newTopicId)?.name || '-'}
              </p>
              <p className="text-amber-600">
                ⚠️ Jika disetujui, tugas akhir lama akan dibatalkan dan tugas akhir baru akan otomatis dibuat.
              </p>
              <p>Apakah Anda yakin ingin melanjutkan?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Ya, Ajukan Permintaan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
