import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { RecordDetailDialog } from "@/components/shared/RecordDetailDialog";
import { TableIconAction } from "@/components/shared/TableIconAction";
import { ThesisStudentInfoCell } from "@/components/shared/ThesisTableCells";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { toTitleCaseName } from "@/lib/text";
import { DateTimeCell, TruncatedText } from "@/lib/guidanceCells";
import { useClientTable } from "@/hooks/shared/useClientTable";
import {
  getSupervisor2Requests,
  approveSupervisor2Request,
  rejectSupervisor2Request,
  type Supervisor2RequestItem,
} from "@/services/lecturerGuidance.service";
import { Check, Eye, X } from "lucide-react";

/**
 * "Permintaan Pembimbing 2" fase proposal, di halaman Tugas Akhir > Permohonan (Paket E4, 4.1).
 * Tabel dengan Setujui / Tolak di baris dan Detail di modal; tidak tampil bila kosong. Paket E5:
 * aksi berupa ikon dan lebar kolom tetap, seperti tabel Permohonan.
 */
export function Supervisor2RequestsSection() {
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: Supervisor2RequestItem | null }>({
    open: false,
    request: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [detail, setDetail] = useState<Supervisor2RequestItem | null>(null);

  const { data: requests = [] } = useQuery({
    queryKey: ["supervisor2-requests"],
    queryFn: getSupervisor2Requests,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveSupervisor2Request(requestId),
    onSuccess: (data) => {
      toast.success(data.message || "Permintaan disetujui");
      queryClient.invalidateQueries({ queryKey: ["supervisor2-requests"] });
      queryClient.invalidateQueries({ queryKey: ["lecturer-my-students"] });
    },
    onError: (error: Error) => {
      toast.error("Gagal menyetujui permintaan", { description: error.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      rejectSupervisor2Request(requestId, reason),
    onSuccess: (data) => {
      toast.success(data.message || "Permintaan ditolak");
      queryClient.invalidateQueries({ queryKey: ["supervisor2-requests"] });
      setRejectDialog({ open: false, request: null });
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast.error("Gagal menolak permintaan", { description: error.message });
    },
  });

  const table = useClientTable(requests, (row) => [row.studentName, row.studentNim, row.thesisTitle]);

  if (requests.length === 0) return null;

  const handleReject = () => {
    if (!rejectDialog.request) return;
    rejectMutation.mutate({
      requestId: rejectDialog.request.requestId,
      reason: rejectReason.trim() || undefined,
    });
  };

  const columns: Column<Supervisor2RequestItem>[] = [
    {
      key: "student",
      header: "Mahasiswa",
      width: 200,
      render: (row) => <ThesisStudentInfoCell name={row.studentName} nim={row.studentNim ?? ""} />,
    },
    { key: "title", header: "Judul", render: (row) => <TruncatedText text={row.thesisTitle} className="max-w-full" /> },
    { key: "requestedAt", header: "Tanggal Masuk", width: 120, render: (row) => <DateTimeCell date={row.requestedAt} /> },
    {
      key: "actions",
      header: "Aksi",
      width: 128,
      className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(row)} />
          <TableIconAction
            icon={Check}
            label="Setujui"
            tone="approve"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate(row.requestId)}
          />
          <TableIconAction icon={X} label="Tolak" disabled={rejectMutation.isPending} onClick={() => setRejectDialog({ open: true, request: row })} />
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-3" aria-labelledby="supervisor2-requests-title">
      <div>
        <h2 id="supervisor2-requests-title" className="text-lg font-semibold">Permintaan Pembimbing 2</h2>
        <p className="text-sm text-muted-foreground">Mahasiswa fase proposal yang meminta Anda menjadi Pembimbing 2</p>
      </div>

      <CustomTable
        columns={columns}
        data={table.pageRows}
        tableClassName="table-fixed min-w-[640px]"
        total={table.total}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        searchValue={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Cari nama, NIM, atau judul..."
        emptyText="Tidak ditemukan"
        rowKey={(row) => row.requestId}
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Permintaan Pembimbing 2"
      >
        {detail && (
          <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">Mahasiswa</dt>
            <dd className="[overflow-wrap:anywhere]">{toTitleCaseName(detail.studentName)}</dd>
            <dt className="text-muted-foreground">NIM</dt>
            <dd>{detail.studentNim || "-"}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="[overflow-wrap:anywhere]">{detail.studentEmail || "-"}</dd>
            <dt className="text-muted-foreground">Judul</dt>
            <dd className="[overflow-wrap:anywhere]">{detail.thesisTitle || "-"}</dd>
            <dt className="text-muted-foreground">Tanggal masuk</dt>
            <dd><DateTimeCell date={detail.requestedAt} /></dd>
          </dl>
        )}
      </RecordDetailDialog>

      {/* Reject Reason Dialog */}
      <AlertDialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, request: null });
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Permintaan Pembimbing 2</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Anda akan menolak permintaan dari{" "}
                  <span className="font-medium text-foreground">
                    {rejectDialog.request ? toTitleCaseName(rejectDialog.request.studentName) : ""}
                  </span>
                  .
                </p>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Alasan penolakan (opsional)
                  </label>
                  <Textarea
                    className="mt-1.5"
                    placeholder="Berikan alasan penolakan..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menolak...
                </>
              ) : (
                "Ya, Tolak"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
