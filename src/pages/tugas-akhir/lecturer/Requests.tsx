import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { GuidanceItem } from "@/services/lecturerGuidance.service";
import { approveGuidanceRequest, getPendingRequests, rejectGuidanceRequest } from "@/services/lecturerGuidance.service";
import { toast } from "sonner";
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGuidanceRealtime } from "@/hooks/useGuidanceRealtime";

export default function LecturerRequestsPage() {
  // Enable realtime WS for lecturer to receive toasts and auto-refresh
  useGuidanceRealtime();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }, { label: "Permintaan" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["lecturer-requests"],
    queryFn: async () => {
      const res = await getPendingRequests();
      return res.requests as GuidanceItem[];
    },
  });
  const items: GuidanceItem[] = useMemo(() => (data ?? []) as GuidanceItem[], [data]);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectMsg, setRejectMsg] = useState("");
  const [q, setQ] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    // ensure data loaded once
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doApprove = async (id: string) => {
    try {
      await approveGuidanceRequest(id);
      toast.success("Permintaan disetujui");
      qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyetujui");
    }
  };

  const doReject = async () => {
    if (!rejectOpen) return;
    try {
      await rejectGuidanceRequest(rejectOpen, { message: rejectMsg });
      toast.success("Permintaan ditolak");
      setRejectOpen(null);
      setRejectMsg("");
      qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
    } catch (e: any) {
      toast.error(e?.message || "Gagal menolak");
    }
  };

  // Client-side filter + pagination using CustomTable
  const display = useMemo(() => {
    let arr = [...items];
    if (q) {
      const needle = q.toLowerCase();
      arr = arr.filter((it) => {
        const name = (it.studentName || it.studentId || "").toString().toLowerCase();
        const req = it.requestedAt ? new Date(it.requestedAt).toLocaleString().toLowerCase() : "";
        const sched = it.scheduledAt ? new Date(it.scheduledAt).toLocaleString().toLowerCase() : "";
        return name.includes(needle) || req.includes(needle) || sched.includes(needle);
      });
    }
    // newest-first by requestedAt then scheduledAt
    arr.sort((a, b) => {
      const at = a.requestedAt ? new Date(a.requestedAt).getTime() : (a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0);
      const bt = b.requestedAt ? new Date(b.requestedAt).getTime() : (b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0);
      return bt - at;
    });
    const totalCount = arr.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = arr.slice(start, end);
    return { slice, totalCount };
  }, [items, q, page, pageSize]);

  const columns: Column<GuidanceItem>[] = [
    {
      key: "student",
      header: "Mahasiswa",
      accessor: (r) => r.studentName || r.studentId || "-",
    },
    {
      key: "requested",
      header: "Diminta",
      accessor: (r) => (r.requestedAt ? new Date(r.requestedAt).toLocaleString() : "-"),
    },
    {
      key: "scheduled",
      header: "Terjadwal",
      accessor: (r) => (r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : "-"),
    },
    {
      key: "action",
      header: "Aksi",
      render: (r) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => doApprove(r.id)}>Setujui</Button>
          <Dialog open={rejectOpen === r.id} onOpenChange={(o) => setRejectOpen(o ? r.id : null)}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">Tolak</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alasan Penolakan</DialogTitle>
              </DialogHeader>
              <Input value={rejectMsg} onChange={(e) => setRejectMsg(e.target.value)} placeholder="Masukkan alasan" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setRejectOpen(null)}>Batal</Button>
                <Button variant="destructive" onClick={doReject}>Kirim</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <TabsNav
        tabs={[
          { label: 'Permintaan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
          { label: 'Progres', to: '/tugas-akhir/bimbingan/lecturer/progress' },
          { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
          { label: 'Eligibility', to: '/tugas-akhir/bimbingan/lecturer/eligibility' },
        ]}
      />

      <CustomTable<GuidanceItem>
        columns={columns}
        data={display.slice}
        loading={isLoading}
        total={display.totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        searchValue={q}
        onSearchChange={(v) => { setQ(v); setPage(1); }}
        emptyText={q ? 'Tidak ditemukan' : 'Tidak ada permintaan'}
      />
    </div>
  );
}
