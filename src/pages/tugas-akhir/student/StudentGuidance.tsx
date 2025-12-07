import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav } from "@/components/ui/tabs-nav";
import type { GuidanceItem, GuidanceStatus, SupervisorsResponse } from "@/services/studentGuidance.service";
import { getStudentSupervisors, listStudentGuidance } from "@/services/studentGuidance.service";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import GuidanceDialog from "@/components/thesis/GuidanceDialog";
import DocumentPreviewDialog from "@/components/thesis/DocumentPreviewDialog";
import StatusBadge from "@/components/thesis/StatusBadge";
import { EyeIcon, FileTextIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import RequestGuidanceDialog from "@/components/thesis/RequestGuidanceDialog";

export default function StudentGuidancePage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as GuidanceStatus | "") || "";
  const initialQ = searchParams.get('q') || "";
  const initialSupervisor = searchParams.get('supervisor') || "";
  // Force newest-first on client (backend also returns newest-first)
  const initialPage = Number(searchParams.get('page') || 1);
  const initialLimit = Number(searchParams.get('limit') || 10);
  const [status, setStatus] = useState<GuidanceStatus | "">(initialStatus);
  const [q, setQ] = useState<string>(initialQ);
  const [supervisorFilter, setSupervisorFilter] = useState<string>(initialSupervisor);
  // no client-side toggle for sort; always newest first
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialLimit > 0 ? initialLimit : 10);
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["student-guidance", { status }],
    queryFn: async () => {
      const res = await listStudentGuidance({ status: status || undefined });
      return res.items as GuidanceItem[];
    },
  });
  const items: GuidanceItem[] = useMemo(() => (data ?? []) as GuidanceItem[], [data]);
  const [total, setTotal] = useState<number>(0);
  const [openRequest, setOpenRequest] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [docOpen, setDocOpen] = useState(false);
  const [docInfo, setDocInfo] = useState<{ fileName?: string | null; filePath?: string | null } | null>(null);
  // request dialog moved into a dedicated component
  // load supervisors for optional selection
  const supervisorsQuery = useQuery<{ data: SupervisorsResponse; supervisors: SupervisorsResponse["supervisors"] }>(
    {
      queryKey: ["student-supervisors"],
      queryFn: async () => {
        const res = await getStudentSupervisors();
        return { data: res, supervisors: res.supervisors } as any;
      },
    }
  );

  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  useEffect(() => {
    // refetch when server-driven filter changes (queryKey already changes too)
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    // persist UI state in URL (client-side filters and pagination)
    const sp = new URLSearchParams(searchParams);
    if (status) sp.set('status', status); else sp.delete('status');
    if (q) sp.set('q', q); else sp.delete('q');
    if (supervisorFilter) sp.set('supervisor', supervisorFilter); else sp.delete('supervisor');
    // always newest-first; do not persist sort in URL
    if (page && page !== 1) sp.set('page', String(page)); else sp.delete('page');
    if (pageSize && pageSize !== 10) sp.set('limit', String(pageSize)); else sp.delete('limit');
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, supervisorFilter, page, pageSize]);

  // derive filtered/sorted/paged data on client
  // Check if there's any pending request
  const hasPendingRequest = useMemo(() => {
    return items.some((item) => item.status === 'requested');
  }, [items]);

  const pendingRequestInfo = useMemo(() => {
    const pending = items.find((item) => item.status === 'requested');
    if (!pending) return null;
    const dateStr = pending.schedule?.guidanceDateFormatted || pending.scheduledAtFormatted || 
      (pending.schedule?.guidanceDate ? new Date(pending.schedule.guidanceDate).toLocaleString() : 
       (pending.scheduledAt ? new Date(pending.scheduledAt).toLocaleString() : 'belum ditentukan'));
    return {
      id: pending.id,
      dateStr,
      supervisorName: pending.supervisorName || 'Dosen',
    };
  }, [items]);

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
        const when = (it.schedule?.guidanceDateFormatted || it.scheduledAtFormatted || (it.schedule?.guidanceDate ? new Date(it.schedule.guidanceDate).toLocaleString() : (it.scheduledAt ? new Date(it.scheduledAt).toLocaleString() : ''))).toLowerCase();
        return sup.includes(needle) || statusText.includes(needle) || when.includes(needle);
      });
    }
    // enforce newest-first order on client as safeguard
    arr.sort((a, b) => {
      const at = a.schedule?.guidanceDate ? new Date(a.schedule.guidanceDate).getTime() : (a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0);
      const bt = b.schedule?.guidanceDate ? new Date(b.schedule.guidanceDate).getTime() : (b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0);
      return bt - at;
    });
    const totalCount = arr.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = arr.slice(start, end);
    return { slice, totalCount };
  }, [items, supervisorFilter, q, page, pageSize]);

  useEffect(() => {
    setTotal(display.totalCount);
  }, [display.totalCount]);

  // handled inside RequestGuidanceDialog

  return (
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Pembimbing', to: '/tugas-akhir/bimbingan/supervisors' },
        ]}
      />
      
      {hasPendingRequest && pendingRequestInfo && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 mb-1">Pengajuan Menunggu Response</h4>
              <p className="text-sm text-amber-800">
                Anda memiliki pengajuan bimbingan yang belum direspon oleh <strong>{pendingRequestInfo.supervisorName}</strong> (jadwal: <strong>{pendingRequestInfo.dateStr}</strong>). 
                Anda tidak dapat mengajukan bimbingan baru hingga pengajuan sebelumnya disetujui atau ditolak.
              </p>
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto mt-2 text-amber-900 hover:text-amber-700"
                onClick={() => {
                  setActiveId(pendingRequestInfo.id);
                  setOpenDetail(true);
                }}
              >
                Lihat Detail Pengajuan →
              </Button>
            </div>
          </div>
        </div>
      )}
      
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
            accessor: (r) => r.schedule?.guidanceDateFormatted || r.scheduledAtFormatted || (r.schedule?.guidanceDate ? new Date(r.schedule.guidanceDate).toLocaleString() : (r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '-')),
            // no client-side time filter; backend already returns newest first
          },
          {
            key: 'doc',
            header: 'Dokumen',
            render: (r) => {
              const f = r.document?.filePath || "";
              const isPdf = f.toLowerCase().endsWith(".pdf");
              return (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!isPdf}
                  onClick={() => {
                    setDocInfo({ fileName: r.document?.fileName, filePath: r.document?.filePath });
                    setDocOpen(true);
                  }}
                  title={isPdf ? `Lihat ${r.document?.fileName || 'dokumen'}` : 'Tidak ada dokumen PDF'}
                >
                  <FileTextIcon className="size-4" />
                </Button>
              );
            },
          },
          {
            key: 'status',
            header: 'Status',
            accessor: (r) => <StatusBadge status={r.status} />,
            filter: {
              type: 'select',
              value: status,
              onChange: (v: string) => { setStatus(v as GuidanceStatus | ""); setPage(1); },
              options: [
                { label: 'Semua', value: '' },
                { label: 'Menunggu', value: 'requested' },
                { label: 'Diterima', value: 'accepted' },
                { label: 'Ditolak', value: 'rejected' },
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
  loading={isLoading}
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
          <>
            <Button 
              onClick={() => setOpenRequest(true)}
              disabled={hasPendingRequest}
              title={hasPendingRequest 
                ? `Anda masih memiliki pengajuan yang belum direspon (${pendingRequestInfo?.dateStr}). Tunggu hingga dosen menyetujui atau menolak pengajuan tersebut.`
                : 'Ajukan bimbingan baru'
              }
            >
              Ajukan Bimbingan
            </Button>
          </>
        )}
      />

      <GuidanceDialog
        guidanceId={activeId}
        open={openDetail}
        onOpenChange={setOpenDetail}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["student-guidance"] })}
      />

      <DocumentPreviewDialog
        open={docOpen}
        onOpenChange={setDocOpen}
        fileName={docInfo?.fileName ?? undefined}
        filePath={docInfo?.filePath ?? undefined}
      />

      <RequestGuidanceDialog
        open={openRequest}
        onOpenChange={setOpenRequest}
        supervisors={supervisorsQuery.data?.supervisors || []}
        onSubmitted={() => {
          qc.invalidateQueries({ queryKey: ["student-guidance"] });
          qc.invalidateQueries({ queryKey: ["notification-unread"] });
        }}
      />
    </div>
  );
}
