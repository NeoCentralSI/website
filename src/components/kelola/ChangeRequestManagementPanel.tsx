import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner, Loading } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Check, X, Eye, Clock, CheckCircle, XCircle, AlertTriangle, Users } from 'lucide-react';
import {
  getPendingChangeRequests,
  getAllChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
  type ThesisChangeRequest,
} from '@/services/thesisChangeRequest.service';
import { toTitleCaseName, formatDateId, formatRoleName } from '@/lib/text';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  topic: 'Pergantian Topik',
  supervisor: 'Pergantian Pembimbing',
  both: 'Pergantian Topik & Pembimbing',
};

const STATUS_CONFIG = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const APPROVAL_STATUS_CONFIG = {
  pending: { label: 'Menunggu', variant: 'outline' as const, icon: Clock },
  approved: { label: 'Setuju', variant: 'default' as const, icon: CheckCircle },
  rejected: { label: 'Tolak', variant: 'destructive' as const, icon: XCircle },
};

type ViewMode = 'pending' | 'all';

export function ChangeRequestManagementPanel() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('pending');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedRequest, setSelectedRequest] = useState<ThesisChangeRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  const { data: pendingData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['change-requests-pending', page, search],
    queryFn: () => getPendingChangeRequests({ page, pageSize, search }),
    enabled: viewMode === 'pending',
  });

  const { data: allData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['change-requests-all', page, search, statusFilter],
    queryFn: () => getAllChangeRequests({ page, pageSize, search, status: statusFilter }),
    enabled: viewMode === 'all',
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveChangeRequest(id, { reviewNotes: approveNotes }),
    onSuccess: () => {
      toast.success('Permintaan berhasil disetujui. Data TA mahasiswa telah dihapus.');
      queryClient.invalidateQueries({ queryKey: ['change-requests-pending'] });
      queryClient.invalidateQueries({ queryKey: ['change-requests-all'] });
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setApproveNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyetujui permintaan');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectChangeRequest(id, { reviewNotes: rejectNotes }),
    onSuccess: () => {
      toast.success('Permintaan berhasil ditolak');
      queryClient.invalidateQueries({ queryKey: ['change-requests-pending'] });
      queryClient.invalidateQueries({ queryKey: ['change-requests-all'] });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menolak permintaan');
    },
  });

  const data = viewMode === 'pending' ? pendingData : allData;
  const isLoading = viewMode === 'pending' ? isLoadingPending : isLoadingAll;
  const requests = data?.data || [];
  const pagination = data?.pagination;

  const handleViewDetail = (request: ThesisChangeRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  const handleApprove = (request: ThesisChangeRequest) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleReject = (request: ThesisChangeRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate(selectedRequest.id);
    }
  };

  const confirmReject = () => {
    if (!rejectNotes || rejectNotes.length < 10) {
      toast.error('Alasan penolakan minimal 10 karakter');
      return;
    }
    if (selectedRequest) {
      rejectMutation.mutate(selectedRequest.id);
    }
  };

  const getSupervisors = (request: ThesisChangeRequest) => {
    return request.thesis?.thesisParticipants
      ?.filter((p) => p.role?.name?.toLowerCase().includes('pembimbing'))
      ?.map((p) => ({
        name: toTitleCaseName(p.lecturer?.user?.fullName || ''),
        role: formatRoleName(p.role?.name || ''),
      })) || [];
  };

  const getApprovalStatus = (request: ThesisChangeRequest) => {
    if (!request.approvals || request.approvals.length === 0) {
      return { allApproved: false, hasRejected: false, approvals: [] };
    }
    
    const allApproved = request.approvals.every((a) => a.status === 'approved');
    const hasRejected = request.approvals.some((a) => a.status === 'rejected');
    
    return { allApproved, hasRejected, approvals: request.approvals };
  };

  const canKadepApprove = (request: ThesisChangeRequest) => {
    const { allApproved } = getApprovalStatus(request);
    return allApproved;
  };

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" text="Memuat data permintaan..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('pending');
              setPage(1);
            }}
          >
            <Clock className="h-4 w-4 mr-1" />
            Menunggu Review
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('all');
              setPage(1);
            }}
          >
            Semua Riwayat
          </Button>
        </div>

        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama/NIM..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {viewMode === 'all' && (
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table */}
      {requests.length === 0 ? (
        <div className="rounded-lg border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">
            {viewMode === 'pending'
              ? 'Tidak ada permintaan yang menunggu review'
              : 'Tidak ada data permintaan'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Mahasiswa</TableHead>
                <TableHead className="w-40">Jenis Permintaan</TableHead>
                <TableHead className="w-48">Approval Pembimbing</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead className="w-28">Tanggal</TableHead>
                {viewMode === 'all' && <TableHead className="w-28">Status</TableHead>}
                <TableHead className="w-28 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const status = STATUS_CONFIG[request.status];
                const StatusIcon = status.icon;
                const { allApproved, hasRejected, approvals } = getApprovalStatus(request);
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {toTitleCaseName(request.thesis?.student?.user?.fullName || '')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.thesis?.student?.user?.identityNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {REQUEST_TYPE_LABELS[request.requestType] || request.requestType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {approvals.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {approvals.map((approval) => {
                            const approvalConfig = APPROVAL_STATUS_CONFIG[approval.status];
                            const ApprovalIcon = approvalConfig.icon;
                            return (
                              <div key={approval.id} className="flex items-center gap-1.5">
                                <ApprovalIcon className={`h-3.5 w-3.5 ${
                                  approval.status === 'approved' ? 'text-green-600' :
                                  approval.status === 'rejected' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`} />
                                <span className="text-xs">
                                  {toTitleCaseName(approval.lecturer?.user?.fullName || '')}
                                </span>
                              </div>
                            );
                          })}
                          {allApproved && (
                            <Badge variant="default" className="w-fit mt-1 text-[10px]">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Siap Approve Kadep
                            </Badge>
                          )}
                          {hasRejected && (
                            <Badge variant="destructive" className="w-fit mt-1 text-[10px]">
                              <XCircle className="h-3 w-3 mr-1" />
                              Ditolak Pembimbing
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2 text-sm">{request.reason}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateId(request.createdAt)}
                    </TableCell>
                    {viewMode === 'all' && (
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetail(request)}
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(request)}
                              className={`text-green-600 hover:text-green-700 hover:bg-green-50 ${
                                !canKadepApprove(request) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title={canKadepApprove(request) ? "Setujui" : "Menunggu approval pembimbing"}
                              disabled={!canKadepApprove(request)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReject(request)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Tolak"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {requests.length} dari {pagination.total} permintaan
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Permintaan Pergantian</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mahasiswa</p>
                  <p className="font-medium">
                    {toTitleCaseName(selectedRequest.thesis?.student?.user?.fullName || '')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRequest.thesis?.student?.user?.identityNumber}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jenis Permintaan</p>
                  <Badge variant="outline">
                    {REQUEST_TYPE_LABELS[selectedRequest.requestType]}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Topik Saat Ini</p>
                  <p className="font-medium">{selectedRequest.thesis?.thesisTopic?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Judul Saat Ini</p>
                  <p className="font-medium">{selectedRequest.thesis?.title || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Pembimbing Saat Ini</p>
                <div className="flex flex-wrap gap-2">
                  {getSupervisors(selectedRequest).map((sup, i) => (
                    <Badge key={i} variant="secondary">
                      {sup.role}: {sup.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Approval Status Tracking */}
              {selectedRequest.approvals && selectedRequest.approvals.length > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Status Approval Pembimbing
                  </p>
                  <div className="space-y-2">
                    {selectedRequest.approvals.map((approval) => {
                      const approvalConfig = APPROVAL_STATUS_CONFIG[approval.status];
                      const ApprovalIcon = approvalConfig.icon;
                      return (
                        <div key={approval.id} className="flex items-start justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <ApprovalIcon className={`h-4 w-4 ${
                              approval.status === 'approved' ? 'text-green-600' :
                              approval.status === 'rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`} />
                            <span>{toTitleCaseName(approval.lecturer?.user?.fullName || '')}</span>
                          </div>
                          <Badge variant={approvalConfig.variant} className="text-xs">
                            {approvalConfig.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const { allApproved, hasRejected } = getApprovalStatus(selectedRequest);
                    if (allApproved) {
                      return (
                        <div className="mt-2 p-2 bg-green-50 rounded-md text-green-800 text-xs flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Semua pembimbing telah menyetujui. Siap untuk approval Kadep.
                        </div>
                      );
                    }
                    if (hasRejected) {
                      return (
                        <div className="mt-2 p-2 bg-red-50 rounded-md text-red-800 text-xs flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Permintaan ditolak oleh salah satu pembimbing.
                        </div>
                      );
                    }
                    return (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-md text-yellow-800 text-xs flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Menunggu approval dari pembimbing.
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Alasan Pengajuan</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.status !== 'pending' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedRequest.status === 'approved' ? 'Catatan Persetujuan' : 'Alasan Penolakan'}
                  </p>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {selectedRequest.reviewNotes || '-'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Diajukan: {formatDateId(selectedRequest.createdAt)}</span>
                {selectedRequest.reviewedAt && (
                  <span>Diproses: {formatDateId(selectedRequest.reviewedAt)}</span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleReject(selectedRequest);
                  }}
                >
                  Tolak
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleApprove(selectedRequest);
                  }}
                  disabled={!canKadepApprove(selectedRequest)}
                  title={!canKadepApprove(selectedRequest) ? "Menunggu approval dari semua pembimbing" : undefined}
                >
                  Setujui
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Konfirmasi Persetujuan
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Anda akan menyetujui permintaan pergantian{' '}
                <strong>{REQUEST_TYPE_LABELS[selectedRequest?.requestType || '']}</strong> dari{' '}
                <strong>
                  {toTitleCaseName(selectedRequest?.thesis?.student?.user?.fullName || '')}
                </strong>.
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                <p className="font-medium">⚠️ Data yang akan dihapus:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  <li>Data pendaftaran tugas akhir</li>
                  <li>Semua riwayat bimbingan</li>
                  <li>Milestone dan progres</li>
                  <li>Dokumen terkait</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea
                  placeholder="Tambahkan catatan jika diperlukan..."
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setApproveNotes('')}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                'Ya, Setujui'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Permintaan</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Anda akan menolak permintaan pergantian dari{' '}
                <strong>
                  {toTitleCaseName(selectedRequest?.thesis?.student?.user?.fullName || '')}
                </strong>.
              </p>
              <div className="space-y-2">
                <Label>Alasan Penolakan (wajib, min. 10 karakter)</Label>
                <Textarea
                  placeholder="Jelaskan alasan penolakan..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="min-h-24"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectNotes('')}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={rejectMutation.isPending || rejectNotes.length < 10}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                'Tolak Permintaan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
