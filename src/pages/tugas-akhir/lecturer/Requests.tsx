import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
import type { GuidanceItem } from "@/services/lecturerGuidance.service";
import { getPendingRequests } from "@/services/lecturerGuidance.service";
// import { toast } from "sonner";
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery } from "@tanstack/react-query";
import { EyeIcon, FileTextIcon } from "lucide-react";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import DocumentPreviewDialog from "@/components/thesis/DocumentPreviewDialog";
import StatusBadge from "@/components/thesis/StatusBadge";

export default function LecturerRequestsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }, { label: "Permintaan" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  // const qc = useQueryClient();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const { data, isLoading, refetch } = useQuery<{ success: boolean; page: number; pageSize: number; total: number; totalPages: number; requests: GuidanceItem[] }>({
    queryKey: ["lecturer-requests", page, pageSize],
    queryFn: async () => {
      return getPendingRequests({ page, pageSize });
    },
    placeholderData: (prev) => prev as any,
  });
  // const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  // const [rejectMsg, setRejectMsg] = useState("");
  const [q, setQ] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [docOpen, setDocOpen] = useState(false);
  const [docInfo, setDocInfo] = useState<{ fileName?: string | null; filePath?: string | null } | null>(null);
  // page & pageSize state moved above

  useEffect(() => {
    // ensure data loaded once
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actions approve/reject removed for this view to match requested minimalist table

  // Client-side filter + sort newest-first, then paginate via CustomTable controls
  const items = useMemo(() => {
    let arr = [...((data?.requests ?? []) as GuidanceItem[])];
    if (studentFilter) {
      arr = arr.filter((it) => toTitleCaseName(it.studentName || it.studentId || "-") === studentFilter);
    }
    if (statusFilter) {
      arr = arr.filter((it) => (it.status || '').toLowerCase() === statusFilter.toLowerCase());
    }
    if (q) {
      const needle = q.toLowerCase();
      arr = arr.filter((it) => {
        const name = toTitleCaseName(it.studentName || it.studentId || "").toLowerCase();
        const when = (
          (it as any)?.scheduledAtFormatted ||
          (it as any)?.schedule?.guidanceDateFormatted ||
          (it.scheduledAt ? formatDateId(it.scheduledAt) : "")
        ).toLowerCase();
        const notes = String((it as any)?.notes ?? '').toLowerCase();
        return name.includes(needle) || when.includes(needle) || notes.includes(needle);
      });
    }
    arr.sort((a, b) => {
      const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : (a as any)?.schedule?.guidanceDate ? new Date((a as any).schedule.guidanceDate).getTime() : 0;
      const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : (b as any)?.schedule?.guidanceDate ? new Date((b as any).schedule.guidanceDate).getTime() : 0;
      return bt - at;
    });
    return arr;
  }, [data?.requests, q, statusFilter, studentFilter]);

  const columns: Column<GuidanceItem>[] = [
    {
      key: "tanggal",
      header: "Tanggal",
      accessor: (r) => (r as any)?.scheduledAtFormatted || (r as any)?.schedule?.guidanceDateFormatted || (r.scheduledAt ? formatDateId(r.scheduledAt) : "-"),
    },
    {
      key: "student",
      header: "Mahasiswa",
      accessor: (r) => toTitleCaseName(r.studentName || r.studentId || "-"),
      filter: {
        type: 'select',
        value: studentFilter,
        onChange: (v: string) => { setStudentFilter(v); setPage(1); },
        options: [
          { label: 'Semua', value: '' },
          ...Array.from(new Set(((data?.requests ?? []) as GuidanceItem[]).map((it) => toTitleCaseName(it.studentName || it.studentId || '-')))).map((name) => ({ label: name, value: name }))
        ],
      },
    },
    {
      key: "notes",
      header: "Catatan",
      accessor: (r) => String((r as any)?.notes ?? '-') as any,
    },
    {
      key: "doc",
      header: "Dokumen",
      render: (r) => {
        const fileName = (r as any)?.document?.fileName as string | undefined;
        const filePath = (r as any)?.document?.filePath as string | undefined;
        const isPdf = Boolean(filePath && filePath.toLowerCase().endsWith(".pdf"));
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!isPdf}
            onClick={() => { if (fileName && filePath) { setDocInfo({ fileName, filePath }); setDocOpen(true); } }}
            title={isPdf ? `Lihat ${fileName || 'dokumen'}` : 'Tidak ada dokumen PDF'}
          >
            <FileTextIcon className="size-4" />
          </Button>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => <StatusBadge status={r.status as any} />,
      filter: {
        type: 'select',
        value: statusFilter,
        onChange: (v: string) => { setStatusFilter(v); setPage(1); },
        options: [
          { label: 'Semua', value: '' },
          { label: 'Terjadwal', value: 'scheduled' },
          { label: 'Selesai', value: 'completed' },
          { label: 'Dibatalkan', value: 'cancelled' },
        ],
      },
    },
    {
      key: "action",
      header: "Aksi",
      render: (r) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Detail">
              <EyeIcon className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Permintaan</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Mahasiswa:</span> {toTitleCaseName((r as any)?.studentName || (r as any)?.studentId || '-')}</div>
              <div><span className="text-muted-foreground">Tanggal:</span> {(r as any)?.scheduledAtFormatted || (r as any)?.schedule?.guidanceDateFormatted || ((r as any)?.scheduledAt ? formatDateId((r as any).scheduledAt as string) : '-')}</div>
              <div><span className="text-muted-foreground">Catatan:</span> {(r as any)?.notes || '-'}</div>
              <div><span className="text-muted-foreground">Diminta:</span> {(r as any)?.requestedAtFormatted || ((r as any)?.requestedAt ? formatDateId((r as any).requestedAt as string) : '-')}</div>
              { (r as any)?.meetingUrl ? (<div><span className="text-muted-foreground">Meeting URL:</span> {(r as any).meetingUrl}</div>) : null }
            </div>
          </DialogContent>
        </Dialog>
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
        data={items}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        searchValue={q}
        onSearchChange={(v) => { setQ(v); setPage(1); }}
        emptyText={q ? 'Tidak ditemukan' : 'Tidak ada permintaan'}
        enableColumnFilters
      />

      <DocumentPreviewDialog
        open={docOpen}
        onOpenChange={setDocOpen}
        fileName={docInfo?.fileName || undefined}
        filePath={docInfo?.filePath || undefined}
      />
    </div>
  );
}
