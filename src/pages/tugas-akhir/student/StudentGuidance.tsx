import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav } from "@/components/ui/tabs-nav";
import type { GuidanceItem, GuidanceStatus } from "@/services/studentGuidance.service";
import { listStudentGuidance, requestStudentGuidance } from "@/services/studentGuidance.service";
import { toast } from "sonner";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import GuidanceDialog from "@/components/guidance/GuidanceDialog";
import { EyeIcon } from "lucide-react";
import { getCache, setCache } from "@/lib/viewCache";

export default function StudentGuidancePage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as GuidanceStatus | "") || "";
  const initialQ = searchParams.get('q') || "";
  const initialSupervisor = searchParams.get('supervisor') || "";
  const initialSort = (searchParams.get('sort') as 'asc' | 'desc' | '') || "";
  const initialPage = Number(searchParams.get('page') || 1);
  const initialLimit = Number(searchParams.get('limit') || 10);
  const [status, setStatus] = useState<GuidanceStatus | "">(initialStatus);
  const [q, setQ] = useState<string>(initialQ);
  const [supervisorFilter, setSupervisorFilter] = useState<string>(initialSupervisor);
  const [sortOrder, setSortOrder] = useState<'' | 'asc' | 'desc'>(initialSort);
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialLimit > 0 ? initialLimit : 10);
  const cached = getCache<GuidanceItem[]>("student-guidance");
  const [loading, setLoading] = useState<boolean>(!cached);
  const [items, setItems] = useState<GuidanceItem[]>(cached?.data ?? []);
  const [total, setTotal] = useState<number>(0);
  const [openRequest, setOpenRequest] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState({
    preferredTime: "",
    note: "",
  });

  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const fetchAll = async () => {
    // Only show skeleton on cold start
    setLoading((prev) => (items.length === 0 ? true : prev));
    try {
      const guidances = await listStudentGuidance({ status: status || undefined });
      setItems(guidances.items);
      setCache("student-guidance", guidances.items);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch when server-driven filter changes
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    // persist UI state in URL (client-side filters and pagination)
    const sp = new URLSearchParams(searchParams);
    if (status) sp.set('status', status); else sp.delete('status');
    if (q) sp.set('q', q); else sp.delete('q');
    if (supervisorFilter) sp.set('supervisor', supervisorFilter); else sp.delete('supervisor');
    if (sortOrder) sp.set('sort', sortOrder); else sp.delete('sort');
    if (page && page !== 1) sp.set('page', String(page)); else sp.delete('page');
    if (pageSize && pageSize !== 10) sp.set('limit', String(pageSize)); else sp.delete('limit');
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, supervisorFilter, sortOrder, page, pageSize]);

  // derive filtered/sorted/paged data on client
  const display = useMemo(() => {
    let arr = [...items];
    if (supervisorFilter) {
      arr = arr.filter((it) => (it.supervisorName || it.supervisorId || '').toLowerCase() === supervisorFilter.toLowerCase());
    }
    if (q) {
      const needle = q.toLowerCase();
      arr = arr.filter((it) => {
        const sup = (it.supervisorName || it.supervisorId || '').toString().toLowerCase();
        const statusText = it.status.toString().toLowerCase();
        const when = it.scheduledAt ? new Date(it.scheduledAt).toLocaleString().toLowerCase() : '';
        return sup.includes(needle) || statusText.includes(needle) || when.includes(needle);
      });
    }
    if (sortOrder) {
      arr.sort((a, b) => {
        const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return sortOrder === 'asc' ? at - bt : bt - at;
      });
    }
    const totalCount = arr.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = arr.slice(start, end);
    return { slice, totalCount };
  }, [items, supervisorFilter, q, sortOrder, page, pageSize]);

  useEffect(() => {
    setTotal(display.totalCount);
  }, [display.totalCount]);

  const submitRequest = async () => {
    try {
      if (!form.preferredTime) {
        toast.error("Isi waktu bimbingan");
        return;
      }
      await requestStudentGuidance({ guidanceDate: form.preferredTime, studentNotes: form.note });
      toast.success("Pengajuan bimbingan terkirim");
      setOpenRequest(false);
      setForm({ preferredTime: "", note: "" });
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengajukan bimbingan");
    }
  };

  return (
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Progres', to: '/tugas-akhir/bimbingan/progress' },
          { label: 'Aktivitas', to: '/tugas-akhir/bimbingan/activity' },
          { label: 'Pembimbing', to: '/tugas-akhir/bimbingan/supervisors' },
        ]}
      />
      <CustomTable<GuidanceItem>
        columns={[
          {
            key: 'supervisor',
            header: 'Pembimbing',
            accessor: (r) => r.supervisorName || r.supervisorId || '-',
            filter: {
              type: 'select',
              value: supervisorFilter,
              onChange: (v: string) => { setSupervisorFilter(v); setPage(1); },
              options: [
                { label: 'Semua', value: '' },
                ...Array.from(new Set(items.map((it) => (it.supervisorName || it.supervisorId || '-'))))
                  .map((name) => ({ label: String(name), value: String(name) }))
              ]
            }
          },
          {
            key: 'time',
            header: 'Waktu',
            accessor: (r) => (r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '-'),
            filter: {
              type: 'select',
              value: sortOrder,
              onChange: (v: string) => { setSortOrder((v as 'asc' | 'desc' | '')); setPage(1); },
              options: [
                { label: 'Default', value: '' },
                { label: 'Ascending', value: 'asc' },
                { label: 'Descending', value: 'desc' },
              ]
            }
          },
          {
            key: 'status',
            header: 'Status',
            accessor: (r) => <span className="capitalize">{r.status}</span>,
            filter: {
              type: 'select',
              value: status,
              onChange: (v: string) => { setStatus(v as GuidanceStatus | ""); setPage(1); },
              options: [
                { label: 'Semua', value: '' },
                { label: 'Terjadwal', value: 'scheduled' },
                { label: 'Selesai', value: 'completed' },
                { label: 'Dibatalkan', value: 'cancelled' },
              ]
            }
          },
          {
            key: 'action',
            header: 'Aksi',
            render: (r) => (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => { setActiveId(r.id); setOpenDetail(true); }}
                title="Detail"
              >
                <EyeIcon className="size-4" />
              </Button>
            )
          },
        ] as Column<GuidanceItem>[]}
        data={display.slice}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
  enableColumnFilters
  searchValue={q}
  onSearchChange={(v) => { setQ(v); setPage(1); }}
  emptyText={q || supervisorFilter ? 'Tidak ditemukan' : 'Tidak ada data'}
        actions={(
          <Dialog open={openRequest} onOpenChange={setOpenRequest}>
            <DialogTrigger asChild>
              <Button>Ajukan Bimbingan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajukan Bimbingan</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Waktu Bimbingan</Label>
                  <Input type="datetime-local" value={form.preferredTime} onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))} />
                  <span className="text-xs text-muted-foreground">Pembimbing akan dipilih otomatis oleh sistem.</span>
                </div>
                <div className="grid gap-2">
                  <Label>Catatan</Label>
                  <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="secondary" onClick={() => setOpenRequest(false)}>Batal</Button>
                  <Button onClick={submitRequest}>Kirim</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      />

      <GuidanceDialog
        guidanceId={activeId}
        open={openDetail}
        onOpenChange={setOpenDetail}
        onUpdated={() => fetchAll()}
      />
    </div>
  );
}
