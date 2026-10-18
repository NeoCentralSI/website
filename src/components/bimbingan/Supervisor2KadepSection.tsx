import { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { DetailDialogActions } from "@/components/shared/DetailDialogActions";
import { RecordDetailDialog } from "@/components/shared/RecordDetailDialog";
import { SupervisionLoadBadge } from "@/components/shared/SupervisionLoadBadge";
import { TableIconAction } from "@/components/shared/TableIconAction";
import { ThesisStudentInfoCell } from "@/components/shared/ThesisTableCells";
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
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { haystack, useLocalTable } from "@/hooks/shared/useLocalTable";
import { useSupervisionLoadOverview } from "@/hooks/thesis-proposal/useSupervisionQuota";
import { DateTimeCell, TruncatedText } from "@/lib/guidanceCells";
import { ACTIONS_3_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from "@/lib/tableColumnWidths";
import { formatLecturerName, toTitleCaseName } from "@/lib/text";
import type { SupervisionLoadLevel } from "@/lib/thesisLabels";
import {
  approveSupervisor2KadepRequest,
  getSupervisor2KadepRequests,
  rejectSupervisor2KadepRequest,
  type Supervisor2KadepRequestItem,
} from "@/services/lecturerGuidance.service";

const CLOSED_INTAKE = "Dosen sedang menutup penerimaan permintaan pembimbing.";
const FULL_NOTE = "Calon Pembimbing 2 sudah mencapai batas bimbingan. Persetujuan tetap dapat diberikan.";

type Decision = { mode: "approve" | "reject"; request: Supervisor2KadepRequestItem } | null;

/**
 * Tab "Permintaan Pembimbing 2" di Penetapan Pembimbing (Paket P8: tabel). Dosen tujuan sudah
 * menyatakan bersedia; Ketua Departemen menetapkan secara resmi. Dosen yang penuh tidak
 * memblokir (Kadep yang memutuskan); hanya dosen yang menutup penerimaan. Beban yang gagal dibaca
 * tidak memblokir. Bila Penetapan Pembimbing periode itu sudah terbit, terbitkan versi barunya.
 */
export function Supervisor2KadepSection() {
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<Supervisor2KadepRequestItem | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [rejectReason, setRejectReason] = useState("");

  const requests = useQuery({ queryKey: ["kadep-supervisor2-requests"], queryFn: getSupervisor2KadepRequests });
  const { data: loadOverview, isLoading: loadLoading, isError: loadError } = useSupervisionLoadOverview();
  const table = useLocalTable(requests.data ?? [], (row, term) => haystack(row.studentName, row.studentNim, row.thesisTitle, row.lecturerName).includes(term));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["kadep-supervisor2-requests"] });
    queryClient.invalidateQueries({ queryKey: ["supervision-quotas"] });
  };
  const finish = () => { setDecision(null); setDetail(null); setRejectReason(""); invalidate(); };

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveSupervisor2KadepRequest(requestId),
    onSuccess: (data) => { toast.success(data.message || "Pembimbing 2 disetujui."); finish(); },
    onError: (error: Error) => toast.error("Gagal menyetujui", { description: error.message }),
  });
  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) => rejectSupervisor2KadepRequest(requestId, reason),
    onSuccess: (data) => { toast.success(data.message || "Permintaan tidak disetujui."); finish(); },
    onError: (error: Error) => toast.error("Gagal menolak", { description: error.message }),
  });
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  /** The candidate's load against the limit in force, and whether intake is closed (fail open). */
  const gateOf = (lecturerId: string) => {
    const row = loadOverview?.lecturers.find((lecturer) => lecturer.lecturerId === lecturerId);
    if (loadError || !row) return { blocked: false, checking: loadLoading, load: null, quotaFull: false };
    const hardLimit = loadOverview?.applicable.hardLimit ?? 0;
    return {
      blocked: !row.acceptingRequests,
      checking: false,
      load: { activeCount: row.activeCount, hardLimit, level: row.level as SupervisionLoadLevel },
      quotaFull: row.level === "full" && row.acceptingRequests,
    };
  };

  const columns: Column<Supervisor2KadepRequestItem>[] = [
    { key: "student", header: "Mahasiswa", width: 190, className: CLIP_CELL, render: (row) => <ThesisStudentInfoCell name={row.studentName} nim={row.studentNim ?? ""} /> },
    { key: "title", header: "Judul", className: CLIP_CELL, render: (row) => <TruncatedText text={row.thesisTitle} className="max-w-full" /> },
    {
      key: "lecturer",
      header: "Calon Pembimbing 2",
      width: 220,
      className: CLIP_CELL,
      render: (row) => {
        const gate = gateOf(row.lecturerId);
        return (
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm" title={formatLecturerName(row.lecturerName)}>{formatLecturerName(row.lecturerName)}</p>
            {gate.load ? (
              <SupervisionLoadBadge {...gate.load} className="whitespace-nowrap" />
            ) : gate.checking ? (
              <p className="text-xs text-muted-foreground">Memeriksa beban…</p>
            ) : null}
            {gate.blocked && <p className="truncate text-xs text-destructive" title={CLOSED_INTAKE}>Penerimaan ditutup dosen</p>}
          </div>
        );
      },
    },
    { key: "requestedAt", header: "Dosen Bersedia", width: DATE_COLUMN_WIDTH, className: CLIP_CELL, render: (row) => <DateTimeCell date={row.requestedAt} /> },
    {
      key: "actions",
      header: "Aksi",
      width: ACTIONS_3_WIDTH,
      className: "text-center",
      render: (row) => {
        const gate = gateOf(row.lecturerId);
        return (
          <div className="flex items-center justify-center gap-1">
            <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(row)} />
            <TableIconAction
              icon={Check}
              label="Setujui"
              tone="approve"
              disabled={isPending || gate.blocked}
              disabledReason={gate.blocked ? CLOSED_INTAKE : null}
              onClick={() => setDecision({ mode: "approve", request: row })}
            />
            <TableIconAction icon={X} label="Tolak" disabled={isPending} onClick={() => setDecision({ mode: "reject", request: row })} />
          </div>
        );
      },
    },
  ];

  const detailGate = detail ? gateOf(detail.lecturerId) : null;
  const decisionGate = decision ? gateOf(decision.request.lecturerId) : null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Dosen tujuan telah menyatakan bersedia. Persetujuan Anda menetapkan Pembimbing 2 secara resmi. Bila Penetapan Pembimbing
        periode itu sudah diterbitkan, terbitkan versi barunya agar memuat susunan pembimbing terbaru.
      </p>
      <CustomTable
        columns={columns}
        {...table.tableProps}
        loading={requests.isLoading}
        isRefreshing={requests.isFetching && !requests.isLoading}
        subtleRefresh
        tableClassName="table-fixed min-w-[1000px]"
        searchPlaceholder="Cari nama, NIM, judul, atau dosen..."
        emptyText={table.search ? "Tidak ditemukan" : "Tidak ada permintaan Pembimbing 2 yang menunggu persetujuan."}
        rowKey={(row) => row.requestId}
        actions={<RefreshButton onClick={() => void requests.refetch()} isRefreshing={requests.isFetching && !requests.isLoading} />}
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Permintaan Pembimbing 2"
        description={detail ? `${toTitleCaseName(detail.studentName)} · ${detail.studentNim ?? "-"}` : undefined}
        footer={detail ? (
          <DetailDialogActions
            onClose={() => setDetail(null)}
            note={detailGate?.blocked ? CLOSED_INTAKE : detailGate?.quotaFull ? FULL_NOTE : undefined}
            noteClassName={detailGate?.blocked ? "text-destructive" : undefined}
          >
            <Button size="sm" variant="destructive" disabled={isPending} onClick={() => setDecision({ mode: "reject", request: detail })}>Tolak</Button>
            <Button size="sm" disabled={isPending || Boolean(detailGate?.blocked)} onClick={() => setDecision({ mode: "approve", request: detail })}>Setujui</Button>
          </DetailDialogActions>
        ) : undefined}
      >
        {detail && (
          <dl className="space-y-2 text-sm">
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr]"><dt className="text-xs text-muted-foreground">Judul</dt><dd className="[overflow-wrap:anywhere]">{detail.thesisTitle}</dd></div>
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr]"><dt className="text-xs text-muted-foreground">Calon Pembimbing 2</dt><dd>{formatLecturerName(detail.lecturerName)}</dd></div>
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <dt className="text-xs text-muted-foreground">Beban calon</dt>
              <dd>{detailGate?.load ? <SupervisionLoadBadge {...detailGate.load} /> : <span className="text-muted-foreground">Tidak terbaca</span>}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr]"><dt className="text-xs text-muted-foreground">Dosen bersedia</dt><dd><DateTimeCell date={detail.requestedAt} /></dd></div>
          </dl>
        )}
      </RecordDetailDialog>

      <AlertDialog open={!!decision} onOpenChange={(open) => { if (!open) { setDecision(null); setRejectReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{decision?.mode === "approve" ? "Setujui Pembimbing 2?" : "Tolak Permintaan Pembimbing 2?"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {decision?.mode === "approve" ? (
                  <p>
                    <span className="font-medium text-foreground">{formatLecturerName(decision.request.lecturerName)}</span> ditetapkan sebagai Pembimbing 2 untuk{" "}
                    <span className="font-medium text-foreground">{toTitleCaseName(decision.request.studentName)}</span>. Bila Penetapan Pembimbing periode itu sudah
                    terbit, terbitkan versi barunya agar memuat Pembimbing 2.
                    {decisionGate?.quotaFull ? ` ${FULL_NOTE}` : ""}
                  </p>
                ) : decision ? (
                  <>
                    <p>
                      Permintaan Pembimbing 2 dari <span className="font-medium text-foreground">{toTitleCaseName(decision.request.studentName)}</span> (dosen:{" "}
                      {formatLecturerName(decision.request.lecturerName)}) ditutup. Mahasiswa dan dosen mendapat notifikasi.
                    </p>
                    <div>
                      <label htmlFor="supervisor2-reject-reason" className="text-sm font-medium text-foreground">Alasan (opsional)</label>
                      <Textarea id="supervisor2-reject-reason" className="mt-1.5" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                    </div>
                  </>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending || (decision?.mode === "approve" && Boolean(decisionGate?.blocked))}
              className={decision?.mode === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={() => {
                if (!decision) return;
                if (decision.mode === "approve") approveMutation.mutate(decision.request.requestId);
                else rejectMutation.mutate({ requestId: decision.request.requestId, reason: rejectReason.trim() || undefined });
              }}
            >
              {isPending ? <><Spinner className="mr-2 h-4 w-4" />Memproses...</> : decision?.mode === "approve" ? "Ya, Setujui" : "Ya, Tolak"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
