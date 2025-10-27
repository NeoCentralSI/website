import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import type { ProgressDetailItem } from "@/services/studentGuidance.service";
import { completeStudentProgressComponents, getStudentProgressDetail } from "@/services/studentGuidance.service";
import { toast } from "sonner";
import { TabsNav } from "@/components/ui/tabs-nav";
import ProgressChecklist from "@/components/progress/ProgressChecklist";
import { getCache, setCache } from "@/lib/viewCache";

export default function StudentProgressPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, { label: "Progres" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const cached = getCache<ProgressDetailItem[]>("student-progress");
  const [loading, setLoading] = useState<boolean>(!cached);
  const [components, setComponents] = useState<ProgressDetailItem[]>(cached?.data ?? []);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const load = async () => {
    // Only show skeleton for cold start
    setLoading((prev) => (components.length === 0 ? true : prev));
    try {
      const data = await getStudentProgressDetail();
      const comps = data.components || [];
      setComponents(comps);
      setCache("student-progress", comps);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat progres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const submit = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) {
      toast.message("Pilih minimal satu komponen");
      return;
    }
    try {
      await completeStudentProgressComponents({ componentIds: ids });
      toast.success("Progres diperbarui");
      setSelected({});
      load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
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

      <ProgressChecklist
        items={components}
        loading={loading}
        selected={selected}
        onToggle={toggle}
        onCompleteSelected={submit}
        onCompleteOne={async (id: string) => {
          try {
            await completeStudentProgressComponents({ componentIds: [id] });
            toast.success("Komponen ditandai selesai");
            load();
          } catch (e: any) {
            toast.error(e?.message || "Gagal menyimpan");
          }
        }}
      />
    </div>
  );
}
