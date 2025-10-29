import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import type { ActivityLogItem } from "@/services/studentGuidance.service";
import { getStudentActivityLog } from "@/services/studentGuidance.service";
import { toast } from "sonner";
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery } from "@tanstack/react-query";

export default function ActivityLogPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, { label: "Aktivitas" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const { data, isLoading, error } = useQuery({
    queryKey: ["student-activity"],
    queryFn: async () => {
      const res = await getStudentActivityLog();
      return res.items as ActivityLogItem[];
    },
  });
  if (error) {
    toast.error((error as any)?.message || "Gagal memuat aktivitas");
  }
  const items: ActivityLogItem[] = useMemo(() => (data ?? []) as ActivityLogItem[], [data]);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<'' | 'asc' | 'desc'>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // no manual loading needed; useQuery handles caching

  // client-side compute display based on filters/search/sort/pagination
  const display = useMemo(() => {
    let arr = [...items];
    if (actionFilter) arr = arr.filter((it) => (it.action || '').toLowerCase() === actionFilter.toLowerCase());
    if (actorFilter) arr = arr.filter((it) => (it.actor || '-').toLowerCase() === actorFilter.toLowerCase());
    if (q) {
      const needle = q.toLowerCase();
      arr = arr.filter((it) => {
        const time = new Date(it.timestamp).toLocaleString().toLowerCase();
        const act = (it.action || '').toLowerCase();
        const who = (it.actor || '-').toLowerCase();
        return time.includes(needle) || act.includes(needle) || who.includes(needle);
      });
    }
    if (sortOrder) {
      arr.sort((a, b) => {
        const at = new Date(a.timestamp).getTime();
        const bt = new Date(b.timestamp).getTime();
        return sortOrder === 'asc' ? at - bt : bt - at;
      });
    }
    const totalCount = arr.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = arr.slice(start, end);
    return { slice, totalCount };
  }, [items, actionFilter, actorFilter, q, sortOrder, page, pageSize]);

  useEffect(() => {
    setTotal(display.totalCount);
  }, [display.totalCount]);

  const actionOptions = useMemo(() => [
    { label: 'Semua', value: '' },
    ...Array.from(new Set(items.map((it) => it.action || '-'))).map((v) => ({ label: String(v), value: String(v).toLowerCase() }))
  ], [items]);

  const actorOptions = useMemo(() => [
    { label: 'Semua', value: '' },
    ...Array.from(new Set(items.map((it) => it.actor || '-'))).map((v) => ({ label: String(v), value: String(v).toLowerCase() }))
  ], [items]);

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

      <CustomTable<ActivityLogItem>
        columns={[
          {
            key: 'time',
            header: 'Waktu',
            accessor: (r) => new Date(r.timestamp).toLocaleString(),
            filter: {
              type: 'select',
              value: sortOrder,
              onChange: (v: string) => { setSortOrder(v as '' | 'asc' | 'desc'); setPage(1); },
              options: [
                { label: 'Default', value: '' },
                { label: 'Ascending', value: 'asc' },
                { label: 'Descending', value: 'desc' },
              ]
            }
          },
          {
            key: 'action',
            header: 'Aksi',
            accessor: (r) => r.action,
            filter: {
              type: 'select',
              value: actionFilter,
              onChange: (v: string) => { setActionFilter(v); setPage(1); },
              options: actionOptions,
            }
          },
          {
            key: 'actor',
            header: 'Pelaku',
            accessor: (r) => r.actor || '-',
            filter: {
              type: 'select',
              value: actorFilter,
              onChange: (v: string) => { setActorFilter(v); setPage(1); },
              options: actorOptions,
            }
          },
        ] as Column<ActivityLogItem>[]}
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
        emptyText={q || actionFilter || actorFilter ? 'Tidak ditemukan' : 'Tidak ada data'}
      />
    </div>
  );
}
