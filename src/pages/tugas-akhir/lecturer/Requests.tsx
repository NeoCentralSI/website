import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Button } from "@/components/ui/button";
import type { GuidanceItem } from "@/services/lecturerGuidance.service";
import { getPendingRequests } from "@/services/lecturerGuidance.service";
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeIcon } from "lucide-react";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import DocumentPreviewDialog from "@/components/thesis/DocumentPreviewDialog";
import GuidanceRequestDetailDialog from "@/components/thesis/GuidanceRequestDetailDialog";
import StatusBadge from "@/components/thesis/StatusBadge";

export default function LecturerRequestsPage() {
  const qc = useQueryClient();
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
  
  const [q, setQ] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [docOpen, setDocOpen] = useState(false);
  const [docInfo, setDocInfo] = useState<{ fileName?: string | null; filePath?: string | null } | null>(null);
  
  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedGuidance, setSelectedGuidance] = useState<GuidanceItem | null>(null);

  useEffect(() => {
    // ensure data loaded once
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDetail = (guidance: GuidanceItem) => {
    setSelectedGuidance(guidance);
    setDetailOpen(true);
  };

  const handleDetailUpdated = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ["notification-unread"] });
  };

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
      accessor: (r) => {
        const fileName = (r as any)?.document?.fileName as string | undefined;
        return fileName || '-';
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
          { label: 'Menunggu', value: 'requested' },
          { label: 'Diterima', value: 'accepted' },
          { label: 'Ditolak', value: 'rejected' },
        ],
      },
    },
    {
      key: "action",
      header: "Aksi",
      render: (r) => (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          title="Detail"
          onClick={() => handleOpenDetail(r)}
        >
          <EyeIcon className="size-4" />
        </Button>
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

      <GuidanceRequestDetailDialog
        guidance={selectedGuidance}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={handleDetailUpdated}
        onViewDocument={(fileName, filePath) => {
          setDocInfo({ fileName, filePath });
          setDocOpen(true);
        }}
      />
    </div>
  );
}
