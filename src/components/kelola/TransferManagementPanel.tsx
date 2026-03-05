import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
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
  Check,
  X,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  UserRound,
} from 'lucide-react';
import {
  getKadepPendingTransfers,
  getKadepAllTransfers,
  kadepApproveTransfer,
  kadepRejectTransfer,
  type KadepTransfer,
} from '@/services/monitoring.service';
import { toTitleCaseName, formatDateId } from '@/lib/text';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Ditolak Kadep', color: 'bg-red-500 text-white', icon: XCircle },
  target_rejected: { label: 'Ditolak Dosen Tujuan', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const STATUS_OPTIONS = [
  { label: 'Semua Status', value: '' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Ditolak Kadep', value: 'rejected' },
  { label: 'Ditolak Dosen Tujuan', value: 'target_rejected' },
];

type ViewMode = 'pending' | 'all';

export function TransferManagementPanel() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('pending');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedTransfer, setSelectedTransfer] = useState<KadepTransfer | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Pending transfers query
  const {
    data: pendingData,
    isLoading: isLoadingPending,
    isFetching: isFetchingPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['kadep-transfers-pending'],
    queryFn: getKadepPendingTransfers,
    enabled: viewMode === 'pending',
    refetchInterval: 30000,
  });

  // All transfers query (for history)
  const {
    data: allData,
    isLoading: isLoadingAll,
    isFetching: isFetchingAll,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ['kadep-transfers-all', page, pageSize, search, statusFilter],
    queryFn: () => getKadepAllTransfers({ page, pageSize, search, status: statusFilter }),
    enabled: viewMode === 'all',
  });

  const approveMutation = useMutation({
    mutationFn: (notificationId: string) => kadepApproveTransfer(notificationId),
    onSuccess: (data) => {
      toast.success(data.message || 'Transfer berhasil disetujui dan dilaksanakan');
      queryClient.invalidateQueries({ queryKey: ['kadep-transfers-pending'] });
      queryClient.invalidateQueries({ queryKey: ['kadep-transfers-all'] });
      setShowApproveDialog(false);
      setSelectedTransfer(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyetujui transfer');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ notificationId, reason }: { notificationId: string; reason?: string }) =>
      kadepRejectTransfer(notificationId, reason),
    onSuccess: (data) => {
      toast.success(data.message || 'Transfer berhasil ditolak');
      queryClient.invalidateQueries({ queryKey: ['kadep-transfers-pending'] });
      queryClient.invalidateQueries({ queryKey: ['kadep-transfers-all'] });
      setShowRejectDialog(false);
      setSelectedTransfer(null);
      setRejectReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menolak transfer');
    },
  });

  // Transform pending data to match table format
  const pendingTransfers = pendingData?.transfers ?? [];
  const allTransfers = allData?.data ?? [];

  const data = viewMode === 'pending' ? pendingTransfers : allTransfers;
  const isLoading = viewMode === 'pending' ? isLoadingPending : isLoadingAll;
  const isFetching = viewMode === 'pending' ? isFetchingPending : isFetchingAll;
  const refetch = viewMode === 'pending' ? refetchPending : refetchAll;
  const pagination = viewMode === 'all' ? allData?.pagination : undefined;

  const handleViewDetail = (t: KadepTransfer) => {
    setSelectedTransfer(t);
    setShowDetailDialog(true);
  };

  const handleApprove = (t: KadepTransfer) => {
    setSelectedTransfer(t);
    setShowApproveDialog(true);
  };

  const handleReject = (t: KadepTransfer) => {
    setSelectedTransfer(t);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (selectedTransfer) {
      approveMutation.mutate(selectedTransfer.notificationId);
    }
  };

  const confirmReject = () => {
    if (selectedTransfer) {
      rejectMutation.mutate({
        notificationId: selectedTransfer.notificationId,
        reason: rejectReason.trim() || undefined,
      });
    }
  };

  const columns: Column<KadepTransfer>[] = useMemo(() => {
    const baseColumns: Column<KadepTransfer>[] = [
      {
        key: 'dosenAsal',
        header: 'Dosen Asal',
        width: 160,
        render: (t) => (
          <span className="font-medium text-sm">
            {toTitleCaseName(t.sourceLecturerName)}
          </span>
        ),
      },
      {
        key: 'dosenTujuan',
        header: 'Dosen Tujuan',
        width: 160,
        render: (t) => (
          <span className="font-medium text-sm">
            {toTitleCaseName(t.targetLecturerName)}
          </span>
        ),
      },
      {
        key: 'mahasiswa',
        header: 'Mahasiswa',
        width: 200,
        render: (t) => (
          <div className="space-y-0.5">
            {t.students.slice(0, 3).map((s) => (
              <div key={s.thesisId} className="flex items-center gap-1 text-xs">
                <UserRound className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-medium">{toTitleCaseName(s.studentName)}</span>
                <span className="text-muted-foreground">({s.studentNim})</span>
              </div>
            ))}
            {t.students.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{t.students.length - 3} lainnya
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'approvalDosen',
        header: 'Approval Dosen Tujuan',
        width: 170,
        render: (t) => {
          if (t.status === 'target_rejected') {
            return (
              <Badge className="bg-red-100 text-red-800 text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Ditolak
              </Badge>
            );
          }
          if (t.targetApproved) {
            return (
              <Badge className="bg-green-100 text-green-800 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Disetujui
              </Badge>
            );
          }
          return (
            <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
              <Clock className="h-3 w-3 mr-1" />
              Menunggu
            </Badge>
          );
        },
      },
      {
        key: 'alasan',
        header: 'Alasan',
        render: (t) => (
          <p className="line-clamp-2 text-sm text-muted-foreground">{t.reason}</p>
        ),
      },
      {
        key: 'tanggal',
        header: 'Tanggal',
        width: 120,
        render: (t) => (
          <span className="text-xs text-muted-foreground">
            {formatDateId(t.createdAt)}
          </span>
        ),
      },
    ];

    // Add status column in 'all' view
    if (viewMode === 'all') {
      baseColumns.push({
        key: 'status',
        header: 'Status',
        width: 160,
        filter: {
          type: 'select',
          value: statusFilter,
          onChange: (v) => {
            setStatusFilter(v);
            setPage(1);
          },
          options: STATUS_OPTIONS,
        },
        render: (t) => {
          const config = STATUS_CONFIG[t.status] || STATUS_CONFIG.pending;
          const StatusIcon = config.icon;
          return (
            <Badge className={config.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          );
        },
      });
    }

    // Actions
    baseColumns.push({
      key: 'aksi',
      header: 'Aksi',
      width: 120,
      className: 'text-right',
      render: (t) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewDetail(t)}
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {t.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleApprove(t)}
                className={`text-green-600 hover:text-green-700 hover:bg-green-50 ${
                  !t.targetApproved ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={
                  t.targetApproved
                    ? 'Setujui Transfer'
                    : 'Menunggu approval dosen tujuan'
                }
                disabled={!t.targetApproved}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleReject(t)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Tolak"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    });

    return baseColumns;
  }, [viewMode, statusFilter]);

  const tableActions = (
    <div className="flex items-center gap-2">
      <RefreshButton
        onClick={() => refetch()}
        isRefreshing={isFetching && !isLoading}
      />
      <Button
        variant={viewMode === 'pending' ? 'default' : 'outline'}
        size="sm"
        onClick={() => {
          setViewMode('pending');
          setPage(1);
          setStatusFilter('');
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
        Riwayat Transfer
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <CustomTable
        columns={columns}
        data={data}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={viewMode === 'pending' ? pendingTransfers.length : (pagination?.total || 0)}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        enableColumnFilters={viewMode === 'all'}
        actions={tableActions}
        emptyText={
          viewMode === 'pending'
            ? 'Tidak ada permintaan transfer yang menunggu review'
            : 'Tidak ada data transfer'
        }
        rowKey={(row) => row.notificationId}
      />

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Permintaan Transfer</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              {/* Transfer direction */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground">Dosen Asal</p>
                  <p className="font-semibold text-sm">
                    {toTitleCaseName(selectedTransfer.sourceLecturerName)}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground">Dosen Tujuan</p>
                  <p className="font-semibold text-sm">
                    {toTitleCaseName(selectedTransfer.targetLecturerName)}
                  </p>
                </div>
              </div>

              {/* Approval status tracking */}
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">Status Approval</p>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>Dosen Tujuan</span>
                  {selectedTransfer.status === 'target_rejected' ? (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Ditolak
                    </Badge>
                  ) : selectedTransfer.targetApproved ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Disetujui
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      <Clock className="h-3 w-3 mr-1" />
                      Menunggu
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>Ketua Departemen</span>
                  {selectedTransfer.status === 'approved' ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Disetujui
                    </Badge>
                  ) : selectedTransfer.status === 'rejected' ? (
                    <Badge className="bg-red-500 text-white">
                      <XCircle className="h-3 w-3 mr-1" />
                      Ditolak
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      <Clock className="h-3 w-3 mr-1" />
                      Menunggu
                    </Badge>
                  )}
                </div>

                {selectedTransfer.targetApproved && selectedTransfer.status === 'pending' && (
                  <div className="mt-2 p-2 bg-green-50 rounded-md text-green-800 text-xs flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Dosen tujuan sudah menyetujui. Siap untuk approval Kadep.
                  </div>
                )}
                {!selectedTransfer.targetApproved && selectedTransfer.status === 'pending' && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded-md text-yellow-800 text-xs flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Menunggu persetujuan dosen tujuan terlebih dahulu.
                  </div>
                )}
              </div>

              {/* Students list */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Mahasiswa ({selectedTransfer.students.length})
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTransfer.students.map((s) => (
                    <div
                      key={s.thesisId}
                      className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded"
                    >
                      <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">{toTitleCaseName(s.studentName)}</p>
                        <p className="text-xs text-muted-foreground">{s.studentNim}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Alasan Transfer</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedTransfer.reason}</p>
              </div>

              <div className="text-xs text-muted-foreground">
                Diajukan: {formatDateId(selectedTransfer.createdAt)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            {selectedTransfer?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleReject(selectedTransfer);
                  }}
                >
                  Tolak
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleApprove(selectedTransfer);
                  }}
                  disabled={!selectedTransfer.targetApproved}
                  title={
                    !selectedTransfer.targetApproved
                      ? 'Menunggu approval dari dosen tujuan'
                      : undefined
                  }
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
            <AlertDialogTitle>Konfirmasi Persetujuan Transfer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Anda akan menyetujui transfer{' '}
                  <strong>{selectedTransfer?.students.length} mahasiswa</strong> dari{' '}
                  <strong>
                    {selectedTransfer ? toTitleCaseName(selectedTransfer.sourceLecturerName) : ''}
                  </strong>{' '}
                  ke{' '}
                  <strong>
                    {selectedTransfer ? toTitleCaseName(selectedTransfer.targetLecturerName) : ''}
                  </strong>
                  .
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <p className="font-medium text-sm">⚠️ Transfer akan langsung dilaksanakan:</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    <li>Pembimbing mahasiswa akan berubah</li>
                    <li>Mahasiswa akan menerima notifikasi</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
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
                'Ya, Setujui Transfer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Permintaan Transfer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Anda akan menolak permintaan transfer dari{' '}
                  <strong>
                    {selectedTransfer ? toTitleCaseName(selectedTransfer.sourceLecturerName) : ''}
                  </strong>{' '}
                  ke{' '}
                  <strong>
                    {selectedTransfer ? toTitleCaseName(selectedTransfer.targetLecturerName) : ''}
                  </strong>
                  .
                </p>
                <div className="space-y-2">
                  <Label>Alasan Penolakan (opsional)</Label>
                  <Textarea
                    placeholder="Berikan alasan penolakan..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-20"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason('')}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={rejectMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                'Tolak Transfer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
