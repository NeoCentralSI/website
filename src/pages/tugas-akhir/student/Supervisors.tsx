import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import type { SupervisorItem } from "@/services/studentGuidance.service";
import { getStudentSupervisors } from "@/services/studentGuidance.service";
import { toast } from "sonner";
import { TabsNav } from "@/components/ui/tabs-nav";

export default function SupervisorsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, { label: "Pembimbing" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SupervisorItem[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getStudentSupervisors();
      setItems(data.supervisors);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat pembimbing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(!loading && items.length === 0) && (
          <div className="text-sm text-muted-foreground">Belum ada data pembimbing</div>
        )}
        {items.map((s) => (
          <Card key={s.id} className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {s.name?.split(" ").map((p) => p[0]).join("")?.slice(0,2) || "P"}
            </div>
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.email || '-'}</div>
            </div>
          </Card>
        ))}
        </div>
      </div>
  );
}
